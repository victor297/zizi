import { query, transaction } from "../config/database.js";

export class SubscriptionPlan {
  // Create a new subscription plan
  static async create(planData) {
    const {
      name,
      description,
      price,
      duration,
      features,
      ad_limit,
      is_active,
    } = planData;

    const result = await query(
      `INSERT INTO subscription_plans (name, description, price, duration, features, ad_limit, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        name,
        description,
        price,
        duration,
        JSON.stringify(features),
        ad_limit,
        is_active,
      ]
    );

    return result.rows[0];
  }

  // Get all subscription plans
  static async getAll(includeInactive = false) {
    const whereClause = includeInactive ? "" : "WHERE is_active = true";

    const result = await query(
      `SELECT * FROM subscription_plans ${whereClause} ORDER BY price ASC`
    );

    return result.rows.map((plan) => ({
      ...plan,
      features:
        typeof plan.features === "string"
          ? JSON.parse(plan.features)
          : plan.features,
    }));
  }
  // Get plan by ID
  static async findById(id) {
    const result = await query(
      "SELECT * FROM subscription_plans WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) return null;

    const plan = result.rows[0];
    return {
      ...plan,
      features: JSON.parse(plan.features || "[]"),
    };
  }

  // Update subscription plan
  static async update(id, updateData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updateData).forEach((key) => {
      if (updateData[key] !== undefined && key !== "id") {
        if (key === "features") {
          fields.push(`${key} = $${paramCount}`);
          values.push(JSON.stringify(updateData[key]));
        } else {
          fields.push(`${key} = $${paramCount}`);
          values.push(updateData[key]);
        }
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error("No fields to update");
    }

    values.push(id);
    const result = await query(
      `UPDATE subscription_plans SET ${fields.join(
        ", "
      )}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    const plan = result.rows[0];
    return {
      ...plan,
      features: JSON.parse(plan.features || "[]"),
    };
  }

  // Delete subscription plan
  static async delete(id) {
    // Check if plan has active subscribers
    const subscribersResult = await query(
      "SELECT COUNT(*) FROM user_subscriptions WHERE plan_id = $1 AND status = $2",
      [id, "active"]
    );

    if (parseInt(subscribersResult.rows[0].count) > 0) {
      throw new Error("Cannot delete plan with active subscribers");
    }

    const result = await query(
      "DELETE FROM subscription_plans WHERE id = $1 RETURNING *",
      [id]
    );

    return result.rows[0];
  }

  // Get plan statistics
  static async getStats() {
    const result = await query(
      `SELECT 
        COUNT(*) as total_plans,
        COUNT(*) FILTER (WHERE is_active = true) as active_plans,
        COUNT(*) FILTER (WHERE is_active = false) as inactive_plans,
        AVG(price) as average_price`
    );

    return result.rows[0];
  }
}

export default SubscriptionPlan;
