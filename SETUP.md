# MyRSS Reader - Setup Guide

## Quick Start

### Prerequisites 
- Node.js 16+
- PostgreSQL 12+
- Google Cloud Console account

### 1. Setup PostgreSQL Database
```bash
createdb myrss
```

### 2. Backend Setup
```bash
cd server
cp .env.example .env
# Edit .env with your Google credentials
npm install
npm run dev
# Server runs on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd client
npm install
npm start
# App opens on http://localhost:3000
```

### 4. Get Google OAuth Credentials
1. Go to https://console.cloud.google.com/
2. Create a new project or select existing one
3. Enable "Google+ API"
4. Go to Credentials → Create OAuth 2.0 Client ID
5. Application type: "Web application"
6. Add Authorized redirect URIs:
   - `http://localhost:5000/auth/google/callback`
7. Copy Client ID and Secret to `.env`

## Next Steps

1. **Add your first feed**: Use URL like `https://news.ycombinator.com/rss`
2. **Let it fetch**: Wait a minute for the background job to fetch items
3. **Test features**: Mark items as read, save items, try search

## Backend API

- Auth: `GET /auth/google`
- Feeds: `GET/POST/DELETE /api/feeds`
- Items: `GET /api/items`, `POST /api/items/mark-read`, `POST /api/items/toggle-saved`

## File Structure

- `server/src/` - Express routes, middleware, jobs
- `client/src/` - React components and pages
- Database schema auto-creates on startup

## Troubleshooting

See [README.md](./README.md) for detailed troubleshooting guide.
