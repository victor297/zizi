import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';

export const configureSocket = (io) => {
  // Middleware for socket authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database
      const result = await query(
        'SELECT id, name, email, avatar_url FROM users WHERE id = $1 AND status = $2',
        [decoded.id, 'active']
      );

      if (result.rows.length === 0) {
        return next(new Error('User not found'));
      }

      socket.user = result.rows[0];
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.user.name} connected with socket ID: ${socket.id}`);

    // Join user to their personal room
    socket.join(`user_${socket.user.id}`);

    // Handle joining conversation rooms
    socket.on('join_conversation', async (conversationId) => {
      try {
        // Verify user is part of the conversation
        const result = await query(
          'SELECT * FROM conversations WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)',
          [conversationId, socket.user.id]
        );

        if (result.rows.length > 0) {
          socket.join(`conversation_${conversationId}`);
          console.log(`User ${socket.user.name} joined conversation ${conversationId}`);
        } else {
          socket.emit('error', { message: 'Not authorized to join this conversation' });
        }
      } catch (error) {
        console.error('Join conversation error:', error);
        socket.emit('error', { message: 'Failed to join conversation' });
      }
    });

    // Handle leaving conversation rooms
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation_${conversationId}`);
      console.log(`User ${socket.user.name} left conversation ${conversationId}`);
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
      const { conversationId } = data;
      socket.to(`conversation_${conversationId}`).emit('user_typing', {
        userId: socket.user.id,
        userName: socket.user.name,
        conversationId
      });
    });

    socket.on('typing_stop', (data) => {
      const { conversationId } = data;
      socket.to(`conversation_${conversationId}`).emit('user_stopped_typing', {
        userId: socket.user.id,
        conversationId
      });
    });

    // Handle message read receipts
    socket.on('message_read', async (data) => {
      try {
        const { messageId, conversationId } = data;

        // Update message as read
        await query(
          'UPDATE messages SET read_at = NOW() WHERE id = $1 AND sender_id != $2',
          [messageId, socket.user.id]
        );

        // Notify other user
        socket.to(`conversation_${conversationId}`).emit('message_read', {
          messageId,
          readBy: socket.user.id,
          readAt: new Date()
        });
      } catch (error) {
        console.error('Message read error:', error);
      }
    });

    // Handle user status updates
    socket.on('update_status', (status) => {
      if (['online', 'away', 'busy'].includes(status)) {
        socket.user.status = status;
        socket.broadcast.emit('user_status_changed', {
          userId: socket.user.id,
          status
        });
      }
    });

    // Handle ad view notifications (real-time)
    socket.on('ad_viewed', async (data) => {
      try {
        const { adId } = data;

        // Get ad owner
        const result = await query(
          'SELECT user_id FROM ads WHERE id = $1',
          [adId]
        );

        if (result.rows.length > 0) {
          const adOwnerId = result.rows[0].user_id;
          
          // Don't notify if viewer is the owner
          if (adOwnerId !== socket.user.id) {
            // Notify ad owner
            socket.to(`user_${adOwnerId}`).emit('ad_view_notification', {
              adId,
              viewerName: socket.user.name,
              viewerId: socket.user.id,
              timestamp: new Date()
            });
          }
        }
      } catch (error) {
        console.error('Ad view notification error:', error);
      }
    });

    // Handle new ad notifications
    socket.on('new_ad_created', async (data) => {
      try {
        const { adId, categoryId } = data;

        // Notify users who have saved searches for this category
        // This would require a saved_searches table
        socket.broadcast.emit('new_ad_notification', {
          adId,
          categoryId,
          creatorName: socket.user.name,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('New ad notification error:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`User ${socket.user.name} disconnected: ${reason}`);
      
      // Notify other users that this user went offline
      socket.broadcast.emit('user_status_changed', {
        userId: socket.user.id,
        status: 'offline'
      });
    });

    // Handle connection errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  // Handle server-side events
  io.engine.on('connection_error', (err) => {
    console.error('Connection error:', err);
  });

  console.log('Socket.IO server configured successfully');
};

// Helper function to emit to specific user
export const emitToUser = (io, userId, event, data) => {
  io.to(`user_${userId}`).emit(event, data);
};

// Helper function to emit to conversation
export const emitToConversation = (io, conversationId, event, data) => {
  io.to(`conversation_${conversationId}`).emit(event, data);
};

// Helper function to broadcast to all users
export const broadcastToAll = (io, event, data) => {
  io.emit(event, data);
};

export default { configureSocket, emitToUser, emitToConversation, broadcastToAll };