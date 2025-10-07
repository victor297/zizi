import express from 'express';
import { protect } from '../middleware/auth.js';
import { query } from '../config/database.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// @desc    Get user settings
// @route   GET /api/settings
// @access  Private
router.get('/', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM user_settings WHERE user_id = $1',
      [req.user.id]
    );

    let settings;
    if (result.rows.length === 0) {
      // Create default settings
      const createResult = await query(
        `INSERT INTO user_settings (user_id, chat_enabled, reviews_enabled, email_notifications)
         VALUES ($1, true, true, true)
         RETURNING *`,
        [req.user.id]
      );
      settings = createResult.rows[0];
    } else {
      settings = result.rows[0];
    }

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Get user settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update user settings
// @route   PUT /api/settings
// @access  Private
router.put('/', async (req, res) => {
  try {
    const {
      chat_enabled, reviews_enabled, email_notifications,
      sms_notifications, push_notifications, marketing_emails
    } = req.body;

    const updateData = {};
    if (chat_enabled !== undefined) updateData.chat_enabled = chat_enabled;
    if (reviews_enabled !== undefined) updateData.reviews_enabled = reviews_enabled;
    if (email_notifications !== undefined) updateData.email_notifications = email_notifications;
    if (sms_notifications !== undefined) updateData.sms_notifications = sms_notifications;
    if (push_notifications !== undefined) updateData.push_notifications = push_notifications;
    if (marketing_emails !== undefined) updateData.marketing_emails = marketing_emails;

    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updateData).forEach(key => {
      fields.push(`${key} = $${paramCount}`);
      values.push(updateData[key]);
      paramCount++;
    });

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No settings to update'
      });
    }

    values.push(req.user.id);
    const result = await query(
      `UPDATE user_settings 
       SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      // Create settings if they don't exist
      const createResult = await query(
        `INSERT INTO user_settings (user_id, ${Object.keys(updateData).join(', ')})
         VALUES ($1, ${Object.keys(updateData).map((_, i) => `$${i + 2}`).join(', ')})
         RETURNING *`,
        [req.user.id, ...Object.values(updateData)]
      );
      
      return res.json({
        success: true,
        data: createResult.rows[0],
        message: 'Settings updated successfully'
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Update user settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;