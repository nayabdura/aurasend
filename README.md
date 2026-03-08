# 🚀 ColdMail Platform - Multi-User SaaS System

A complete cold email automation platform with multi-user support, role-based access control, and multiple Gmail authentication methods.

## 🌟 Features

### Multi-User Authentication System
- **JWT-based sessions** with HTTP-only cookies
- **Role-based access control** (Master Admin vs Regular Users)
- **Secure password hashing** with bcrypt
- **Data isolation** - Each user sees only their own data
- **Master admin panel** - Global view of all users and data

### Multiple Gmail Authentication Methods
1. **OAuth 2.0** - Using Google Client ID/Secret (Recommended)
2. **App Password** - 16-character Google App Password
3. **SMTP** - Direct SMTP authentication with custom host/port

### Campaign Management
- Unlimited campaigns per user
- Email tracking (opens, replies)
- Automated follow-ups
- Template system with personalization
- Time-zone aware sending

### Email Verification
- Format validation
- MX record lookup
- SMTP handshake verification
- Disposable domain detection
- Role account detection
- Catch-all detection
- Quality scoring (0-100)

### Analytics Dashboard
- Real-time campaign performance
- Open rate tracking
- Reply rate analytics
- Per-user statistics
- Global admin analytics

## 🗂️ Database Schema

### Users Table
```sql
- id (PRIMARY KEY)
- email (UNIQUE)
- password_hash
- name
- role ('master' | 'user')
- created_at
- last_login
```

### Gmail Accounts Table (Per User)
```sql
- id (PRIMARY KEY)
- user_id (FOREIGN KEY)
- email
- auth_method ('oauth' | 'app_password' | 'smtp')
- client_id, client_secret (for OAuth)
- app_password (for App Password/SMTP)
- smtp_host, smtp_port (for SMTP)
- access_token, refresh_token (OAuth tokens)
- daily_limit, sent_today
- status, is_connected
- signature
```

### Other Tables (All User-Scoped)
- **leads** - Email recipients with verification data
- **campaigns** - Email campaigns
- **templates** - Email templates
- **email_logs** - Sending history
- **blacklist** - Unsubscribes and bounces
- **training_blocks** - AI personalization data

## 🔐 Access Control

### Regular User
- ✅ Sees only their own Gmail accounts
- ✅ Sees only their own campaigns
- ✅ Sees only their own leads
- ❌ Cannot see other users' data
- ❌ Cannot access admin panel

### Master Admin
- ✅ Sees ALL users
- ✅ Sees ALL Gmail accounts (across all users)
- ✅ Sees ALL campaigns
- ✅ Access to global analytics
- ✅ Special admin panel at `/admin`
- ✅ Can view system-wide data sheet

## 📁 File Structure

```
cold-email-platform/
├── app/
│   ├── page.tsx                    # Public landing page
│   ├── login/page.tsx              # Login & Signup
│   ├── dashboard/page.tsx          # User dashboard
│   ├── gmail/page.tsx              # Gmail accounts management
│   ├── campaigns/page.tsx          # Campaigns page
│   ├── admin/page.tsx              # Master admin panel (admin-only)
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts      # Login endpoint
│       │   ├── signup/route.ts     # Signup endpoint
│       │   ├── logout/route.ts     # Logout endpoint
│       │   └── me/route.ts         # Get current user
│       └── gmail/
│           ├── add/route.ts            # Add OAuth account
│           └── add-password/route.ts   # Add App Password/SMTP account
├── components/
│   ├── DashboardLayout.tsx         # Main layout with sidebar
│   ├── AddAccountForm.tsx          # Multi-method Gmail form
│   └── GmailAccountCard.tsx        # Account display card
├── lib/
│   ├── auth.ts                     # Authentication utilities
│   ├── db.ts                       # Database schema & init
│   ├── gmail.ts                    # Gmail API functions
│   └── verification.ts             # Email verification
├── middleware.ts                   # Route protection
└── init-db.js                      # Database initialization script
```

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Initialize Database
```bash
node init-db.js
```

This creates:
- All database tables
- Master admin account
  - Email: `admin@coldmail.com`
  - Password: `admin123`
  - **⚠️ CHANGE THIS IN PRODUCTION!**

### 3. Run Development Server
```bash
npm run dev
```

Visit: `http://localhost:3000`

### 4. First Login

**Master Admin:**
- Email: `admin@coldmail.com`
- Password: `admin123`

