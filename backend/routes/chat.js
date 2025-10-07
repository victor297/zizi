import express from 'express';
import { protect, checkOwnership } from '../middleware/auth.js';
import { validateSendMessage, validateId } from '../middleware/validation.js';
import { query, transaction } from '../config/database.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// @desc    Get user's conversations
// @route   GET /api/chat/conversations
// @access  Private
router.get('/conversations', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        c.*,
        CASE 
          WHEN c.user1_id = $1 THEN u2.name 
          ELSE u1.name 
        END as other_user_name,
        CASE 
          WHEN c.user1_id = $1 THEN u2.avatar_url 
          ELSE u1.avatar_url 
        END as other_user_avatar,
        CASE 
          WHEN c.user1_id = $1 THEN c.user2_id 
          ELSE c.user1_id 
        END as other_user_id,
        a.title as ad_title,
        a.images->0->>'url' as ad_image,
        m.content as last_message,
        m.created_at as last_message_at,
        m.sender_id as last_message_sender_id,
        (SELECT COUNT(*) FROM messages 
         WHERE conversation_id = c.id 
         AND sender_id != $1 
         AND read_at IS NULL) as unread_count
      FROM conversations c
      JOIN users u1 ON c.user1_id = u1.id
      JOIN users u2 ON c.user2_id = u2.id
      LEFT JOIN ads a ON c.ad_id = a.id
      LEFT JOIN messages m ON c.last_message_id = m.id
      WHERE c.user1_id = $1 OR c.user2_id = $1
      ORDER BY COALESCE(m.created_at, c.created_at) DESC
    `, [req.user.id]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get or create conversation
// @route   POST /api/chat/conversations
// @access  Private
router.post('/conversations', async (req, res) => {
  try {
    const { recipient_id, ad_id } = req.body;

    if (!recipient_id) {
      return res.status(400).json({
        success: false,
        message: 'Recipient ID is required'
      });
    }

    if (recipient_id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create conversation with yourself'
      });
    }

    // Check if conversation already exists
    let conversation = await query(`
      SELECT * FROM conversations 
      WHERE ((user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1))
      AND ($3::int IS NULL OR ad_id = $3)
    `, [req.user.id, recipient_id, ad_id]);

    if (conversation.rows.length > 0) {
      conversation = conversation.rows[0];
    } else {
      // Create new conversation
      const result = await query(`
        INSERT INTO conversations (user1_id, user2_id, ad_id)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [req.user.id, recipient_id, ad_id]);
      
      conversation = result.rows[0];
    }

    // Get conversation with additional details
    const detailedConversation = await query(`
      SELECT 
        c.*,
        CASE 
          WHEN c.user1_id = $1 THEN u2.name 
          ELSE u1.name 
        END as other_user_name,
        CASE 
          WHEN c.user1_id = $1 THEN u2.avatar_url 
          ELSE u1.avatar_url 
        END as other_user_avatar,
        CASE 
          WHEN c.user1_id = $1 THEN c.user2_id 
          ELSE c.user1_id 
        END as other_user_id,
        a.title as ad_title,
        a.images->0->>'url' as ad_image
      FROM conversations c
      JOIN users u1 ON c.user1_id = u1.id
      JOIN users u2 ON c.user2_id = u2.id
      LEFT JOIN ads a ON c.ad_id = a.id
      WHERE c.id = $2
    `, [req.user.id, conversation.id]);

    res.status(201).json({
      success: true,
      data: detailedConversation.rows[0]
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get conversation messages
// @route   GET /api/chat/conversations/:id/messages
// @access  Private
router.get('/conversations/:id/messages', validateId, checkOwnership('conversation'), async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const result = await query(`
      SELECT 
        m.*,
        u.name as sender_name,
        u.avatar_url as sender_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = $1
      ORDER BY m.created_at DESC
      LIMIT $2 OFFSET $3
    `, [req.params.id, parseInt(limit), offset]);

    // Mark messages as read
    await query(`
      UPDATE messages 
      SET read_at = NOW() 
      WHERE conversation_id = $1 
      AND sender_id != $2 
      AND read_at IS NULL
    `, [req.params.id, req.user.id]);

    res.json({
      success: true,
      data: result.rows.reverse() // Reverse to show oldest first
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Send message
// @route   POST /api/chat/messages
// @access  Private
router.post('/messages', validateSendMessage, async (req, res) => {
  try {
    const { conversation_id, content, type = 'text' } = req.body;

    // Verify user is part of the conversation
    const conversation = await query(`
      SELECT * FROM conversations 
      WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)
    `, [conversation_id, req.user.id]);

    if (conversation.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    const result = await transaction(async (client) => {
      // Insert message
      const messageResult = await client.query(`
        INSERT INTO messages (conversation_id, sender_id, content, type)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [conversation_id, req.user.id, content, type]);

      const message = messageResult.rows[0];

      // Update conversation's last message
      await client.query(`
        UPDATE conversations 
        SET last_message_id = $1, updated_at = NOW()
        WHERE id = $2
      `, [message.id, conversation_id]);

      return message;
    });

    // Get message with sender details
    const messageWithSender = await query(`
      SELECT 
        m.*,
        u.name as sender_name,
        u.avatar_url as sender_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = $1
    `, [result.id]);

    const message = messageWithSender.rows[0];

    // Emit socket event for real-time messaging
    const io = req.app.get('io');
    if (io) {
      // Send to other user in conversation
      const otherUserId = conversation.rows[0].user1_id === req.user.id 
        ? conversation.rows[0].user2_id 
        : conversation.rows[0].user1_id;
      
      io.to(`user_${otherUserId}`).emit('new_message', {
        conversation_id,
        message
      });
    }

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Mark conversation as read
// @route   PUT /api/chat/conversations/:id/read
// @access  Private
router.put('/conversations/:id/read', validateId, checkOwnership('conversation'), async (req, res) => {
  try {
    await query(`
      UPDATE messages 
      SET read_at = NOW() 
      WHERE conversation_id = $1 
      AND sender_id != $2 
      AND read_at IS NULL
    `, [req.params.id, req.user.id]);

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete conversation
// @route   DELETE /api/chat/conversations/:id
// @access  Private
router.delete('/conversations/:id', validateId, checkOwnership('conversation'), async (req, res) => {
  try {
    await transaction(async (client) => {
      // Delete messages
      await client.query('DELETE FROM messages WHERE conversation_id = $1', [req.params.id]);
      
      // Delete conversation
      await client.query('DELETE FROM conversations WHERE id = $1', [req.params.id]);
    });

    res.json({
      success: true,
      message: 'Conversation deleted successfully'
    });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Block user
// @route   POST /api/chat/users/:id/block
// @access  Private
router.post('/users/:id/block', validateId, async (req, res) => {
  try {
    const { id: blockedUserId } = req.params;

    if (blockedUserId === req.user.id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot block yourself'
      });
    }

    // Add to blocked users (you would need to create this table)
    await query(`
      INSERT INTO blocked_users (user_id, blocked_user_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, blocked_user_id) DO NOTHING
    `, [req.user.id, blockedUserId]);

    res.json({
      success: true,
      message: 'User blocked successfully'
    });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Unblock user
// @route   DELETE /api/chat/users/:id/block
// @access  Private
router.delete('/users/:id/block', validateId, async (req, res) => {
  try {
    const { id: blockedUserId } = req.params;

    await query(`
      DELETE FROM blocked_users 
      WHERE user_id = $1 AND blocked_user_id = $2
    `, [req.user.id, blockedUserId]);

    res.json({
      success: true,
      message: 'User unblocked successfully'
    });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;