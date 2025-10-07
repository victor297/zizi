import { pool, query } from "../config/database.js";
import dotenv from "dotenv";

dotenv.config();

const migrations = [
  // Users table
  `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    phone VARCHAR(20),
    location VARCHAR(100),
    avatar_url TEXT,
    google_id VARCHAR(255) UNIQUE,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
    reset_password_token VARCHAR(255),
    reset_password_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // Categories table
  `CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    slug VARCHAR(100) UNIQUE NOT NULL,
    parent_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    icon VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // Ads table
  `CREATE TABLE IF NOT EXISTS ads (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    category_id INTEGER NOT NULL REFERENCES categories(id),
    subcategory_id INTEGER REFERENCES categories(id),
    location VARCHAR(100) NOT NULL,
    condition VARCHAR(20) DEFAULT 'used' CHECK (condition IN ('new', 'used', 'refurbished')),
    images JSONB DEFAULT '[]',
    is_negotiable BOOLEAN DEFAULT true,
    contact_phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'sold', 'expired', 'rejected', 'inactive')),
    is_featured BOOLEAN DEFAULT false,
    featured_at TIMESTAMP,
    featured_until TIMESTAMP,
    is_urgent BOOLEAN DEFAULT false,
    urgent_at TIMESTAMP,
    urgent_until TIMESTAMP,
    bumped_at TIMESTAMP,
    bump_expires_at TIMESTAMP,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // Job details table (for job ads)
  `CREATE TABLE IF NOT EXISTS job_details (
    id SERIAL PRIMARY KEY,
    ad_id INTEGER NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
    job_type VARCHAR(50) CHECK (job_type IN ('full-time', 'part-time', 'contract', 'freelance', 'internship')),
    salary_range VARCHAR(100),
    experience_level VARCHAR(50) CHECK (experience_level IN ('entry', 'mid', 'senior', 'executive')),
    company_name VARCHAR(200),
    application_method VARCHAR(20) DEFAULT 'contact' CHECK (application_method IN ('contact', 'email', 'website')),
    deadline DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // Conversations table
  `CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    user1_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user2_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ad_id INTEGER REFERENCES ads(id) ON DELETE SET NULL,
    last_message_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user1_id, user2_id, ad_id)
  )`,

  // Messages table
  `CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'text' CHECK (type IN ('text', 'image', 'file')),
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // Add foreign key constraint for last_message_id
  `ALTER TABLE conversations 
   ADD CONSTRAINT fk_conversations_last_message 
   FOREIGN KEY (last_message_id) REFERENCES messages(id) ON DELETE SET NULL`,

  // Favorites table
  `CREATE TABLE IF NOT EXISTS favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ad_id INTEGER NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, ad_id)
  )`,

  // Ad views table
  `CREATE TABLE IF NOT EXISTS ad_views (
    id SERIAL PRIMARY KEY,
    ad_id INTEGER NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ad_id, user_id)
  )`,

  // Payments table
  `CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ad_id INTEGER REFERENCES ads(id) ON DELETE SET NULL,
    service VARCHAR(20) NOT NULL CHECK (service IN ('bump', 'feature', 'urgent')),
    amount INTEGER NOT NULL, -- Amount in kobo (Paystack format)
    reference VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    paystack_data JSONB,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // Blocked users table
  `CREATE TABLE IF NOT EXISTS blocked_users (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, blocked_user_id)
  )`,

  // User reports table
  `CREATE TABLE IF NOT EXISTS user_reports (
    id SERIAL PRIMARY KEY,
    reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(reporter_id, reported_user_id)
  )`,

  // Ad reports table
  `CREATE TABLE IF NOT EXISTS ad_reports (
    id SERIAL PRIMARY KEY,
    reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ad_id INTEGER NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
    reason VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(reporter_id, ad_id)
  )`,

  // Create indexes for better performance
  `CREATE INDEX IF NOT EXISTS idx_ads_user_id ON ads(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_ads_category_id ON ads(category_id)`,
  `CREATE INDEX IF NOT EXISTS idx_ads_status ON ads(status)`,
  `CREATE INDEX IF NOT EXISTS idx_ads_location ON ads(location)`,
  `CREATE INDEX IF NOT EXISTS idx_ads_price ON ads(price)`,
  `CREATE INDEX IF NOT EXISTS idx_ads_created_at ON ads(created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_ads_featured ON ads(is_featured, featured_until)`,
  `CREATE INDEX IF NOT EXISTS idx_ads_urgent ON ads(is_urgent, urgent_until)`,
  `CREATE INDEX IF NOT EXISTS idx_ads_bumped ON ads(bumped_at)`,

  `CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id)`,
  `CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id)`,
  `CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at)`,

  `CREATE INDEX IF NOT EXISTS idx_conversations_user1_id ON conversations(user1_id)`,
  `CREATE INDEX IF NOT EXISTS idx_conversations_user2_id ON conversations(user2_id)`,
  `CREATE INDEX IF NOT EXISTS idx_conversations_ad_id ON conversations(ad_id)`,

  `CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_favorites_ad_id ON favorites(ad_id)`,

  `CREATE INDEX IF NOT EXISTS idx_ad_views_ad_id ON ad_views(ad_id)`,
  `CREATE INDEX IF NOT EXISTS idx_ad_views_user_id ON ad_views(user_id)`,

  `CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(reference)`,
  `CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)`,

  // Full-text search indexes
  `CREATE INDEX IF NOT EXISTS idx_ads_search ON ads USING gin(to_tsvector('english', title || ' ' || description))`,
  `CREATE INDEX IF NOT EXISTS idx_categories_search ON categories USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')))`,

  // Trigger to update updated_at timestamp
  `CREATE OR REPLACE FUNCTION update_updated_at_column()
   RETURNS TRIGGER AS $$
   BEGIN
     NEW.updated_at = CURRENT_TIMESTAMP;
     RETURN NEW;
   END;
   $$ language 'plpgsql'`,

  `DROP TRIGGER IF EXISTS update_users_updated_at ON users`,
  `CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,

  `DROP TRIGGER IF EXISTS update_categories_updated_at ON categories`,
  `CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,

  `DROP TRIGGER IF EXISTS update_ads_updated_at ON ads`,
  `CREATE TRIGGER update_ads_updated_at BEFORE UPDATE ON ads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,

  `DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations`,
  `CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`, // <-- ADDED COMMA HERE

  // Subscription plans table
  `CREATE TABLE IF NOT EXISTS subscription_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    duration VARCHAR(20) DEFAULT 'month' CHECK (duration IN ('month', 'year')),
    features JSONB DEFAULT '[]',
    ad_limit INTEGER DEFAULT 5, -- -1 for unlimited
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // User subscriptions table
  `CREATE TABLE IF NOT EXISTS user_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id INTEGER NOT NULL REFERENCES subscription_plans(id),
    payment_reference VARCHAR(100),
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    cancelled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // Saved searches table
  `CREATE TABLE IF NOT EXISTS saved_searches (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    search_params JSONB NOT NULL,
    notification_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // Follows table
  `CREATE TABLE IF NOT EXISTS follows (
    id SERIAL PRIMARY KEY,
    follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(follower_id, following_id)
  )`,

  // Reviews table
  `CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    reviewer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewed_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ad_id INTEGER REFERENCES ads(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(reviewer_id, reviewed_user_id, ad_id)
  )`,

  // Business profiles table
  `CREATE TABLE IF NOT EXISTS business_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(200) NOT NULL,
    description TEXT,
    website_url VARCHAR(255),
    business_hours JSONB,
    delivery_options JSONB DEFAULT '[]',
    store_address TEXT,
    social_links JSONB DEFAULT '{}',
    is_verified BOOLEAN DEFAULT false,
    verification_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
  )`,

  // User settings table
  `CREATE TABLE IF NOT EXISTS user_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chat_enabled BOOLEAN DEFAULT true,
    reviews_enabled BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    push_notifications BOOLEAN DEFAULT true,
    marketing_emails BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
  )`,

  // Add verification fields to users table
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_date TIMESTAMP`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_type VARCHAR(50)`,

  // Create indexes for new tables
  `CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status)`,
  `CREATE INDEX IF NOT EXISTS idx_user_subscriptions_end_date ON user_subscriptions(end_date)`,

  `CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON saved_searches(user_id)`,

  `CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id)`,
  `CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id)`,

  `CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_user_id ON reviews(reviewed_user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews(reviewer_id)`,
  `CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating)`,

  `CREATE INDEX IF NOT EXISTS idx_business_profiles_user_id ON business_profiles(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_business_profiles_verified ON business_profiles(is_verified)`,

  `CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id)`,

  // Add triggers for new tables
  `DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON subscription_plans`,
  `CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,

  `DROP TRIGGER IF EXISTS update_saved_searches_updated_at ON saved_searches`,
  `CREATE TRIGGER update_saved_searches_updated_at BEFORE UPDATE ON saved_searches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,

  `DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews`,
  `CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,

  `DROP TRIGGER IF EXISTS update_business_profiles_updated_at ON business_profiles`,
  `CREATE TRIGGER update_business_profiles_updated_at BEFORE UPDATE ON business_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,

  `DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings`,
  `CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,
];

const runMigrations = async () => {
  try {
    console.log("🚀 Starting database migrations...");

    for (let i = 0; i < migrations.length; i++) {
      console.log(`Running migration ${i + 1}/${migrations.length}...`);
      await query(migrations[i]);
    }

    console.log("✅ All migrations completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
};

runMigrations();

export default runMigrations;
