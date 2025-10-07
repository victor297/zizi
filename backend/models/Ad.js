import { query, transaction } from '../config/database.js';

export class Ad {
  // Create a new ad
  static async create(adData) {
    const {
      user_id, title, description, price, category_id, subcategory_id,
      location, condition, images, is_negotiable, contact_phone,
      // Job-specific fields
      job_type, salary_range, experience_level, company_name,
      application_method, deadline
    } = adData;

    return await transaction(async (client) => {
      // Create the ad
      const adResult = await client.query(
        `INSERT INTO ads (
          user_id, title, description, price, category_id, subcategory_id,
          location, condition, images, is_negotiable, contact_phone, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending')
        RETURNING *`,
        [user_id, title, description, price, category_id, subcategory_id,
         location, condition, JSON.stringify(images || []), is_negotiable, contact_phone]
      );

      const ad = adResult.rows[0];

      // If it's a job ad, create job details
      if (job_type) {
        await client.query(
          `INSERT INTO job_details (
            ad_id, job_type, salary_range, experience_level,
            company_name, application_method, deadline
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [ad.id, job_type, salary_range, experience_level,
           company_name, application_method, deadline]
        );
      }

      return ad;
    });
  }

  // Get ads with filters and pagination
  static async getAll(filters = {}, page = 1, limit = 20) {
    const {
      category_id, subcategory_id, location, min_price, max_price,
      condition, search, user_id, status = 'active', featured,
      urgent, sort_by = 'newest'
    } = filters;

    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];
    let paramCount = 1;

    // Build WHERE conditions
    conditions.push(`a.status = $${paramCount}`);
    params.push(status);
    paramCount++;

    if (category_id) {
      conditions.push(`a.category_id = $${paramCount}`);
      params.push(category_id);
      paramCount++;
    }

    if (subcategory_id) {
      conditions.push(`a.subcategory_id = $${paramCount}`);
      params.push(subcategory_id);
      paramCount++;
    }

    if (location) {
      conditions.push(`a.location ILIKE $${paramCount}`);
      params.push(`%${location}%`);
      paramCount++;
    }

    if (min_price) {
      conditions.push(`a.price >= $${paramCount}`);
      params.push(min_price);
      paramCount++;
    }

    if (max_price) {
      conditions.push(`a.price <= $${paramCount}`);
      params.push(max_price);
      paramCount++;
    }

    if (condition) {
      conditions.push(`a.condition = $${paramCount}`);
      params.push(condition);
      paramCount++;
    }

    if (search) {
      conditions.push(`(a.title ILIKE $${paramCount} OR a.description ILIKE $${paramCount})`);
      params.push(`%${search}%`);
      paramCount++;
    }

    if (user_id) {
      conditions.push(`a.user_id = $${paramCount}`);
      params.push(user_id);
      paramCount++;
    }

    if (featured) {
      conditions.push(`a.is_featured = true AND a.featured_until > NOW()`);
    }

    if (urgent) {
      conditions.push(`a.is_urgent = true AND a.urgent_until > NOW()`);
    }

    // Build ORDER BY clause
    let orderBy = 'a.created_at DESC';
    switch (sort_by) {
      case 'price_low':
        orderBy = 'a.price ASC, a.created_at DESC';
        break;
      case 'price_high':
        orderBy = 'a.price DESC, a.created_at DESC';
        break;
      case 'oldest':
        orderBy = 'a.created_at ASC';
        break;
      case 'featured':
        orderBy = 'a.is_featured DESC, a.created_at DESC';
        break;
      default:
        orderBy = 'a.is_featured DESC, a.is_urgent DESC, a.bumped_at DESC NULLS LAST, a.created_at DESC';
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Add pagination parameters
    params.push(limit, offset);
    const limitOffset = `LIMIT $${paramCount} OFFSET $${paramCount + 1}`;

    const result = await query(
      `SELECT a.*, 
        u.name as user_name, u.avatar_url as user_avatar,
        c.name as category_name, c.slug as category_slug,
        sc.name as subcategory_name,
        jd.job_type, jd.salary_range, jd.experience_level, jd.company_name,
        (SELECT COUNT(*) FROM favorites WHERE ad_id = a.id) as favorites_count,
        (SELECT COUNT(*) FROM ad_views WHERE ad_id = a.id) as views_count
       FROM ads a
       JOIN users u ON a.user_id = u.id
       JOIN categories c ON a.category_id = c.id
       LEFT JOIN categories sc ON a.subcategory_id = sc.id
       LEFT JOIN job_details jd ON a.id = jd.ad_id
       ${whereClause}
       ORDER BY ${orderBy}
       ${limitOffset}`,
      params
    );

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM ads a ${whereClause}`,
      params.slice(0, -2) // Remove limit and offset params
    );

    return {
      ads: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    };
  }

  // Get ad by ID
  static async findById(id, userId = null) {
    const result = await query(
      `SELECT a.*, 
        u.name as user_name, u.email as user_email, u.phone as user_phone,
        u.avatar_url as user_avatar, u.created_at as user_joined,
        c.name as category_name, c.slug as category_slug,
        sc.name as subcategory_name,
        jd.job_type, jd.salary_range, jd.experience_level, jd.company_name,
        jd.application_method, jd.deadline,
        (SELECT COUNT(*) FROM favorites WHERE ad_id = a.id) as favorites_count,
        (SELECT COUNT(*) FROM ad_views WHERE ad_id = a.id) as views_count,
        ${userId ? `(SELECT COUNT(*) FROM favorites WHERE ad_id = a.id AND user_id = $2) > 0 as is_favorited` : 'false as is_favorited'}
       FROM ads a
       JOIN users u ON a.user_id = u.id
       JOIN categories c ON a.category_id = c.id
       LEFT JOIN categories sc ON a.subcategory_id = sc.id
       LEFT JOIN job_details jd ON a.id = jd.ad_id
       WHERE a.id = $1`,
      userId ? [id, userId] : [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const ad = result.rows[0];

    // Record view if user is different from ad owner
    if (userId && userId !== ad.user_id) {
      await query(
        `INSERT INTO ad_views (ad_id, user_id, viewed_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (ad_id, user_id) DO UPDATE SET viewed_at = NOW()`,
        [id, userId]
      );
    }

    return ad;
  }

  // Update ad
  static async update(id, updateData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    // Handle regular ad fields
    const adFields = [
      'title', 'description', 'price', 'category_id', 'subcategory_id',
      'location', 'condition', 'images', 'is_negotiable', 'contact_phone'
    ];

    adFields.forEach(field => {
      if (updateData[field] !== undefined) {
        if (field === 'images') {
          fields.push(`${field} = $${paramCount}`);
          values.push(JSON.stringify(updateData[field]));
        } else {
          fields.push(`${field} = $${paramCount}`);
          values.push(updateData[field]);
        }
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    return await transaction(async (client) => {
      // Update ad
      values.push(id);
      const adResult = await client.query(
        `UPDATE ads SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${paramCount}
         RETURNING *`,
        values
      );

      // Update job details if provided
      const jobFields = ['job_type', 'salary_range', 'experience_level', 'company_name', 'application_method', 'deadline'];
      const jobUpdateData = {};
      
      jobFields.forEach(field => {
        if (updateData[field] !== undefined) {
          jobUpdateData[field] = updateData[field];
        }
      });

      if (Object.keys(jobUpdateData).length > 0) {
        const jobFieldsArray = [];
        const jobValues = [];
        let jobParamCount = 1;

        Object.keys(jobUpdateData).forEach(field => {
          jobFieldsArray.push(`${field} = $${jobParamCount}`);
          jobValues.push(jobUpdateData[field]);
          jobParamCount++;
        });

        jobValues.push(id);
        await client.query(
          `UPDATE job_details SET ${jobFieldsArray.join(', ')}
           WHERE ad_id = $${jobParamCount}`,
          jobValues
        );
      }

      return adResult.rows[0];
    });
  }

  // Delete ad
  static async delete(id) {
    return await transaction(async (client) => {
      // Delete related records
      await client.query('DELETE FROM favorites WHERE ad_id = $1', [id]);
      await client.query('DELETE FROM ad_views WHERE ad_id = $1', [id]);
      await client.query('DELETE FROM job_details WHERE ad_id = $1', [id]);
      
      // Delete ad
      const result = await client.query('DELETE FROM ads WHERE id = $1 RETURNING *', [id]);
      return result.rows[0];
    });
  }

  // Bump ad (move to top)
  static async bump(id) {
    const result = await query(
      `UPDATE ads SET 
        bumped_at = NOW(),
        bump_expires_at = NOW() + INTERVAL '7 days'
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    return result.rows[0];
  }

  // Feature ad
  static async feature(id, duration = 30) {
    const result = await query(
      `UPDATE ads SET 
        is_featured = true,
        featured_at = NOW(),
        featured_until = NOW() + INTERVAL '${duration} days'
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    return result.rows[0];
  }

  // Mark as urgent
  static async markUrgent(id, duration = 7) {
    const result = await query(
      `UPDATE ads SET 
        is_urgent = true,
        urgent_at = NOW(),
        urgent_until = NOW() + INTERVAL '${duration} days'
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    return result.rows[0];
  }

  // Update ad status
  static async updateStatus(id, status) {
    const result = await query(
      'UPDATE ads SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );

    return result.rows[0];
  }

  // Get featured ads
  static async getFeatured(limit = 10) {
    const result = await query(
      `SELECT a.*, 
        u.name as user_name, u.avatar_url as user_avatar,
        c.name as category_name, c.slug as category_slug,
        (SELECT COUNT(*) FROM favorites WHERE ad_id = a.id) as favorites_count
       FROM ads a
       JOIN users u ON a.user_id = u.id
       JOIN categories c ON a.category_id = c.id
       WHERE a.status = 'active' AND a.is_featured = true AND a.featured_until > NOW()
       ORDER BY a.featured_at DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows;
  }

  // Get similar ads
  static async getSimilar(id, limit = 6) {
    const result = await query(
      `SELECT a.*, 
        u.name as user_name, u.avatar_url as user_avatar,
        c.name as category_name
       FROM ads a
       JOIN users u ON a.user_id = u.id
       JOIN categories c ON a.category_id = c.id
       WHERE a.status = 'active' 
         AND a.id != $1
         AND a.category_id = (SELECT category_id FROM ads WHERE id = $1)
       ORDER BY a.created_at DESC
       LIMIT $2`,
      [id, limit]
    );

    return result.rows;
  }

  // Get user's ads
  static async getUserAds(userId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT a.*, 
        c.name as category_name,
        (SELECT COUNT(*) FROM favorites WHERE ad_id = a.id) as favorites_count,
        (SELECT COUNT(*) FROM ad_views WHERE ad_id = a.id) as views_count
       FROM ads a
       JOIN categories c ON a.category_id = c.id
       WHERE a.user_id = $1
       ORDER BY a.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await query(
      'SELECT COUNT(*) FROM ads WHERE user_id = $1',
      [userId]
    );

    return {
      ads: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    };
  }

  // Search ads
  static async search(searchTerm, filters = {}, page = 1, limit = 20) {
    return this.getAll({ ...filters, search: searchTerm }, page, limit);
  }

  // Get ad statistics
  static async getStats() {
    const result = await query(
      `SELECT 
        COUNT(*) as total_ads,
        COUNT(*) FILTER (WHERE status = 'active') as active_ads,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_ads,
        COUNT(*) FILTER (WHERE status = 'sold') as sold_ads,
        COUNT(*) FILTER (WHERE is_featured = true AND featured_until > NOW()) as featured_ads,
        COUNT(*) FILTER (WHERE is_urgent = true AND urgent_until > NOW()) as urgent_ads,
        AVG(price) as average_price,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as ads_today,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as ads_this_week`
    );

    return result.rows[0];
  }
}

export default Ad;