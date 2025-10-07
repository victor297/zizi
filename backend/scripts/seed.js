import { query } from "../config/database.js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const seedData = async () => {
  try {
    console.log("🌱 Starting database seeding...");

    // Create admin user
    const adminPassword = await bcrypt.hash("admin123", 10);
    await query(
      `
      INSERT INTO users (name, email, password, phone, location, role, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (email) DO NOTHING
    `,
      [
        "Admin User",
        "admin@jiji.ng",
        adminPassword,
        "+2348012345678",
        "Lagos, Nigeria",
        "admin",
        "active",
      ]
    );

    // Create test users
    const testPassword = await bcrypt.hash("password123", 10);
    const testUsers = [
      ["John Doe", "john@example.com", "+2348012345679", "Lagos, Nigeria"],
      ["Jane Smith", "jane@example.com", "+2348012345680", "Abuja, Nigeria"],
      [
        "Mike Johnson",
        "mike@example.com",
        "+2348012345681",
        "Port Harcourt, Nigeria",
      ],
      ["Sarah Wilson", "sarah@example.com", "+2348012345682", "Kano, Nigeria"],
      ["David Brown", "david@example.com", "+2348012345683", "Ibadan, Nigeria"],
    ];

    for (const [name, email, phone, location] of testUsers) {
      await query(
        `
        INSERT INTO users (name, email, password, phone, location, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (email) DO NOTHING
      `,
        [name, email, testPassword, phone, location, "active"]
      );
    }

    // Create main categories
    const mainCategories = [
      [
        "Cars",
        "Buy and sell cars, motorcycles, and automotive parts",
        "cars",
        "🚗",
      ],
      [
        "Properties",
        "Houses, apartments, land, and commercial properties",
        "properties",
        "🏠",
      ],
      [
        "Phones & Tablets",
        "Mobile phones, tablets, and accessories",
        "phones",
        "📱",
      ],
      [
        "Electronics",
        "Computers, TVs, audio equipment, and gadgets",
        "electronics",
        "💻",
      ],
      ["Jobs", "Job opportunities and career listings", "jobs", "💼"],
      ["Services", "Professional and personal services", "services", "🔧"],
      ["Fashion", "Clothing, shoes, bags, and accessories", "fashion", "👗"],
      [
        "Home & Garden",
        "Furniture, appliances, and home decor",
        "home-garden",
        "🏡",
      ],
      ["Sports & Fitness", "Sports equipment and fitness gear", "sports", "⚽"],
      [
        "Books & Education",
        "Books, educational materials, and courses",
        "books",
        "📚",
      ],
    ];

    for (const [name, description, slug, icon] of mainCategories) {
      await query(
        `
        INSERT INTO categories (name, description, slug, icon, sort_order)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (slug) DO NOTHING
      `,
        [
          name,
          description,
          slug,
          icon,
          mainCategories.findIndex((cat) => cat[0] === name && cat[2] === slug),
        ]
      );
    }

    // Get category IDs for subcategories
    const categoriesResult = await query(
      "SELECT id, slug FROM categories WHERE parent_id IS NULL"
    );
    const categoryMap = {};
    categoriesResult.rows.forEach((cat) => {
      categoryMap[cat.slug] = cat.id;
    });

    // Create subcategories
    const subcategories = [
      // Cars subcategories
      ["Toyota", "Toyota vehicles", "toyota", categoryMap["cars"]],
      ["Honda", "Honda vehicles", "honda", categoryMap["cars"]],
      ["Mercedes", "Mercedes-Benz vehicles", "mercedes", categoryMap["cars"]],
      ["BMW", "BMW vehicles", "bmw", categoryMap["cars"]],
      [
        "Motorcycles",
        "Motorcycles and bikes",
        "motorcycles",
        categoryMap["cars"],
      ],

      // Properties subcategories
      [
        "Houses for Sale",
        "Houses for sale",
        "houses-sale",
        categoryMap["properties"],
      ],
      [
        "Houses for Rent",
        "Houses for rent",
        "houses-rent",
        categoryMap["properties"],
      ],
      [
        "Apartments",
        "Apartments and flats",
        "apartments",
        categoryMap["properties"],
      ],
      ["Land", "Land for sale", "land", categoryMap["properties"]],
      [
        "Commercial",
        "Commercial properties",
        "commercial",
        categoryMap["properties"],
      ],

      // Phones subcategories
      ["iPhone", "Apple iPhones", "iphone", categoryMap["phones"]],
      ["Samsung", "Samsung phones", "samsung", categoryMap["phones"]],
      ["Android", "Android phones", "android", categoryMap["phones"]],
      ["Tablets", "Tablets and iPads", "tablets", categoryMap["phones"]],
      [
        "Accessories",
        "Phone accessories",
        "phone-accessories",
        categoryMap["phones"],
      ],

      // Electronics subcategories
      [
        "Laptops",
        "Laptops and notebooks",
        "laptops",
        categoryMap["electronics"],
      ],
      ["Desktops", "Desktop computers", "desktops", categoryMap["electronics"]],
      ["TVs", "Televisions", "tvs", categoryMap["electronics"]],
      ["Audio", "Audio equipment", "audio", categoryMap["electronics"]],
      [
        "Gaming",
        "Gaming consoles and accessories",
        "gaming",
        categoryMap["electronics"],
      ],

      // Jobs subcategories
      [
        "IT & Software",
        "Information Technology jobs",
        "it-software",
        categoryMap["jobs"],
      ],
      [
        "Sales & Marketing",
        "Sales and marketing positions",
        "sales-marketing",
        categoryMap["jobs"],
      ],
      [
        "Engineering",
        "Engineering positions",
        "engineering",
        categoryMap["jobs"],
      ],
      [
        "Healthcare",
        "Healthcare and medical jobs",
        "healthcare",
        categoryMap["jobs"],
      ],
      [
        "Education",
        "Teaching and education jobs",
        "education",
        categoryMap["jobs"],
      ],

      // Fashion subcategories
      [
        "Men's Clothing",
        "Men's fashion",
        "mens-clothing",
        categoryMap["fashion"],
      ],
      [
        "Women's Clothing",
        "Women's fashion",
        "womens-clothing",
        categoryMap["fashion"],
      ],
      ["Shoes", "Footwear", "shoes", categoryMap["fashion"]],
      ["Bags", "Handbags and backpacks", "bags", categoryMap["fashion"]],
      [
        "Accessories",
        "Fashion accessories",
        "fashion-accessories",
        categoryMap["fashion"],
      ],
    ];

    for (const [name, description, slug, parentId] of subcategories) {
      if (parentId) {
        await query(
          `
          INSERT INTO categories (name, description, slug, parent_id)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (slug) DO NOTHING
        `,
          [name, description, slug, parentId]
        );
      }
    }

    // Create sample ads
    const users = await query("SELECT id FROM users WHERE role = $1 LIMIT 5", [
      "user",
    ]);
    const categories = await query(
      "SELECT id FROM categories WHERE parent_id IS NOT NULL LIMIT 10"
    );

    if (users.rows.length > 0 && categories.rows.length > 0) {
      const sampleAds = [
        {
          title: "Toyota Camry 2018 - Excellent Condition",
          description:
            "Well maintained Toyota Camry 2018 model. Low mileage, full service history. Perfect for family use.",
          price: 8500000,
          location: "Lagos, Nigeria",
          condition: "used",
          images: JSON.stringify([
            {
              url: "https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg",
              public_id: "sample1",
            },
          ]),
        },
        {
          title: "iPhone 13 Pro Max - 256GB",
          description:
            "Brand new iPhone 13 Pro Max with 256GB storage. Still in original packaging with warranty.",
          price: 650000,
          location: "Abuja, Nigeria",
          condition: "new",
          images: JSON.stringify([
            {
              url: "https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg",
              public_id: "sample2",
            },
          ]),
        },
        {
          title: "3 Bedroom Apartment for Rent",
          description:
            "Spacious 3 bedroom apartment in a serene environment. Fully furnished with modern amenities.",
          price: 1200000,
          location: "Port Harcourt, Nigeria",
          condition: "used",
          images: JSON.stringify([
            {
              url: "https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg",
              public_id: "sample3",
            },
          ]),
        },
        {
          title: "MacBook Pro 2021 - M1 Chip",
          description:
            "MacBook Pro with M1 chip, 16GB RAM, 512GB SSD. Perfect for professionals and students.",
          price: 1800000,
          location: "Lagos, Nigeria",
          condition: "used",
          images: JSON.stringify([
            {
              url: "https://images.pexels.com/photos/205421/pexels-photo-205421.jpeg",
              public_id: "sample4",
            },
          ]),
        },
        {
          title: "Software Developer Position - Remote",
          description:
            "We are looking for an experienced software developer to join our remote team. Full-time position with competitive salary.",
          price: 500000,
          location: "Remote, Nigeria",
          condition: "new",
          images: JSON.stringify([]),
        },
      ];

      for (let i = 0; i < sampleAds.length; i++) {
        const ad = sampleAds[i];
        const userId = users.rows[i % users.rows.length].id;
        const categoryId = categories.rows[i % categories.rows.length].id;

        await query(
          `
          INSERT INTO ads (
            user_id, title, description, price, category_id, location, 
            condition, images, status, is_negotiable
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `,
          [
            userId,
            ad.title,
            ad.description,
            ad.price,
            categoryId,
            ad.location,
            ad.condition,
            ad.images,
            "active",
            true,
          ]
        );
      }

      // Create a job ad with job details
      const jobAdResult = await query(
        `
        INSERT INTO ads (
          user_id, title, description, price, category_id, location, 
          condition, images, status, is_negotiable
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `,
        [
          users.rows[0].id,
          "Senior Frontend Developer - React/Next.js",
          "We are seeking a senior frontend developer with expertise in React and Next.js. Join our innovative team and work on cutting-edge projects.",
          800000,
          categoryMap["jobs"] || categories.rows[0].id,
          "Lagos, Nigeria",
          "new",
          JSON.stringify([]),
          "active",
          false,
        ]
      );

      if (jobAdResult.rows.length > 0) {
        await query(
          `
          INSERT INTO job_details (
            ad_id, job_type, salary_range, experience_level, 
            company_name, application_method, deadline
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
          [
            jobAdResult.rows[0].id,
            "full-time",
            "₦600,000 - ₦1,000,000",
            "senior",
            "TechCorp Nigeria",
            "email",
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          ]
        );
      }
    }

    // Create subscription plans - First check if they exist to avoid duplicates
    const existingPlans = await query("SELECT name FROM subscription_plans");
    const existingPlanNames = existingPlans.rows.map((row) => row.name);

    const subscriptionPlans = [
      {
        name: "Free",
        description: "Basic plan for casual sellers",
        price: 0,
        duration: "month",
        features: [
          "Post up to 5 ads",
          "Basic search visibility",
          "Standard support",
        ],
        ad_limit: 5,
      },
      {
        name: "Premium",
        description: "Perfect for regular sellers",
        price: 2500,
        duration: "month",
        features: [
          "Post up to 50 ads",
          "Featured placement",
          "Priority support",
          "Advanced analytics",
        ],
        ad_limit: 50,
      },
      {
        name: "Business",
        description: "For businesses and power sellers",
        price: 5000,
        duration: "month",
        features: [
          "Unlimited ads",
          "Premium store features",
          "Bulk ad management",
          "API access",
          "Dedicated support",
        ],
        ad_limit: -1,
      },
    ];

    for (const plan of subscriptionPlans) {
      if (!existingPlanNames.includes(plan.name)) {
        await query(
          `
          INSERT INTO subscription_plans (name, description, price, duration, features, ad_limit, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
          [
            plan.name,
            plan.description,
            plan.price,
            plan.duration,
            JSON.stringify(plan.features),
            plan.ad_limit,
            true,
          ]
        );
      }
    }

    // Create user settings for existing users
    const existingSettings = await query("SELECT user_id FROM user_settings");
    const existingSettingUserIds = existingSettings.rows.map(
      (row) => row.user_id
    );

    const allUsers = await query("SELECT id FROM users");
    for (const user of allUsers.rows) {
      if (!existingSettingUserIds.includes(user.id)) {
        await query(
          `
          INSERT INTO user_settings (user_id, chat_enabled, reviews_enabled, email_notifications)
          VALUES ($1, $2, $3, $4)
        `,
          [user.id, true, true, true]
        );
      }
    }

    // Create some sample business profiles
    const businessUsers = await query(
      "SELECT id FROM users WHERE role = $1 LIMIT 2",
      ["user"]
    );

    const existingBusinessProfiles = await query(
      "SELECT user_id FROM business_profiles"
    );
    const existingBusinessUserIds = existingBusinessProfiles.rows.map(
      (row) => row.user_id
    );

    if (businessUsers.rows.length > 0) {
      for (const user of businessUsers.rows) {
        if (!existingBusinessUserIds.includes(user.id)) {
          await query(
            `
            INSERT INTO business_profiles (
              user_id, business_name, description, website_url, 
              business_hours, delivery_options, store_address, social_links, is_verified
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          `,
            [
              user.id,
              "TechHub Electronics",
              "Your trusted electronics store with genuine products and warranty",
              "https://techhub.ng",
              JSON.stringify({
                monday: "9:00 AM - 6:00 PM",
                tuesday: "9:00 AM - 6:00 PM",
                wednesday: "9:00 AM - 6:00 PM",
                thursday: "9:00 AM - 6:00 PM",
                friday: "9:00 AM - 6:00 PM",
                saturday: "10:00 AM - 4:00 PM",
                sunday: "Closed",
              }),
              JSON.stringify(["pickup", "delivery", "shipping"]),
              "Shop 45, Computer Village, Ikeja, Lagos",
              JSON.stringify({
                facebook: "https://facebook.com/techhub",
                instagram: "https://instagram.com/techhub",
                twitter: "https://twitter.com/techhub",
              }),
              true,
            ]
          );
        }
      }
    }

    console.log("✅ Database seeding completed successfully!");
    console.log("📧 Admin login: admin@jiji.ng / admin123");
    console.log("📧 Test user login: john@example.com / password123");
    console.log("✅ Subscription plans created successfully!");
    console.log("✅ User settings initialized!");
    console.log("✅ Sample business profiles created!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

// Run seeding if this file is executed directly
seedData();

export default seedData;
