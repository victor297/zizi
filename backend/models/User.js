import { query, transaction } from '../config/database.js';
import bcrypt from 'bcryptjs';

export class User {
  // Create a new user
  static async create(userData) {
    const { name, email, password, phone, location, avatar_url, google_id, role = 'user' } = userData;
    
    // Hash password if provided
    let hashedPassword = null;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    const result = await query(
      `INSERT INTO users (name, email, password, phone, location, avatar_url, google_id, role, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
       RETURNING id, name, email, phone, location, avatar_url, role, status, created_at`,
      [name, email, hashedPassword, phone, location, avatar_url, google_id, role]
    );

    return result.rows[0];
  }

  // Find user by email
  static async findByEmail(email) {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  }

  // Find user by ID
  static async findById(id) {
    const result = await query(
      'SELECT id, name, email, phone, location, avatar_url, role, status, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  // Find user by Google ID
  static async findByGoogleId(googleId) {
    const result = await query(
      'SELECT * FROM users WHERE google_id = $1',
      [googleId]
    );
    return result.rows[0];
  }

  // Update user
  static async update(id, updateData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && key !== 'id') {
        fields.push(`${key} = $${paramCount}`);
        values.push(updateData[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);
    const result = await query(
      `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount}
       RETURNING id, name, email, phone, location, avatar_url, role, status, created_at, updated_at`,
      values
    );

    return result.rows[0];
  }

  // Update password
  static async updatePassword(id, newPassword) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, id]
    );
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Get user stats
  static async getStats(userId) {
    const result = await query(
      `SELECT 
        (SELECT COUNT(*) FROM ads WHERE user_id = $1 AND status = 'active') as active_ads,
        (SELECT COUNT(*) FROM ads WHERE user_id = $1 AND status = 'sold') as sold_ads,
        (SELECT COUNT(*) FROM favorites WHERE user_id = $1) as favorites_count,
        (SELECT AVG(rating) FROM reviews WHERE seller_id = $1) as average_rating,
        (SELECT COUNT(*) FROM reviews WHERE seller_id = $1) as review_count`,
      [userId]
    );

    return result.rows[0];
  }

  // Get all users (admin)
  static async getAll(page = 1, limit = 20, search = '') {
    const offset = (page - 1) * limit;
    let whereClause = '';
    let params = [limit, offset];
    let paramCount = 3;

    if (search) {
      whereClause = 'WHERE name ILIKE $3 OR email ILIKE $3';
      params = [limit, offset, `%${search}%`];
      paramCount = 4;
    }

    const result = await query(
      `SELECT id, name, email, phone, location, role, status, created_at,
        (SELECT COUNT(*) FROM ads WHERE user_id = users.id) as ads_count
       FROM users 
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      params
    );

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM users ${whereClause}`,
      search ? [`%${search}%`] : []
    );

    return {
      users: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    };
  }

  // Update user status (admin)
  static async updateStatus(id, status) {
    const result = await query(
      'UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.rows[0];
  }

  // Delete user (admin)
  static async delete(id) {
    return await transaction(async (client) => {
      // Delete user's ads
      await client.query('DELETE FROM ads WHERE user_id = $1', [id]);
      
      // Delete user's messages
      await client.query('DELETE FROM messages WHERE sender_id = $1', [id]);
      
      // Delete user's conversations
      await client.query('DELETE FROM conversations WHERE user1_id = $1 OR user2_id = $1', [id]);
      
      // Delete user's favorites
      await client.query('DELETE FROM favorites WHERE user_id = $1', [id]);
      
      // Delete user
      const result = await client.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
      
      return result.rows[0];
    });
  }

  // Set reset password token
  static async setResetToken(email, token, expires) {
    await query(
      'UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE email = $3',
      [token, expires, email]
    );
  }

  // Find user by reset token
  static async findByResetToken(token) {
    const result = await query(
      'SELECT * FROM users WHERE reset_password_token = $1 AND reset_password_expires > NOW()',
      [token]
    );
    return result.rows[0];
  }

  // Clear reset token
  static async clearResetToken(id) {
    await query(
      'UPDATE users SET reset_password_token = NULL, reset_password_expires = NULL WHERE id = $1',
      [id]
    );
  }
}

export default User;