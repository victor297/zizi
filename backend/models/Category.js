import { query } from '../config/database.js';

export class Category {
  // Create a new category
  static async create(categoryData) {
    const { name, description, parent_id, icon, slug } = categoryData;
    
    const result = await query(
      `INSERT INTO categories (name, description, parent_id, icon, slug, status)
       VALUES ($1, $2, $3, $4, $5, 'active')
       RETURNING *`,
      [name, description, parent_id, icon, slug]
    );

    return result.rows[0];
  }

  // Get all categories with subcategories
  static async getAll() {
    const result = await query(
      `SELECT c.*, 
        (SELECT COUNT(*) FROM ads WHERE category_id = c.id AND status = 'active') as ad_count,
        (SELECT json_agg(
          json_build_object(
            'id', sc.id,
            'name', sc.name,
            'description', sc.description,
            'icon', sc.icon,
            'slug', sc.slug,
            'ad_count', (SELECT COUNT(*) FROM ads WHERE category_id = sc.id AND status = 'active')
          )
        ) FROM categories sc WHERE sc.parent_id = c.id AND sc.status = 'active') as subcategories
       FROM categories c 
       WHERE c.parent_id IS NULL AND c.status = 'active'
       ORDER BY c.sort_order, c.name`
    );

    return result.rows;
  }

  // Get category by ID
  static async findById(id) {
    const result = await query(
      `SELECT c.*,
        (SELECT COUNT(*) FROM ads WHERE category_id = c.id AND status = 'active') as ad_count,
        (SELECT name FROM categories WHERE id = c.parent_id) as parent_name
       FROM categories c 
       WHERE c.id = $1`,
      [id]
    );

    return result.rows[0];
  }

  // Get category by slug
  static async findBySlug(slug) {
    const result = await query(
      `SELECT c.*,
        (SELECT COUNT(*) FROM ads WHERE category_id = c.id AND status = 'active') as ad_count,
        (SELECT name FROM categories WHERE id = c.parent_id) as parent_name
       FROM categories c 
       WHERE c.slug = $1 AND c.status = 'active'`,
      [slug]
    );

    return result.rows[0];
  }

  // Get subcategories by parent ID
  static async getSubcategories(parentId) {
    const result = await query(
      `SELECT c.*,
        (SELECT COUNT(*) FROM ads WHERE category_id = c.id AND status = 'active') as ad_count
       FROM categories c 
       WHERE c.parent_id = $1 AND c.status = 'active'
       ORDER BY c.sort_order, c.name`,
      [parentId]
    );

    return result.rows;
  }

  // Update category
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
      `UPDATE categories SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    return result.rows[0];
  }

  // Delete category
  static async delete(id) {
    // Check if category has ads
    const adsResult = await query(
      'SELECT COUNT(*) FROM ads WHERE category_id = $1',
      [id]
    );

    if (parseInt(adsResult.rows[0].count) > 0) {
      throw new Error('Cannot delete category with existing ads');
    }

    // Check if category has subcategories
    const subcategoriesResult = await query(
      'SELECT COUNT(*) FROM categories WHERE parent_id = $1',
      [id]
    );

    if (parseInt(subcategoriesResult.rows[0].count) > 0) {
      throw new Error('Cannot delete category with subcategories');
    }

    const result = await query(
      'DELETE FROM categories WHERE id = $1 RETURNING *',
      [id]
    );

    return result.rows[0];
  }

  // Get category hierarchy (breadcrumb)
  static async getHierarchy(categoryId) {
    const result = await query(
      `WITH RECURSIVE category_hierarchy AS (
        SELECT id, name, slug, parent_id, 0 as level
        FROM categories
        WHERE id = $1
        
        UNION ALL
        
        SELECT c.id, c.name, c.slug, c.parent_id, ch.level + 1
        FROM categories c
        INNER JOIN category_hierarchy ch ON c.id = ch.parent_id
      )
      SELECT * FROM category_hierarchy ORDER BY level DESC`,
      [categoryId]
    );

    return result.rows;
  }

  // Get popular categories (most ads)
  static async getPopular(limit = 6) {
    const result = await query(
      `SELECT c.*, COUNT(a.id) as ad_count
       FROM categories c
       LEFT JOIN ads a ON c.id = a.category_id AND a.status = 'active'
       WHERE c.parent_id IS NULL AND c.status = 'active'
       GROUP BY c.id
       ORDER BY ad_count DESC, c.name
       LIMIT $1`,
      [limit]
    );

    return result.rows;
  }

  // Search categories
  static async search(searchTerm) {
    const result = await query(
      `SELECT c.*,
        (SELECT COUNT(*) FROM ads WHERE category_id = c.id AND status = 'active') as ad_count
       FROM categories c
       WHERE (c.name ILIKE $1 OR c.description ILIKE $1) AND c.status = 'active'
       ORDER BY c.name`,
      [`%${searchTerm}%`]
    );

    return result.rows;
  }

  // Get category statistics (admin)
  static async getStats() {
    const result = await query(
      `SELECT 
        COUNT(*) as total_categories,
        COUNT(*) FILTER (WHERE parent_id IS NULL) as main_categories,
        COUNT(*) FILTER (WHERE parent_id IS NOT NULL) as subcategories,
        COUNT(*) FILTER (WHERE status = 'active') as active_categories,
        COUNT(*) FILTER (WHERE status = 'inactive') as inactive_categories`
    );

    return result.rows[0];
  }

  // Update sort order
  static async updateSortOrder(id, sortOrder) {
    const result = await query(
      'UPDATE categories SET sort_order = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [sortOrder, id]
    );

    return result.rows[0];
  }
}

export default Category;