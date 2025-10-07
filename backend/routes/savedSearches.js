import express from 'express';
import SavedSearch from '../models/SavedSearch.js';
import { protect } from '../middleware/auth.js';
import { validateId } from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// @desc    Get user's saved searches
// @route   GET /api/saved-searches
// @access  Private
router.get('/', async (req, res) => {
  try {
    const savedSearches = await SavedSearch.getUserSavedSearches(req.user.id);
    
    res.json({
      success: true,
      data: savedSearches
    });
  } catch (error) {
    console.error('Get saved searches error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Save a search
// @route   POST /api/saved-searches
// @access  Private
router.post('/', async (req, res) => {
  try {
    const { name, search_params, notification_enabled } = req.body;

    if (!name || !search_params) {
      return res.status(400).json({
        success: false,
        message: 'Name and search parameters are required'
      });
    }

    const savedSearch = await SavedSearch.create({
      user_id: req.user.id,
      name,
      search_params,
      notification_enabled: notification_enabled || false
    });

    res.status(201).json({
      success: true,
      data: savedSearch
    });
  } catch (error) {
    console.error('Save search error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update saved search
// @route   PUT /api/saved-searches/:id
// @access  Private
router.put('/:id', validateId, async (req, res) => {
  try {
    const { name, search_params, notification_enabled } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (search_params !== undefined) updateData.search_params = search_params;
    if (notification_enabled !== undefined) updateData.notification_enabled = notification_enabled;

    const savedSearch = await SavedSearch.update(req.params.id, req.user.id, updateData);

    if (!savedSearch) {
      return res.status(404).json({
        success: false,
        message: 'Saved search not found'
      });
    }

    res.json({
      success: true,
      data: savedSearch
    });
  } catch (error) {
    console.error('Update saved search error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete saved search
// @route   DELETE /api/saved-searches/:id
// @access  Private
router.delete('/:id', validateId, async (req, res) => {
  try {
    const savedSearch = await SavedSearch.delete(req.params.id, req.user.id);

    if (!savedSearch) {
      return res.status(404).json({
        success: false,
        message: 'Saved search not found'
      });
    }

    res.json({
      success: true,
      message: 'Saved search deleted successfully'
    });
  } catch (error) {
    console.error('Delete saved search error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete all saved searches
// @route   DELETE /api/saved-searches
// @access  Private
router.delete('/', async (req, res) => {
  try {
    const deletedCount = await SavedSearch.deleteAll(req.user.id);

    res.json({
      success: true,
      message: `${deletedCount} saved searches deleted successfully`
    });
  } catch (error) {
    console.error('Delete all saved searches error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;