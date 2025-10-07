import express from 'express';
import User from '../models/User.js';
import Ad from '../models/Ad.js';
import Category from '../models/Category.js';
import { protect, admin } from '../middleware/auth.js';
import { validateId, validatePagination } from '../middleware/validation.js';
import { query } from '../config/database.js';

const router = express.Router();

// All routes are protected and require admin access
router.use(protect, admin);

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
router.get('/stats', async (req, res) => {
  try {
    const [userStats, adStats, categoryStats] = await Promise.all([
      User.getStats ? User.getStats() : query(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(*) FILTER (WHERE status = 'active') as active_users,
          COUNT(*) FILTER (WHERE status = 'suspended') as suspended_users,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as users_today,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as users_this_week,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as users_this_month
        FROM users
      `).then(result => result.rows[0]),
      Ad.getStats(),
      Category.getStats()
    ]);

    // Get revenue stats (mock data for now)
    const revenueStats = {
      total_revenue: 0,
      revenue_today: 0,
      revenue_this_week: 0,
      revenue_this_month: 0
    };

    res.json({
      success: true,
      data: {
        users: userStats,
        ads: adStats,
        categories: categoryStats,
        revenue: revenueStats
      }
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// User Management Routes

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
router.get('/users', validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status } = req.query;
    
    let filters = {};
    if (search) filters.search = search;
    if (status) filters.status = status;

    const result = await User.getAll(parseInt(page), parseInt(limit), search);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private/Admin
router.get('/users/:id', validateId, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const stats = await User.getStats(req.params.id);

    res.json({
      success: true,
      data: {
        ...user,
        ...stats
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
router.put('/users/:id/status', validateId, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['active', 'suspended', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const user = await User.updateStatus(req.params.id, status);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user,
      message: 'User status updated successfully'
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
router.delete('/users/:id', validateId, async (req, res) => {
  try {
    // Prevent admin from deleting themselves
    if (req.params.id === req.user.id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    const user = await User.delete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Ad Management Routes

// @desc    Get all ads for admin
// @route   GET /api/admin/ads
// @access  Private/Admin
router.get('/ads', validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, category_id, search } = req.query;
    
    const filters = {};
    if (status) filters.status = status;
    if (category_id) filters.category_id = parseInt(category_id);
    if (search) filters.search = search;

    const result = await Ad.getAll(filters, parseInt(page), parseInt(limit));

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get admin ads error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update ad status (admin)
// @route   PUT /api/admin/ads/:id/status
// @access  Private/Admin
router.put('/ads/:id/status', validateId, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['active', 'pending', 'rejected', 'sold', 'expired'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const ad = await Ad.updateStatus(req.params.id, status);

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }

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

// @desc    Feature ad (admin)
// @route   PUT /api/admin/ads/:id/feature
// @access  Private/Admin
router.put('/ads/:id/feature', validateId, async (req, res) => {
  try {
    const { featured, duration = 30 } = req.body;

    let ad;
    if (featured) {
      ad = await Ad.feature(req.params.id, duration);
    } else {
      // Remove featured status
      ad = await Ad.update(req.params.id, {
        is_featured: false,
        featured_until: null
      });
    }

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }

    res.json({
      success: true,
      data: ad,
      message: featured ? 'Ad featured successfully' : 'Ad unfeatured successfully'
    });
  } catch (error) {
    console.error('Feature ad error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete ad (admin)
// @route   DELETE /api/admin/ads/:id
// @access  Private/Admin
router.delete('/ads/:id', validateId, async (req, res) => {
  try {
    const ad = await Ad.delete(req.params.id);

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }

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

// Category Management Routes

// @desc    Get all categories for admin
// @route   GET /api/admin/categories
// @access  Private/Admin
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.getAll();

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get admin categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Create category (admin)
// @route   POST /api/admin/categories
// @access  Private/Admin
router.post('/categories', async (req, res) => {
  try {
    const { name, description, parent_id, icon } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    // Generate slug from name
    const slug = name.toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    const category = await Category.create({
      name,
      description,
      parent_id,
      icon,
      slug
    });

    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update category (admin)
// @route   PUT /api/admin/categories/:id
// @access  Private/Admin
router.put('/categories/:id', validateId, async (req, res) => {
  try {
    const { name, description, parent_id, icon, status, sort_order } = req.body;

    const updateData = {};
    if (name !== undefined) {
      updateData.name = name;
      updateData.slug = name.toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
    }
    if (description !== undefined) updateData.description = description;
    if (parent_id !== undefined) updateData.parent_id = parent_id;
    if (icon !== undefined) updateData.icon = icon;
    if (status !== undefined) updateData.status = status;
    if (sort_order !== undefined) updateData.sort_order = sort_order;

    const category = await Category.update(req.params.id, updateData);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete category (admin)
// @route   DELETE /api/admin/categories/:id
// @access  Private/Admin
router.delete('/categories/:id', validateId, async (req, res) => {
  try {
    const category = await Category.delete(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    
    if (error.message.includes('Cannot delete category')) {
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

// Analytics Routes

// @desc    Get analytics data
// @route   GET /api/admin/analytics
// @access  Private/Admin
router.get('/analytics', async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    
    let interval;
    switch (timeframe) {
      case '7d':
        interval = '7 days';
        break;
      case '30d':
        interval = '30 days';
        break;
      case '90d':
        interval = '90 days';
        break;
      case '1y':
        interval = '1 year';
        break;
      default:
        interval = '30 days';
    }

    // Get user registration trends
    const userTrends = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM users 
      WHERE created_at >= NOW() - INTERVAL '${interval}'
      GROUP BY DATE(created_at)
      ORDER BY date
    `);

    // Get ad creation trends
    const adTrends = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM ads 
      WHERE created_at >= NOW() - INTERVAL '${interval}'
      GROUP BY DATE(created_at)
      ORDER BY date
    `);

    // Get category distribution
    const categoryStats = await query(`
      SELECT 
        c.name,
        COUNT(a.id) as ad_count
      FROM categories c
      LEFT JOIN ads a ON c.id = a.category_id AND a.status = 'active'
      WHERE c.parent_id IS NULL
      GROUP BY c.id, c.name
      ORDER BY ad_count DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        userTrends: userTrends.rows,
        adTrends: adTrends.rows,
        categoryStats: categoryStats.rows
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;