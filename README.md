# Forestry Pots - Secure Catalog Platform

A full-stack production-ready web application for secure pot product catalog management with authentication, watermarking, access tracking, and RFP workflow.

## Features

### User Features
- **Colorful Landing Page** - Modern gradient design with login and request access forms
- **Secure Authentication** - JWT-based authentication with password reset
- **Product Catalog** - Browse products with search, filter, and pagination
- **Secure Downloads** - Watermarked PDFs and images, tracked DWG files
- **RFP Workflow** - Multi-select products and submit RFP requests
- **Profile Management** - Update profile and change password

### Admin Features
- **User Management** - Create, edit, delete users with auto-generated credentials
- **Product Management** - CRUD operations with file uploads
- **RFP Management** - View and update RFP status
- **Access Logs** - Track all file downloads with detailed information
- **Access Requests** - View pending access requests

### Security Features
- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcrypt password encryption
- **Rate Limiting** - Prevent brute force attacks
- **File Watermarking** - PDF and image watermarking with user/company info
- **Access Tracking** - Comprehensive logging of all file access
- **Secure File Delivery** - No public URLs, auth-required streaming

## Tech Stack

**Frontend:**
- React 18
- Tailwind CSS
- React Router
- Axios

**Backend:**
- Node.js
- Express
- PostgreSQL
- JWT + bcrypt
- pdf-lib (PDF watermarking)
- sharp (Image watermarking)
- Nodemailer (Email)
- Multer (File uploads)

## Installation

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v13 or higher)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from `env.example`):
```bash
cp env.example .env
```

4. Configure environment variables in `.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=forestry_pots
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your_secure_secret_key
JWT_EXPIRES_IN=7d

PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASSWORD=your_smtp_password
EMAIL_FROM=noreply@forestrypots.com
```

5. Create database:
```bash
createdb forestry_pots
```

6. Initialize database schema:
```bash
npm run init-db
```

7. Seed demo data:
```bash
node src/config/seedDatabase.js
```

8. Start server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## Default Credentials

**Admin Account:**
- Email: admin@forestrypots.com
- Password: admin123

**Demo User:**
- Email: demo@example.com
- Password: demo123

**Important:** Change these passwords in production!

## Project Structure

```
forestry-pots/
├── backend/
│   ├── src/
│   │   ├── config/          # Database config and initialization
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Auth and rate limiting
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Email service
│   │   ├── utils/           # Auth and watermark utilities
│   │   └── server.js        # Main server file
│   ├── uploads/             # File storage
│   │   ├── images/
│   │   ├── pdfs/
│   │   ├── dwgs/
│   │   └── watermarked/
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/      # Reusable components
    │   ├── context/         # React context (Auth)
    │   ├── pages/           # Page components
    │   │   ├── admin/       # Admin pages
    │   │   ├── LandingPage.jsx
    │   │   ├── CatalogPage.jsx
    │   │   ├── ProfilePage.jsx
    │   │   └── MyRFPsPage.jsx
    │   ├── services/        # API services
    │   ├── App.jsx
    │   └── main.jsx
    └── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/request-access` - Request account access
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/profile` - Get user profile (auth required)
- `PUT /api/auth/profile` - Update profile (auth required)
- `POST /api/auth/change-password` - Change password (auth required)

### Products
- `GET /api/products` - Get all products (auth required)
- `GET /api/products/:id` - Get product by ID (auth required)

### RFPs
- `POST /api/rfps` - Create RFP (auth required)
- `GET /api/rfps/my-rfps` - Get user's RFPs (auth required)

### Files
- `GET /api/files/:productId/:type/download` - Download file (auth required)

### Admin
- `GET /api/admin/users` - Get all users (admin only)
- `POST /api/admin/users` - Create user (admin only)
- `PUT /api/admin/users/:id` - Update user (admin only)
- `DELETE /api/admin/users/:id` - Delete user (admin only)
- `POST /api/admin/products` - Create product (admin only)
- `PUT /api/admin/products/:id` - Update product (admin only)
- `DELETE /api/admin/products/:id` - Delete product (admin only)
- `GET /api/admin/rfps` - Get all RFPs (admin only)
- `PUT /api/admin/rfps/:id/status` - Update RFP status (admin only)
- `GET /api/admin/access-logs` - Get access logs (admin only)
- `GET /api/admin/access-requests` - Get access requests (admin only)

## Database Schema

### Users Table
- id, name, company, email, password_hash, role, profile_photo, created_at, updated_at

### Products Table
- id, name, dimensions, image_url, pdf_url, dwg_url, created_at, updated_at

### RFPs Table
- id, user_id, status, message, created_at, updated_at

### RFP Items Table
- id, rfp_id, product_id, created_at

### Watermarks Table
- id, user_id, product_id, file_type, watermark_text, file_path, created_at

### File Access Logs Table
- id, user_id, product_id, file_type, action, ip_address, user_agent, watermark_id, result, created_at

### Access Requests Table
- id, name, company_name, email, phone, notes, status, created_at

## Deployment

### Production Build

**Backend:**
```bash
cd backend
npm install --production
NODE_ENV=production npm start
```

**Frontend:**
```bash
cd frontend
npm run build
```

Serve the `dist` folder with a static file server or integrate with backend.

### Environment Variables for Production

Make sure to update:
- `JWT_SECRET` - Use a strong random key
- `DB_PASSWORD` - Use a secure database password
- `SMTP_*` - Configure production email service
- `CLIENT_URL` - Set to production frontend URL
- `NODE_ENV=production`

### Security Recommendations

1. Use HTTPS in production
2. Configure CORS properly for production domain
3. Set up database backups
4. Use environment-specific secrets
5. Enable PostgreSQL SSL connections
6. Configure proper rate limiting
7. Regular security updates

## License

MIT License

## Support

For issues and questions, please create an issue in the repository.
