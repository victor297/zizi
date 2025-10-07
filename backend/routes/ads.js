import express from 'express';
import Ad from '../models/Ad.js';
import { protect, optionalAuth, checkOwnership } from '../middleware/auth.js';
import { uploadMultiple } from '../middleware/upload.js';
import { uploadMultipleImages } from '../config/cloudinary.js';
import {
  validateCreateAd,
  validateUpdateAd,
  validateSearch,
  validateId,
  validatePagination
} from '../middleware/validation.js';

const router = express.Router();

// @desc    Get all ads with filters
// @route   GET /api/ads
// @access  Public
router.get('/', optionalAuth, validateSearch, validatePagination, async (req, res) => {
  try {
    const {
      category_id, subcategory_id, location, min_price, max_price,
      condition, q: search, featured, urgent, sort_by,
      page = 1, limit = 20
    } = req.query;

    const filters = {
      category_id: category_id ? parseInt(category_id) : undefined,
      subcategory_id: subcategory_id ? parseInt(subcategory_id) : undefined,
      location,
      min_price: min_price ? parseFloat(min_price) : undefined,
      max_price: max_price ? parseFloat(max_price) : undefined,
      condition,
      search,
      featured: featured === 'true',
      urgent: urgent === 'true',
      sort_by
    };

    const result = await Ad.getAll(filters, parseInt(page), parseInt(limit));

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get ads error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get featured ads
// @route   GET /api/ads/featured
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const ads = await Ad.getFeatured(limit);

    res.json({
      success: true,
      data: ads
    });
  } catch (error) {
    console.error('Get featured ads error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Search ads
// @route   GET /api/ads/search
// @access  Public
router.get('/search', optionalAuth, validateSearch, validatePagination, async (req, res) => {
  try {
    const {
      q: searchTerm, category_id, location, min_price, max_price,
      condition, sort_by, page = 1, limit = 20
    } = req.query;

    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        message: 'Search term is required'
      });
    }

    const filters = {
      category_id: category_id ? parseInt(category_id) : undefined,
      location,
      min_price: min_price ? parseFloat(min_price) : undefined,
      max_price: max_price ? parseFloat(max_price) : undefined,
      condition,
      sort_by
    };

    const result = await Ad.search(searchTerm, filters, parseInt(page), parseInt(limit));

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Search ads error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get single ad
// @route   GET /api/ads/:id
// @access  Public
router.get('/:id', optionalAuth, validateId, async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id, req.user?.id);

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }

    // Get similar ads
    const similarAds = await Ad.getSimilar(req.params.id);

    res.json({
      success: true,
      data: {
        ad,
        similarAds
      }
    });
  } catch (error) {
    console.error('Get ad error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Create new ad
// @route   POST /api/ads
// @access  Private
router.post('/', protect, uploadMultiple('images', 10), validateCreateAd, async (req, res) => {
  try {
    const {
      title, description, price, category_id, subcategory_id,
      location, condition, is_negotiable, contact_phone,
      // Job-specific fields
      job_type, salary_range, experience_level, company_name,
      application_method, deadline
    } = req.body;

    let images = [];

    // Upload images to Cloudinary if provided
    if (req.files && req.files.length > 0) {
      try {
        images = await uploadMultipleImages(req.files, 'jiji-ads');
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(400).json({
          success: false,
          message: 'Image upload failed'
        });
      }
    }

    const adData = {
      user_id: req.user.id,
      title,
      description,
      price: parseFloat(price),
      category_id: parseInt(category_id),
      subcategory_id: subcategory_id ? parseInt(subcategory_id) : null,
      location,
      condition,
      images,
      is_negotiable: is_negotiable === 'true',
      contact_phone: contact_phone || req.user.phone
    };

    // Add job-specific fields if provided
    if (job_type) {
      adData.job_type = job_type;
      adData.salary_range = salary_range;
      adData.experience_level = experience_level;
      adData.company_name = company_name;
      adData.application_method = application_method;
      adData.deadline = deadline ? new Date(deadline) : null;
    }

    const ad = await Ad.create(adData);

    res.status(201).json({
      success: true,
      data: ad
    });
  } catch (error) {
    console.error('Create ad error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update ad
// @route   PUT /api/ads/:id
// @access  Private
router.put('/:id', protect, checkOwnership('ad'), uploadMultiple('images', 10), validateUpdateAd, async (req, res) => {
  try {
    const {
      title, description, price, category_id, subcategory_id,
      location, condition, is_negotiable, contact_phone,
      // Job-specific fields
      job_type, salary_range, experience_level, company_name,
      application_method, deadline
    } = req.body;

    const updateData = {};

    // Update basic fields
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (category_id !== undefined) updateData.category_id = parseInt(category_id);
    if (subcategory_id !== undefined) updateData.subcategory_id = subcategory_id ? parseInt(subcategory_id) : null;
    if (location !== undefined) updateData.location = location;
    if (condition !== undefined) updateData.condition = condition;
    if (is_negotiable !== undefined) updateData.is_negotiable = is_negotiable === 'true';
    if (contact_phone !== undefined) updateData.contact_phone = contact_phone;

    // Handle image uploads
    if (req.files && req.files.length > 0) {
      try {
        const newImages = await uploadMultipleImages(req.files, 'jiji-ads');
        updateData.images = newImages;
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(400).json({
          success: false,
          message: 'Image upload failed'
        });
      }
    }

    // Add job-specific fields if provided
    if (job_type !== undefined) updateData.job_type = job_type;
    if (salary_range !== undefined) updateData.salary_range = salary_range;
    if (experience_level !== undefined) updateData.experience_level = experience_level;
    if (company_name !== undefined) updateData.company_name = company_name;
    if (application_method !== undefined) updateData.application_method = application_method;
    if (deadline !== undefined) updateData.deadline = deadline ? new Date(deadline) : null;

    const ad = await Ad.update(req.params.id, updateData);

    res.json({
      success: true,
      data: ad
    });
  } catch (error) {
    console.error('Update ad error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete ad
// @route   DELETE /api/ads/:id
// @access  Private
router.delete('/:id', protect, checkOwnership('ad'), validateId, async (req, res) => {
  try {
    await Ad.delete(req.params.id);

    res.json({
      success: true,
      message: 'Ad deleted successfully'
    });
  } catch (error) {
    console.error('Delete ad error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Bump ad (move to top)
// @route   POST /api/ads/:id/bump
// @access  Private
router.post('/:id/bump', protect, checkOwnership('ad'), validateId, async (req, res) => {
  try {
    const ad = await Ad.bump(req.params.id);

    res.json({
      success: true,
      data: ad,
      message: 'Ad bumped successfully'
    });
  } catch (error) {
    console.error('Bump ad error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Feature ad
// @route   POST /api/ads/:id/feature
// @access  Private
router.post('/:id/feature', protect, checkOwnership('ad'), validateId, async (req, res) => {
  try {
    const { duration = 30 } = req.body;
    const ad = await Ad.feature(req.params.id, duration);

    res.json({
      success: true,
      data: ad,
      message: 'Ad featured successfully'
    });
  } catch (error) {
    console.error('Feature ad error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Mark ad as urgent
// @route   POST /api/ads/:id/urgent
// @access  Private
router.post('/:id/urgent', protect, checkOwnership('ad'), validateId, async (req, res) => {
  try {
    const { duration = 7 } = req.body;
    const ad = await Ad.markUrgent(req.params.id, duration);

    res.json({
      success: true,
      data: ad,
      message: 'Ad marked as urgent successfully'
    });
  } catch (error) {
    console.error('Mark urgent error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update ad status
// @route   PUT /api/ads/:id/status
// @access  Private
router.put('/:id/status', protect, checkOwnership('ad'), validateId, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['active', 'sold', 'expired', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const ad = await Ad.updateStatus(req.params.id, status);

    res.json({
      success: true,
      data: ad,
      message: 'Ad status updated successfully'
    });
  } catch (error) {
    console.error('Update ad status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get user's ads
// @route   GET /api/ads/user/:userId
// @access  Public
router.get('/user/:userId', validateId, validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await Ad.getUserAds(req.params.userId, parseInt(page), parseInt(limit));

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

// @desc    Get my ads
// @route   GET /api/ads/my/ads
// @access  Private
router.get('/my/ads', protect, validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    
    const filters = { user_id: req.user.id };
    if (status) filters.status = status;

    const result = await Ad.getAll(filters, parseInt(page), parseInt(limit));

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get my ads error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;