import express from 'express';
import User from '../models/User.js';
import Ad from '../models/Ad.js';
import { protect, optionalAuth } from '../middleware/auth.js';
import { uploadSingle } from '../middleware/upload.js';
import { uploadImage } from '../config/cloudinary.js';
import { validateId, validatePagination } from '../middleware/validation.js';
import { query } from '../config/database.js';

const router = express.Router();

// @desc    Get user profile
// @route   GET /api/users/:id
// @access  Public
router.get('/:id', optionalAuth, validateId, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user stats
    const stats = await User.getStats(req.params.id);

    // Get user's recent ads
    const recentAds = await Ad.getUserAds(req.params.id, 1, 6);

    // Check if current user has favorited any of this user's ads
    let favoritedAds = [];
    if (req.user) {
      const favoritesResult = await query(`
        SELECT ad_id FROM favorites 
        WHERE user_id = $1 AND ad_id IN (
          SELECT id FROM ads WHERE user_id = $2 LIMIT 6
        )
      `, [req.user.id, req.params.id]);
      
      favoritedAds = favoritesResult.rows.map(row => row.ad_id);
    }

    // Add is_favorited flag to ads
    const adsWithFavorites = recentAds.ads.map(ad => ({
      ...ad,
      is_favorited: favoritedAds.includes(ad.id)
    }));

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          avatar_url: user.avatar_url,
          location: user.location,
          created_at: user.created_at,
          ...stats
        },
        recent_ads: adsWithFavorites
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get user's ads
// @route   GET /api/users/:id/ads
// @access  Public
router.get('/:id/ads', validateId, validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'active' } = req.query;
    
    const filters = { 
      user_id: parseInt(req.params.id),
      status 
    };

    const result = await Ad.getAll(filters, parseInt(page), parseInt(limit));

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get user ads error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update user avatar
// @route   PUT /api/users/avatar
// @access  Private
router.put('/avatar', protect, uploadSingle('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // Upload to Cloudinary
    const uploadResult = await uploadImage(req.file, 'jiji-avatars');

    // Update user avatar
    const updatedUser = await User.update(req.user.id, {
      avatar_url: uploadResult.url
    });

    res.json({
      success: true,
      data: {
        avatar_url: uploadResult.url
      },
      message: 'Avatar updated successfully'
    });
  } catch (error) {
    console.error('Update avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Avatar upload failed'
    });
  }
});

// @desc    Add ad to favorites
// @route   POST /api/users/favorites/:adId
// @access  Private
router.post('/favorites/:adId', protect, validateId, async (req, res) => {
  try {
    const adId = req.params.adId;

    // Check if ad exists
    const ad = await Ad.findById(adId);
    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }

    // Check if already favorited
    const existingFavorite = await query(
      'SELECT id FROM favorites WHERE user_id = $1 AND ad_id = $2',
      [req.user.id, adId]
    );

    if (existingFavorite.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Ad already in favorites'
      });
    }

    // Add to favorites
    await query(
      'INSERT INTO favorites (user_id, ad_id) VALUES ($1, $2)',
      [req.user.id, adId]
    );

    res.json({
      success: true,
      message: 'Ad added to favorites'
    });
  } catch (error) {
    console.error('Add to favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Remove ad from favorites
// @route   DELETE /api/users/favorites/:adId
// @access  Private
router.delete('/favorites/:adId', protect, validateId, async (req, res) => {
  try {
    const adId = req.params.adId;

    const result = await query(
      'DELETE FROM favorites WHERE user_id = $1 AND ad_id = $2 RETURNING *',
      [req.user.id, adId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found'
      });
    }

    res.json({
      success: true,
      message: 'Ad removed from favorites'
    });
  } catch (error) {
    console.error('Remove from favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get user's favorites
// @route   GET /api/users/favorites
// @access  Private
router.get('/favorites', protect, validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const result = await query(`
      SELECT 
        a.*,
        u.name as user_name,
        u.avatar_url as user_avatar,
        c.name as category_name,
        f.created_at as favorited_at,
        true as is_favorited
      FROM favorites f
      JOIN ads a ON f.ad_id = a.id
      JOIN users u ON a.user_id = u.id
      JOIN categories c ON a.category_id = c.id
      WHERE f.user_id = $1 AND a.status = 'active'
      ORDER BY f.created_at DESC
      LIMIT $2 OFFSET $3
    `, [req.user.id, parseInt(limit), offset]);

    const countResult = await query(
      `SELECT COUNT(*) FROM favorites f
       JOIN ads a ON f.ad_id = a.id
       WHERE f.user_id = $1 AND a.status = 'active'`,
      [req.user.id]
    );

    res.json({
      success: true,
      data: {
        ads: result.rows,
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countResult.rows[0].count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Report user
// @route   POST /api/users/:id/report
// @access  Private
router.post('/:id/report', protect, validateId, async (req, res) => {
  try {
    const { reason, description } = req.body;
    const reportedUserId = req.params.id;

    if (reportedUserId === req.user.id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot report yourself'
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Report reason is required'
      });
    }

    // Check if user exists
    const user = await User.findById(reportedUserId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create report (you would need to create this table)
    await query(`
      INSERT INTO user_reports (reporter_id, reported_user_id, reason, description)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (reporter_id, reported_user_id) 
      DO UPDATE SET reason = $3, description = $4, created_at = NOW()
    `, [req.user.id, reportedUserId, reason, description]);

    res.json({
      success: true,
      message: 'User reported successfully'
    });
  } catch (error) {
    console.error('Report user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get user statistics
// @route   GET /api/users/:id/stats
// @access  Public
router.get('/:id/stats', validateId, async (req, res) => {
  try {
    const stats = await User.getStats(req.params.id);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;