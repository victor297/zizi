import express from 'express';
import SubscriptionPlan from '../models/SubscriptionPlan.js';
import UserSubscription from '../models/UserSubscription.js';
import { protect, admin } from '../middleware/auth.js';
import { validateId } from '../middleware/validation.js';

const router = express.Router();

// @desc    Get all subscription plans
// @route   GET /api/subscriptions/plans
// @access  Public
router.get('/plans', async (req, res) => {
  try {
    const plans = await SubscriptionPlan.getAll();
    
    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Get subscription plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get user's current subscription
// @route   GET /api/subscriptions/current
// @access  Private
router.get('/current', protect, async (req, res) => {
  try {
    const subscription = await UserSubscription.getCurrentSubscription(req.user.id);
    
    res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    console.error('Get current subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Subscribe to a plan
// @route   POST /api/subscriptions/subscribe
// @access  Private
router.post('/subscribe', protect, async (req, res) => {
  try {
    const { plan_id, payment_reference } = req.body;

    if (!plan_id || !payment_reference) {
      return res.status(400).json({
        success: false,
        message: 'Plan ID and payment reference are required'
      });
    }

    // Get plan details
    const plan = await SubscriptionPlan.findById(plan_id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    // Calculate end date based on plan duration
    const startDate = new Date();
    const endDate = new Date();
    if (plan.duration === 'month') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (plan.duration === 'year') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    const subscription = await UserSubscription.create({
      user_id: req.user.id,
      plan_id,
      payment_reference,
      start_date: startDate,
      end_date: endDate
    });

    res.status(201).json({
      success: true,
      data: subscription,
      message: 'Subscription activated successfully'
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Cancel subscription
// @route   PUT /api/subscriptions/cancel
// @access  Private
router.put('/cancel', protect, async (req, res) => {
  try {
    const { subscription_id } = req.body;

    const subscription = await UserSubscription.cancel(req.user.id, subscription_id);
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Active subscription not found'
      });
    }

    res.json({
      success: true,
      data: subscription,
      message: 'Subscription cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Check if user can post ads
// @route   GET /api/subscriptions/can-post
// @access  Private
router.get('/can-post', protect, async (req, res) => {
  try {
    const result = await UserSubscription.canPostAd(req.user.id);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Check can post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Admin routes

// @desc    Create subscription plan
// @route   POST /api/subscriptions/admin/plans
// @access  Private/Admin
router.post('/admin/plans', protect, admin, async (req, res) => {
  try {
    const { name, description, price, duration, features, ad_limit, is_active } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name and price are required'
      });
    }

    const plan = await SubscriptionPlan.create({
      name,
      description,
      price: parseFloat(price),
      duration,
      features: features || [],
      ad_limit: parseInt(ad_limit) || 5,
      is_active: is_active !== false
    });

    res.status(201).json({
      success: true,
      data: plan
    });
  } catch (error) {
    console.error('Create subscription plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update subscription plan
// @route   PUT /api/subscriptions/admin/plans/:id
// @access  Private/Admin
router.put('/admin/plans/:id', protect, admin, validateId, async (req, res) => {
  try {
    const { name, description, price, duration, features, ad_limit, is_active } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (duration !== undefined) updateData.duration = duration;
    if (features !== undefined) updateData.features = features;
    if (ad_limit !== undefined) updateData.ad_limit = parseInt(ad_limit);
    if (is_active !== undefined) updateData.is_active = is_active;

    const plan = await SubscriptionPlan.update(req.params.id, updateData);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    res.json({
      success: true,
      data: plan
    });
  } catch (error) {
    console.error('Update subscription plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete subscription plan
// @route   DELETE /api/subscriptions/admin/plans/:id
// @access  Private/Admin
router.delete('/admin/plans/:id', protect, admin, validateId, async (req, res) => {
  try {
    const plan = await SubscriptionPlan.delete(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    res.json({
      success: true,
      message: 'Subscription plan deleted successfully'
    });
  } catch (error) {
    console.error('Delete subscription plan error:', error);
    
    if (error.message.includes('Cannot delete plan')) {
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

// @desc    Get all subscription plans (admin)
// @route   GET /api/subscriptions/admin/plans
// @access  Private/Admin
router.get('/admin/plans', protect, admin, async (req, res) => {
  try {
    const plans = await SubscriptionPlan.getAll(true); // Include inactive plans
    
    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Get admin subscription plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;