**Create New User:**
- Click "Sign Up" on login page
- New users start with empty dashboards

## 🔄 User Flow

### Public Landing Page (Not Logged In)
- Hero section with features
- Login/Signup buttons
- No access to dashboard
- Route: `/`

### User Dashboard (Logged In)
- Personalized stats
- Gmail accounts management
- Campaign management
- Analytics
- Route: `/dashboard`, `/gmail`, `/campaigns`, etc.

### Master Admin Panel
- Global users list
- All Gmail accounts (across all users)
- All campaigns (across all users)
- System analytics
- Route: `/admin` (master-only)

### Logout
- All dashboard data disappears
- Redirects to public landing page
- Session terminated

## 🔒 Security Features

### Authentication
- JWT tokens with 7-day expiration
- HTTP-only cookies (XSS protection)
- Secure password hashing (bcrypt, 10 rounds)
- Session validation on every protected route

### Authorization
- Middleware-level route protection
- Server-side role validation
- User-scoped database queries
- Admin-only endpoint guards

### Data Isolation
- Foreign key constraints with CASCADE delete
- User-scoped queries: `WHERE user_id = ?`
- Master admin queries: No user_id filter
- UNIQUE constraints: `(user_id, email)`

## 📊 Gmail Authentication Setup

### Method 1: OAuth (Recommended)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project
3. Enable Gmail API
4. Create OAuth 2.0 credentials
5. Add redirect URI: `http://localhost:3000/api/gmail/oauth/callback`
6. Copy Client ID and Client Secret
7. Add account via dashboard

### Method 2: App Password
1. Go to [Google Account Settings](https://myaccount.google.com/apppasswords)
2. Generate 16-character app password
3. Enter in dashboard with email
4. Automatically connected - no OAuth flow needed

### Method 3: SMTP
1. Enable "Less secure app access" (not recommended for new accounts)
2. Use regular Gmail password
3. Configure SMTP host and port
4. Best for legacy accounts or custom SMTP servers

## 🎨 UI/UX Design

### Public Landing Page
- Modern SaaS hero section
- Feature highlights with icons
- Gradient CTAs
- Glassmorphism effects
- Responsive design

### Dashboard Layout
- Collapsible sidebar navigation
- User profile with avatar
- Dark gradient sidebar
- Active route highlighting
- Quick action cards

### Admin Panel
- Purple/pink gradient header
- Table-based data views
- Role badges
- Status indicators
- Comprehensive statistics

## 📝 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - New user registration
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Gmail Accounts
- `POST /api/gmail/add` - Add OAuth account
- `POST /api/gmail/add-password` - Add App Password/SMTP account
- `POST /api/gmail/auth/redirect` - OAuth redirect
- `GET /api/gmail/oauth/callback` - OAuth callback

### Leads & Verification
- `POST /api/leads/verify-single` - Verify single email
- `POST /api/leads/verify-bulk` - Bulk verification
- `POST /api/leads/upload` - Upload leads

### Campaigns
- `GET /api/campaigns` - Get user's campaigns
- `POST /api/campaigns` - Create campaign
- `PUT /api/campaigns/[id]` - Update campaign
- `DELETE /api/campaigns/[id]` - Delete campaign

## 🔧 Environment Variables

Create `.env.local`:
```env
JWT_SECRET=your-super-secret-key-minimum-32-characters-long
DATABASE_URL=./cold-email.db
NODE_ENV=development
```

## 📈 Roadmap

- [ ] Email template builder
- [ ] Advanced analytics charts
- [ ] Team collaboration features
- [ ] Webhook integrations
- [ ] API rate limiting
- [ ] Email warmup automation
- [ ] A/B testing campaigns
- [ ] Export reports (CSV, PDF)

## 🐛 Troubleshooting

### "no such table: users"
Run: `node init-db.js`

### Login not working
1. Check database initialized
2. Verify bcrypt installed: `npm install bcrypt`
3. Check console for errors

### Gmail not connecting
1. Verify OAuth credentials
2. Check redirect URI matches exactly
3. Enable Gmail API in Google Console

### Can't access admin panel
- Only `role = 'master'` users can access
- Regular users are automatically redirected

## 📄 License

MIT License - Built with ❤️ for cold email automation

---

**Master Admin Credentials (Development Only):**
- Email: admin@coldmail.com  
- Password: admin123  
- ⚠️ **CHANGE IN PRODUCTION!**
