# Jiji.ng Clone - Backend API

A comprehensive Node.js backend for a marketplace platform similar to Jiji.ng, built with Express.js, PostgreSQL, and Socket.IO.

## 🚀 Features

### Core Functionality
- **User Authentication**: JWT-based auth with Google OAuth integration
- **Category Management**: Hierarchical categories with subcategories
- **Ad Management**: Full CRUD operations with image uploads
- **Real-time Messaging**: Socket.IO powered chat system
- **Payment Integration**: Paystack integration for premium features
- **Admin Dashboard**: Complete admin panel with analytics
- **File Uploads**: Cloudinary integration for image management
- **Search & Filtering**: Advanced search with full-text capabilities

### Premium Features
- **Ad Bumping**: Move ads to top of listings
- **Featured Ads**: Premium placement with highlighting
- **Urgent Ads**: Time-sensitive ad badges
- **Payment Processing**: Secure payment handling

### Security & Performance
- **Rate Limiting**: Protection against abuse
- **Input Validation**: Comprehensive request validation
- **Error Handling**: Centralized error management
- **Database Optimization**: Indexed queries and transactions
- **CORS Configuration**: Secure cross-origin requests

## 🛠 Tech Stack

- **Runtime**: Node.js with ES6 modules
- **Framework**: Express.js
- **Database**: PostgreSQL with connection pooling
- **Authentication**: JWT + Google OAuth
- **Real-time**: Socket.IO
- **File Storage**: Cloudinary
- **Payment**: Paystack
- **Email**: Nodemailer with Gmail SMTP
- **Validation**: Express-validator
- **Security**: Helmet, CORS, Rate limiting

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- Cloudinary account
- Google OAuth credentials
- Paystack account
- Gmail account for SMTP

## 🚀 Quick Start

### 1. Environment Setup

```bash
# Clone the repository
git clone <repository-url>
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` file with your credentials:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/jiji_clone
DB_HOST=localhost
DB_PORT=5432
DB_NAME=jiji_clone
DB_USER=username
DB_PASSWORD=password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@jiji.ng

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_test_your-paystack-secret-key
PAYSTACK_PUBLIC_KEY=pk_test_your-paystack-public-key
```

### 3. Database Setup

```bash
# Create PostgreSQL database
createdb jiji_clone

# Run migrations
npm run migrate

# Seed with sample data
npm run seed
```

### 4. Start Development Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## 📚 API Documentation

### Authentication Endpoints

```
POST /api/auth/register     - User registration
POST /api/auth/login        - User login
POST /api/auth/google       - Google OAuth login
GET  /api/auth/me          - Get current user
PUT  /api/auth/profile     - Update user profile
POST /api/auth/forgot-password - Request password reset
POST /api/auth/reset-password  - Reset password
POST /api/auth/logout      - Logout user
```

### Ad Management

```
GET    /api/ads            - Get ads with filters
POST   /api/ads            - Create new ad
GET    /api/ads/:id        - Get single ad
PUT    /api/ads/:id        - Update ad
DELETE /api/ads/:id        - Delete ad
POST   /api/ads/:id/bump   - Bump ad to top
POST   /api/ads/:id/feature - Feature ad
POST   /api/ads/:id/urgent  - Mark ad as urgent
GET    /api/ads/featured   - Get featured ads
GET    /api/ads/search     - Search ads
```

### Category Management

```
GET    /api/categories     - Get all categories
GET    /api/categories/:id - Get category by ID
GET    /api/categories/:id/subcategories - Get subcategories
POST   /api/categories     - Create category (Admin)
PUT    /api/categories/:id - Update category (Admin)
DELETE /api/categories/:id - Delete category (Admin)
```

### Chat System

```
GET    /api/chat/conversations - Get user conversations
POST   /api/chat/conversations - Create conversation
GET    /api/chat/conversations/:id/messages - Get messages
POST   /api/chat/messages     - Send message
PUT    /api/chat/conversations/:id/read - Mark as read
```

### Payment System

```
POST   /api/payments/initialize - Initialize payment
GET    /api/payments/verify/:ref - Verify payment
GET    /api/payments/history    - Payment history
GET    /api/payments/prices     - Service prices
POST   /api/payments/webhook    - Paystack webhook
```

### Admin Endpoints

```
GET    /api/admin/stats        - Dashboard statistics
GET    /api/admin/users        - Get all users
PUT    /api/admin/users/:id/status - Update user status
GET    /api/admin/ads          - Get all ads
PUT    /api/admin/ads/:id/status - Update ad status
GET    /api/admin/analytics    - Analytics data
```

## 🗄 Database Schema

### Core Tables

- **users**: User accounts and profiles
- **categories**: Hierarchical category system
- **ads**: Main ads table with all listings
- **job_details**: Extended fields for job ads
- **conversations**: Chat conversations between users
- **messages**: Individual chat messages
- **favorites**: User's favorite ads
- **payments**: Payment transactions
- **ad_views**: Ad view tracking

### Key Relationships

- Users can have multiple ads
- Categories can have subcategories (self-referencing)
- Ads belong to categories and users
- Job ads have extended details in job_details table
- Conversations link two users and optionally an ad
- Messages belong to conversations and users

## 🔧 Development

### Project Structure

```
backend/
├── config/          # Database and external service configs
├── controllers/     # Route controllers (deprecated - using routes directly)
├── middleware/      # Custom middleware (auth, validation, upload)
├── models/         # Database models and queries
├── routes/         # API route definitions
├── scripts/        # Database migration and seeding scripts
├── socket/         # Socket.IO event handlers
├── uploads/        # Temporary file uploads (auto-created)
├── .env.example    # Environment variables template
├── server.js       # Main application entry point
└── package.json    # Dependencies and scripts
```

### Available Scripts

```bash
npm run dev      # Start development server with nodemon
npm start        # Start production server
npm run migrate  # Run database migrations
npm run seed     # Seed database with sample data
```

### Adding New Features

1. **Create Model**: Add database queries in `models/`
2. **Add Routes**: Define endpoints in `routes/`
3. **Add Middleware**: Create validation/auth middleware
4. **Update Migration**: Add database changes to migration script
5. **Test**: Test endpoints with sample data

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for password security
- **Rate Limiting**: Prevent API abuse
- **Input Validation**: Comprehensive request validation
- **CORS Protection**: Configured cross-origin policies
- **SQL Injection Prevention**: Parameterized queries
- **File Upload Security**: Type and size validation

## 🚀 Deployment

### Environment Setup

1. Set `NODE_ENV=production`
2. Configure production database
3. Set up SSL certificates
4. Configure reverse proxy (nginx)
5. Set up process manager (PM2)

### Production Considerations

- Use connection pooling for database
- Enable compression middleware
- Set up proper logging
- Configure monitoring
- Set up backup strategies
- Use environment-specific configurations

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check existing documentation
- Review API endpoints and examples

## 🔄 Version History

- **v1.0.0**: Initial release with core features
- **v1.1.0**: Added real-time messaging
- **v1.2.0**: Payment integration
- **v1.3.0**: Admin dashboard and analytics