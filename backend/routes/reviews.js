import express from 'express';
import Review from '../models/Review.js';
import { protect } from '../middleware/auth.js';
import { validateId } from '../middleware/validation.js';
import { query } from '../config/database.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// @desc    Create a review
// @route   POST /api/reviews
// @access  Private
router.post('/', async (req, res) => {
  try {
    const { reviewed_user_id, ad_id, rating, comment } = req.body;

    if (!reviewed_user_id || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Reviewed user ID and rating are required'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Check if reviewed user has reviews enabled
    const userSettings = await query(
      'SELECT reviews_enabled FROM user_settings WHERE user_id = $1',
      [reviewed_user_id]
    );

    if (userSettings.rows.length > 0 && !userSettings.rows[0].reviews_enabled) {
      return res.status(403).json({
        success: false,
        message: 'This user has disabled reviews'
      });
    }

    const review = await Review.create({
      reviewer_id: req.user.id,
      reviewed_user_id: parseInt(reviewed_user_id),
      ad_id: ad_id ? parseInt(ad_id) : null,
      rating: parseInt(rating),
      comment
    });

    res.status(201).json({
      success: true,
      data: review,
      message: 'Review created successfully'
    });
  } catch (error) {
    console.error('Create review error:', error);
    
    if (error.message.includes('Cannot review yourself') || 
        error.message.includes('already reviewed')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get reviews for a user (received)
// @route   GET /api/reviews/received/:userId
// @access  Public
router.get('/received/:userId', validateId, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await Review.getReceivedReviews(req.params.userId, parseInt(page), parseInt(limit));

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get received reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get reviews by a user (given)
// @route   GET /api/reviews/given
// @access  Private
router.get('/given', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await Review.getGivenReviews(req.user.id, parseInt(page), parseInt(limit));

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get given reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get user's review statistics
// @route   GET /api/reviews/stats/:userId
// @access  Public
router.get('/stats/:userId', validateId, async (req, res) => {
  try {
    const stats = await Review.getUserStats(req.params.userId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get review stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private
router.put('/:id', validateId, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const review = await Review.update(req.params.id, req.user.id, {
      rating: rating ? parseInt(rating) : undefined,
      comment
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or not authorized'
      });
    }

    res.json({
      success: true,
      data: review,
      message: 'Review updated successfully'
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
router.delete('/:id', validateId, async (req, res) => {
  try {
    const review = await Review.delete(req.params.id, req.user.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or not authorized'
      });
    }

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;