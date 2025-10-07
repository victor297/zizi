import express from 'express';
import { protect } from '../middleware/auth.js';
import { validateId } from '../middleware/validation.js';
import { query } from '../config/database.js';

const router = express.Router();

// @desc    Get business profile
// @route   GET /api/business/:userId
// @access  Public
router.get('/:userId', validateId, async (req, res) => {
  try {
    const result = await query(
      `SELECT bp.*, u.name as user_name, u.avatar_url, u.location
       FROM business_profiles bp
       JOIN users u ON bp.user_id = u.id
       WHERE bp.user_id = $1`,
      [req.params.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Business profile not found'
      });
    }

    const profile = result.rows[0];
    
    res.json({
      success: true,
      data: {
        ...profile,
        business_hours: JSON.parse(profile.business_hours || '{}'),
        delivery_options: JSON.parse(profile.delivery_options || '[]'),
        social_links: JSON.parse(profile.social_links || '{}')
      }
    });
  } catch (error) {
    console.error('Get business profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Create or update business profile
// @route   PUT /api/business/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const {
      business_name, description, website_url, business_hours,
      delivery_options, store_address, social_links
    } = req.body;

    if (!business_name) {
      return res.status(400).json({
        success: false,
        message: 'Business name is required'
      });
    }

    // Check if profile exists
    const existingProfile = await query(
      'SELECT id FROM business_profiles WHERE user_id = $1',
      [req.user.id]
    );

    let result;
    if (existingProfile.rows.length > 0) {
      // Update existing profile
      result = await query(
        `UPDATE business_profiles 
         SET business_name = $1, description = $2, website_url = $3, 
             business_hours = $4, delivery_options = $5, store_address = $6, 
             social_links = $7, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $8
         RETURNING *`,
        [
          business_name, description, website_url,
          JSON.stringify(business_hours || {}),
          JSON.stringify(delivery_options || []),
          store_address,
          JSON.stringify(social_links || {}),
          req.user.id
        ]
      );
    } else {
      // Create new profile
      result = await query(
        `INSERT INTO business_profiles 
         (user_id, business_name, description, website_url, business_hours, 
          delivery_options, store_address, social_links)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          req.user.id, business_name, description, website_url,
          JSON.stringify(business_hours || {}),
          JSON.stringify(delivery_options || []),
          store_address,
          JSON.stringify(social_links || {})
        ]
      );
    }

    const profile = result.rows[0];

    res.json({
      success: true,
      data: {
        ...profile,
        business_hours: JSON.parse(profile.business_hours || '{}'),
        delivery_options: JSON.parse(profile.delivery_options || '[]'),
        social_links: JSON.parse(profile.social_links || '{}')
      },
      message: 'Business profile updated successfully'
    });
  } catch (error) {
    console.error('Update business profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get user's business profile
// @route   GET /api/business/my-profile
// @access  Private
router.get('/my-profile', protect, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM business_profiles WHERE user_id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        data: null
      });
    }

    const profile = result.rows[0];

    res.json({
      success: true,
      data: {
        ...profile,
        business_hours: JSON.parse(profile.business_hours || '{}'),
        delivery_options: JSON.parse(profile.delivery_options || '[]'),
        social_links: JSON.parse(profile.social_links || '{}')
      }
    });
  } catch (error) {
    console.error('Get my business profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete business profile
// @route   DELETE /api/business/profile
// @access  Private
router.delete('/profile', protect, async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM business_profiles WHERE user_id = $1 RETURNING *',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Business profile not found'
      });
    }

    res.json({
      success: true,
      message: 'Business profile deleted successfully'
    });
  } catch (error) {
    console.error('Delete business profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;