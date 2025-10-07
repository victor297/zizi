import { query, transaction } from '../config/database.js';

export class Review {
  // Create a review
  static async create(reviewData) {
    const { reviewer_id, reviewed_user_id, ad_id, rating, comment } = reviewData;
    
    if (reviewer_id === reviewed_user_id) {
      throw new Error('Cannot review yourself');
    }

    // Check if user already reviewed this user for this ad
    const existingReview = await query(
      'SELECT id FROM reviews WHERE reviewer_id = $1 AND reviewed_user_id = $2 AND ad_id = $3',
      [reviewer_id, reviewed_user_id, ad_id]
    );

    if (existingReview.rows.length > 0) {
      throw new Error('You have already reviewed this user for this ad');
    }

    const result = await query(
      `INSERT INTO reviews (reviewer_id, reviewed_user_id, ad_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [reviewer_id, reviewed_user_id, ad_id, rating, comment]
    );

    return result.rows[0];
  }

  // Get reviews for a user (received)
  static async getReceivedReviews(userId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT r.*, 
        u.name as reviewer_name, u.avatar_url as reviewer_avatar,
        a.title as ad_title
       FROM reviews r
       JOIN users u ON r.reviewer_id = u.id
       LEFT JOIN ads a ON r.ad_id = a.id
       WHERE r.reviewed_user_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await query(
      'SELECT COUNT(*) FROM reviews WHERE reviewed_user_id = $1',
      [userId]
    );

    return {
      reviews: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    };
  }

  // Get reviews by a user (given)
  static async getGivenReviews(userId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT r.*, 
        u.name as reviewed_user_name, u.avatar_url as reviewed_user_avatar,
        a.title as ad_title
       FROM reviews r
       JOIN users u ON r.reviewed_user_id = u.id
       LEFT JOIN ads a ON r.ad_id = a.id
       WHERE r.reviewer_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await query(
      'SELECT COUNT(*) FROM reviews WHERE reviewer_id = $1',
      [userId]
    );

    return {
      reviews: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    };
  }

  // Get user's review statistics
  static async getUserStats(userId) {
    const result = await query(
      `SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as average_rating,
        COUNT(*) FILTER (WHERE rating = 5) as five_star,
        COUNT(*) FILTER (WHERE rating = 4) as four_star,
        COUNT(*) FILTER (WHERE rating = 3) as three_star,
        COUNT(*) FILTER (WHERE rating = 2) as two_star,
        COUNT(*) FILTER (WHERE rating = 1) as one_star
       FROM reviews 
       WHERE reviewed_user_id = $1`,
      [userId]
    );

    return result.rows[0];
  }

  // Update review
  static async update(id, userId, updateData) {
    const { rating, comment } = updateData;
    
    const result = await query(
      `UPDATE reviews 
       SET rating = $1, comment = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND reviewer_id = $4
       RETURNING *`,
      [rating, comment, id, userId]
    );

    return result.rows[0];
  }

  // Delete review
  static async delete(id, userId) {
    const result = await query(
      'DELETE FROM reviews WHERE id = $1 AND reviewer_id = $2 RETURNING *',
      [id, userId]
    );

    return result.rows[0];
  }
}

export default Review;