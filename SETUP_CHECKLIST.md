# Setup Checklist

## Before Starting

- [ ] Node.js v16+ installed
- [ ] PostgreSQL v13+ installed
- [ ] Git installed (optional)
- [ ] Code editor (VS Code recommended)

## Backend Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
```bash
# Copy example env file
cp env.example .env

# Edit .env file with your settings
# Required:
# - DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
# - JWT_SECRET (generate a random string)
# Optional:
# - SMTP settings (for email functionality)
```

### 3. Create Database
```bash
# Using psql
createdb forestry_pots

# Or using SQL
psql -U postgres
CREATE DATABASE forestry_pots;
\q
```

### 4. Initialize Database Schema
```bash
npm run init-db
```

Expected output:
```
Database connected successfully
Database tables created successfully!
Database initialization complete
```

### 5. Seed Demo Data
```bash
node src/config/seedDatabase.js
```

Expected output:
```
Seeding admin user...
Seeding demo user...
Seeding demo products...
Database seeded successfully!
```

### 6. Start Backend Server
```bash
npm run dev
```

Expected output:
```
Server running on port 5000
Environment: development
Database connected successfully
```

## Frontend Setup

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

Expected output:
```
VITE v5.0.8  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

## Verification

### Backend Health Check
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{"status":"ok","timestamp":"2024-XX-XXTXX:XX:XX.XXXZ"}
```

### Database Verification
```bash
psql -U postgres forestry_pots -c "SELECT COUNT(*) FROM users;"
```

Expected output:
```
 count 
-------
     2
```

### Frontend Access
Open browser: http://localhost:5173

You should see:
- Colorful gradient landing page
- Login form
- Request Access button

### Test Login
**Admin Account:**
- Email: `admin@forestrypots.com`
- Password: `admin123`

**Demo User:**
- Email: `demo@example.com`
- Password: `demo123`

## Common Issues & Solutions

### Issue: Database Connection Failed
**Solution:**
1. Check PostgreSQL is running: `pg_isready`
2. Verify credentials in `.env`
3. Ensure database exists: `psql -l`

### Issue: Port Already in Use
**Backend (5000):**
```bash
# Find process
lsof -i :5000
# Kill process
kill -9 <PID>
```

**Frontend (5173):**
```bash
# Find process
lsof -i :5173
# Kill process
kill -9 <PID>
```

### Issue: Module Not Found
**Solution:**
```bash
# Backend
cd backend && rm -rf node_modules package-lock.json && npm install

# Frontend
cd frontend && rm -rf node_modules package-lock.json && npm install
```

### Issue: Email Not Sending
**Solution:**
1. SMTP is optional for development
2. Use Mailtrap.io for testing
3. Configure SMTP_* variables in `.env`
4. Check logs for detailed errors

### Issue: File Upload Fails
**Solution:**
1. Ensure upload directories exist:
```bash
mkdir -p backend/uploads/{images,pdfs,dwgs,watermarked}
```
2. Check file size limit (default 50MB)
3. Verify file permissions

## Testing Features

### 1. Landing Page
- [ ] Page loads with gradient background
- [ ] Login form visible
- [ ] Request Access button works
- [ ] Request Access form submits successfully

### 2. User Login
- [ ] Login with demo credentials
- [ ] Redirects to catalog
- [ ] User info displayed in header

### 3. Product Catalog
- [ ] Products displayed in grid
- [ ] Search works
- [ ] Pagination works
- [ ] Checkboxes for selection
- [ ] Download buttons visible

### 4. Profile Management
- [ ] View profile page
- [ ] Update name and company
- [ ] Change password
- [ ] Success messages display

### 5. RFP Workflow
- [ ] Select multiple products
- [ ] Request RFP button appears
- [ ] Submit RFP with message
- [ ] View submitted RFPs in My RFPs

### 6. Admin Dashboard
- [ ] Login as admin
- [ ] Admin menu item visible
- [ ] Navigate to Users Management
- [ ] Create new user
- [ ] View user list
- [ ] Edit user
- [ ] Delete user

### 7. File Downloads
- [ ] Download PDF (should be watermarked)
- [ ] Download Image (should be watermarked)
- [ ] Download DWG (should be renamed)
- [ ] Check watermarked files in `backend/uploads/watermarked/`

## Production Deployment

### Backend Checklist
- [ ] Update `NODE_ENV=production`
- [ ] Generate strong `JWT_SECRET`
- [ ] Configure production database
- [ ] Set up production SMTP
- [ ] Update `CLIENT_URL` to production domain
- [ ] Enable HTTPS
- [ ] Configure CORS for production domain
- [ ] Set up reverse proxy (nginx)
- [ ] Enable database SSL
- [ ] Set up database backups
- [ ] Configure log rotation
- [ ] Set up monitoring

### Frontend Checklist
- [ ] Build production bundle: `npm run build`
- [ ] Set production API URL
- [ ] Configure CDN for assets
- [ ] Enable gzip compression
- [ ] Set cache headers
- [ ] Configure analytics
- [ ] Test on multiple devices
- [ ] Verify SSL certificate

### Security Checklist
- [ ] Change default admin password
- [ ] Remove demo user account
- [ ] Review CORS settings
- [ ] Enable rate limiting
- [ ] Set up firewall rules
- [ ] Regular security updates
- [ ] Implement backup strategy
- [ ] Set up error monitoring
- [ ] Review file upload limits
- [ ] Audit access logs regularly

## Support

If you encounter issues:
1. Check backend logs in terminal
2. Check browser console for frontend errors
3. Verify database connection
4. Review `.env` configuration
5. Ensure all services are running

## Quick Commands Reference

```bash
# Backend
cd backend
npm run dev              # Start development server
npm run init-db          # Initialize database
npm start                # Production start
node src/config/seedDatabase.js  # Seed data

# Frontend
cd frontend
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build

# Database
createdb forestry_pots   # Create database
dropdb forestry_pots     # Drop database
psql forestry_pots       # Connect to database

# Useful SQL
# View all users
SELECT id, name, email, role FROM users;

# View all products
SELECT id, name, dimensions FROM products;

# View all RFPs
SELECT r.id, u.name, r.status, r.created_at 
FROM rfps r 
JOIN users u ON r.user_id = u.id;

# View access logs
SELECT * FROM file_access_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

## Next Steps After Setup

1. **Customize Branding**
   - Update logo and colors in `frontend/tailwind.config.js`
   - Modify landing page content
   - Update email templates

2. **Add Real Products**
   - Login as admin
   - Navigate to Products
   - Upload product images, PDFs, and DWG files

3. **Configure Email**
   - Set up SMTP provider (Resend, SendGrid, etc.)
   - Update email templates
   - Test user creation flow

4. **Add Production Data**
   - Remove demo users
   - Add real admin accounts
   - Import product catalog

5. **Deploy to Production**
   - Follow deployment checklist
   - Set up monitoring
   - Configure backups

## Success Criteria

✅ Backend server running on port 5000
✅ Frontend accessible at http://localhost:5173
✅ Database initialized with demo data
✅ Can login with demo credentials
✅ Can browse product catalog
✅ Can download files (watermarked)
✅ Can submit RFP requests
✅ Admin can manage users
✅ All features working as expected

Congratulations! Your Forestry Pots platform is ready to use! 🎉
