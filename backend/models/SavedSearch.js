import { query } from '../config/database.js';

export class SavedSearch {
  // Save a search
  static async create(searchData) {
    const { user_id, name, search_params, notification_enabled } = searchData;
    
    const result = await query(
      `INSERT INTO saved_searches (user_id, name, search_params, notification_enabled)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [user_id, name, JSON.stringify(search_params), notification_enabled]
    );

    const savedSearch = result.rows[0];
    return {
      ...savedSearch,
      search_params: JSON.parse(savedSearch.search_params)
    };
  }

  // Get user's saved searches
  static async getUserSavedSearches(userId) {
    const result = await query(
      'SELECT * FROM saved_searches WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    return result.rows.map(search => ({
      ...search,
      search_params: JSON.parse(search.search_params)
    }));
  }

  // Update saved search
  static async update(id, userId, updateData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && key !== 'id') {
        if (key === 'search_params') {
          fields.push(`${key} = $${paramCount}`);
          values.push(JSON.stringify(updateData[key]));
        } else {
          fields.push(`${key} = $${paramCount}`);
          values.push(updateData[key]);
        }
        paramCount++;
      }
    });

    values.push(id, userId);
    const result = await query(
      `UPDATE saved_searches SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) return null;

    const savedSearch = result.rows[0];
    return {
      ...savedSearch,
      search_params: JSON.parse(savedSearch.search_params)
    };
  }

  // Delete saved search
  static async delete(id, userId) {
    const result = await query(
      'DELETE FROM saved_searches WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    return result.rows[0];
  }

  // Delete all saved searches for user
  static async deleteAll(userId) {
    const result = await query(
      'DELETE FROM saved_searches WHERE user_id = $1',
      [userId]
    );

    return result.rowCount;
  }
}

export default SavedSearch;