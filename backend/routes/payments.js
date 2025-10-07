import express from 'express';
import crypto from 'crypto';
import { protect } from '../middleware/auth.js';
import { validatePayment, validateId } from '../middleware/validation.js';
import { query, transaction } from '../config/database.js';
import Ad from '../models/Ad.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Paystack configuration
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

// Service prices (in kobo - Paystack uses kobo)
const SERVICE_PRICES = {
  bump: 50000, // ₦500
  feature: 200000, // ₦2000
  urgent: 100000 // ₦1000
};

// Helper function to make Paystack API calls
const paystackRequest = async (endpoint, method = 'GET', data = null) => {
  const url = `${PAYSTACK_BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json'
    }
  };

  if (data && method !== 'GET') {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Paystack API error');
  }

  return result;
};

// @desc    Initialize payment
// @route   POST /api/payments/initialize
// @access  Private
router.post('/initialize', validatePayment, async (req, res) => {
  try {
    const { amount, service, ad_id, callback_url } = req.body;

    // Validate service and amount
    if (!SERVICE_PRICES[service]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service type'
      });
    }

    const expectedAmount = SERVICE_PRICES[service];
    if (amount !== expectedAmount) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount for service'
      });
    }

    // If ad_id is provided, verify ownership
    if (ad_id) {
      const ad = await Ad.findById(ad_id);
      if (!ad || ad.user_id !== req.user.id) {
        return res.status(404).json({
          success: false,
          message: 'Ad not found or not owned by user'
        });
      }
    }

    // Generate reference
    const reference = `jiji_${service}_${Date.now()}_${req.user.id}`;

    // Create payment record
    const paymentResult = await query(`
      INSERT INTO payments (
        user_id, ad_id, service, amount, reference, status
      ) VALUES ($1, $2, $3, $4, $5, 'pending')
      RETURNING *
    `, [req.user.id, ad_id, service, amount, reference]);

    const payment = paymentResult.rows[0];

    // Initialize payment with Paystack
    const paystackData = {
      email: req.user.email,
      amount: amount,
      reference: reference,
      callback_url: callback_url || `${process.env.CLIENT_URL}/payment/callback`,
      metadata: {
        user_id: req.user.id,
        service: service,
        ad_id: ad_id,
        payment_id: payment.id
      }
    };

    const paystackResponse = await paystackRequest('/transaction/initialize', 'POST', paystackData);

    res.json({
      success: true,
      data: {
        payment_id: payment.id,
        reference: reference,
        authorization_url: paystackResponse.data.authorization_url,
        access_code: paystackResponse.data.access_code
      }
    });
  } catch (error) {
    console.error('Initialize payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Payment initialization failed'
    });
  }
});

// @desc    Verify payment
// @route   GET /api/payments/verify/:reference
// @access  Private
router.get('/verify/:reference', async (req, res) => {
  try {
    const { reference } = req.params;

    // Get payment record
    const paymentResult = await query(
      'SELECT * FROM payments WHERE reference = $1 AND user_id = $2',
      [reference, req.user.id]
    );

    if (paymentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    const payment = paymentResult.rows[0];

    // If already verified, return success
    if (payment.status === 'completed') {
      return res.json({
        success: true,
        data: payment,
        message: 'Payment already verified'
      });
    }

    // Verify with Paystack
    const paystackResponse = await paystackRequest(`/transaction/verify/${reference}`);

    if (paystackResponse.data.status === 'success') {
      await transaction(async (client) => {
        // Update payment status
        await client.query(`
          UPDATE payments 
          SET status = 'completed', verified_at = NOW(), 
              paystack_data = $1
          WHERE id = $2
        `, [JSON.stringify(paystackResponse.data), payment.id]);

        // Apply service to ad if applicable
        if (payment.ad_id) {
          switch (payment.service) {
            case 'bump':
              await client.query(`
                UPDATE ads 
                SET bumped_at = NOW(), bump_expires_at = NOW() + INTERVAL '7 days'
                WHERE id = $1
              `, [payment.ad_id]);
              break;

            case 'feature':
              await client.query(`
                UPDATE ads 
                SET is_featured = true, featured_at = NOW(), 
                    featured_until = NOW() + INTERVAL '30 days'
                WHERE id = $1
              `, [payment.ad_id]);
              break;

            case 'urgent':
              await client.query(`
                UPDATE ads 
                SET is_urgent = true, urgent_at = NOW(), 
                    urgent_until = NOW() + INTERVAL '7 days'
                WHERE id = $1
              `, [payment.ad_id]);
              break;
          }
        }
      });

      res.json({
        success: true,
        data: {
          ...payment,
          status: 'completed'
        },
        message: 'Payment verified successfully'
      });
    } else {
      // Update payment as failed
      await query(
        'UPDATE payments SET status = $1 WHERE id = $2',
        ['failed', payment.id]
      );

      res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Payment verification failed'
    });
  }
});

// @desc    Paystack webhook
// @route   POST /api/payments/webhook
// @access  Public (but verified)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const hash = crypto
      .createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(req.body)
      .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
      return res.status(400).json({
        success: false,
        message: 'Invalid signature'
      });
    }

    const event = JSON.parse(req.body);

    if (event.event === 'charge.success') {
      const { reference, status } = event.data;

      if (status === 'success') {
        // Get payment record
        const paymentResult = await query(
          'SELECT * FROM payments WHERE reference = $1',
          [reference]
        );

        if (paymentResult.rows.length > 0) {
          const payment = paymentResult.rows[0];

          if (payment.status === 'pending') {
            await transaction(async (client) => {
              // Update payment status
              await client.query(`
                UPDATE payments 
                SET status = 'completed', verified_at = NOW(), 
                    paystack_data = $1
                WHERE id = $2
              `, [JSON.stringify(event.data), payment.id]);

              // Apply service to ad if applicable
              if (payment.ad_id) {
                switch (payment.service) {
                  case 'bump':
                    await client.query(`
                      UPDATE ads 
                      SET bumped_at = NOW(), bump_expires_at = NOW() + INTERVAL '7 days'
                      WHERE id = $1
                    `, [payment.ad_id]);
                    break;

                  case 'feature':
                    await client.query(`
                      UPDATE ads 
                      SET is_featured = true, featured_at = NOW(), 
                          featured_until = NOW() + INTERVAL '30 days'
                      WHERE id = $1
                    `, [payment.ad_id]);
                    break;

                  case 'urgent':
                    await client.query(`
                      UPDATE ads 
                      SET is_urgent = true, urgent_at = NOW(), 
                          urgent_until = NOW() + INTERVAL '7 days'
                      WHERE id = $1
                    `, [payment.ad_id]);
                    break;
                }
              }
            });
          }
        }
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed'
    });
  }
});

// @desc    Get payment history
// @route   GET /api/payments/history
// @access  Private
router.get('/history', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const result = await query(`
      SELECT 
        p.*,
        a.title as ad_title
      FROM payments p
      LEFT JOIN ads a ON p.ad_id = a.id
      WHERE p.user_id = $1
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3
    `, [req.user.id, parseInt(limit), offset]);

    const countResult = await query(
      'SELECT COUNT(*) FROM payments WHERE user_id = $1',
      [req.user.id]
    );

    res.json({
      success: true,
      data: {
        payments: result.rows,
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countResult.rows[0].count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get service prices
// @route   GET /api/payments/prices
// @access  Private
router.get('/prices', (req, res) => {
  res.json({
    success: true,
    data: {
      bump: SERVICE_PRICES.bump / 100, // Convert from kobo to naira
      feature: SERVICE_PRICES.feature / 100,
      urgent: SERVICE_PRICES.urgent / 100
    }
  });
});

// @desc    Create payment intent (for specific ad services)
// @route   POST /api/payments/intent
// @access  Private
router.post('/intent', async (req, res) => {
  try {
    const { ad_id, service } = req.body;

    if (!SERVICE_PRICES[service]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service type'
      });
    }

    // Verify ad ownership
    const ad = await Ad.findById(ad_id);
    if (!ad || ad.user_id !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found or not owned by user'
      });
    }

    // Check if service is already active
    const now = new Date();
    let isActive = false;
    let expiresAt = null;

    switch (service) {
      case 'bump':
        isActive = ad.bump_expires_at && new Date(ad.bump_expires_at) > now;
        expiresAt = ad.bump_expires_at;
        break;
      case 'feature':
        isActive = ad.is_featured && ad.featured_until && new Date(ad.featured_until) > now;
        expiresAt = ad.featured_until;
        break;
      case 'urgent':
        isActive = ad.is_urgent && ad.urgent_until && new Date(ad.urgent_until) > now;
        expiresAt = ad.urgent_until;
        break;
    }

    res.json({
      success: true,
      data: {
        ad_id,
        service,
        price: SERVICE_PRICES[service] / 100, // Convert to naira
        is_active: isActive,
        expires_at: expiresAt,
        can_purchase: !isActive || service === 'bump' // Bump can be purchased multiple times
      }
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;