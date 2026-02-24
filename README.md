# MyRSS Reader

A full-stack RSS reader application built with Node.js, Express, React, and PostgreSQL.

## Features

- 🔐 **Google OAuth Authentication** - Secure login with your Google account
- 📰 **RSS Feed Management** - Add/remove feeds from your personal list
- 📖 **Read/Unread Tracking** - Mark items as read individually or in batch
- 💾 **Save for Later** - Bookmark interesting articles for later reading
- 🔄 **Automatic Feed Updates** - Background job fetches new items every 30 minutes
- 📱 **Responsive UI** - Clean, modern interface

## Project Structure

```
myrss/
├── server/              # Express backend
│   ├── src/
│   │   ├── routes/      # API routes (auth, feeds, items)
│   │   ├── middleware/  # Authentication & Passport config
│   │   ├── jobs/        # Scheduled feed fetcher
│   │   ├── db/          # Database initialization
│   │   └── index.js     # Main entry point
│   └── package.json
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API client
│   │   └── App.js       # Main app component
│   └── package.json
└── README.md
```

## Prerequisites

- Node.js (v16+)
- PostgreSQL (v12+)
- Google OAuth credentials (from Google Cloud Console)

## Setup Instructions

### 1. Database Setup

```bash
# Create PostgreSQL database
createdb myrss
```

### 2. Backend Setup

```bash
cd server
cp .env.example .env
# Edit .env with your credentials
npm install
npm run dev
```

The server will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd client
npm install
npm start
```

The app will open on `http://localhost:3000`

## Environment Variables

### Backend (.env)

```
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/myrss
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback
SESSION_SECRET=your_session_secret_key
FRONTEND_URL=http://localhost:3000
```

### Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials (Web application)
5. Add `http://localhost:5000/auth/google/callback` as authorized redirect URI
6. Copy Client ID and Secret to `.env`

## API Endpoints

### Authentication
- `GET /auth/google` - Start Google login
- `GET /auth/google/callback` - Google OAuth callback
- `GET /auth/me` - Get current user
- `POST /auth/logout` - Logout

### Feeds
- `GET /api/feeds` - List user's feeds
- `POST /api/feeds` - Add new feed
- `DELETE /api/feeds/:id` - Remove feed

### Items
- `GET /api/items` - Get items (with filters: feed_id, skip, limit, only_unread, only_saved)
- `POST /api/items/mark-read` - Mark items as read
- `POST /api/items/toggle-saved` - Toggle saved status

## How It Works

1. **User Login**: Users authenticate with Google OAuth
2. **Feed Management**: Users can add RSS feed URLs (e.g., `https://news.ycombinator.com/rss`)
3. **Automatic Updates**: A cron job runs every 30 minutes to fetch new items from all feeds
4. **Display Items**: The UI shows 10 items at a time, paginated
5. **Batch Read**: Users can select multiple items and mark them as read
6. **Save Items**: Click the star icon to save items for later reading
7. **Track Status**: Read/saved status is persisted per user

## Common RSS Feed URLs

- Hacker News: `https://news.ycombinator.com/rss`
- Reddit programming: `https://www.reddit.com/r/programming/.rss`
- BBC News: `http://feeds.bbc.co.uk/news/rss.xml`
- TechCrunch: `http://feeds.techcrunch.com/TechCrunch/`

## Development

### Backend logs
```bash
npm run dev    # Runs with nodemon for auto-reload
```

### Frontend
```bash
npm start      # Runs with create-react-app dev server
```

## Troubleshooting

**Can't connect to database?**
- Ensure PostgreSQL is running: `pg_isrunning`
- Check DATABASE_URL is correct
- Verify database exists: `psql -l | grep myrss`

**Google login not working?**
- Verify CLIENT_ID and CLIENT_SECRET are correct
- Check callback URL matches Google Console settings
- Ensure CORS settings are correct

**Feeds not updating?**
- Check server logs for feed fetcher job
- Verify feed URLs are valid RSS feeds
- Check feed_fetcher.js is running (`*/30 * * * *` cron)

## License

MIT


create db

$ docker run --name myrss -p5432:5432 -e POSTGRES_USER=myrss -e POSTGRES_PASSWORD=mysecretpassword -e POSTGRES_DB=myrss -d postgres


docker exec -it -u postgres myrss bash

 psql -U myrss -d myrss

\dt



 you can call POST /api/feeds/manual-fetch via curl

 curl -X POST http://localhost:5000/api/feeds/manual-fetch \
  -H "Content-Type: application/json" \
  --cookie "connect.sid=YOUR_SESSION_ID"

 curl -X POST http://localhost:5000/api/feeds/manual-fetch \
  -H "Content-Type: application/json" \
  --cookie "connect.sid=s%3AhGEFphvAOxsbCF_sYXT-bOZd9vIML1UY.fQV8J2Sfcsx%2BOWINaa7TooNDWP4Fvuw4VN5AinksEtk"
  

  You're getting "Unauthorized" because that cookie is not a valid session cookie. A few quick facts and your immediate options:

Why: connect.sid must be the session ID issued by the server after a successful login — not the SESSION_SECRET. The secret in .env is used to sign/encrypt sessions, it is never the cookie value you send to authenticate.
Options to trigger a manual fetch now:

Use a real authenticated cookie (via browser)
Sign in at http://localhost:3000 (use the Google OAuth flow).
In browser DevTools → Application → Cookies → copy the value of connect.sid.
Then call:
curl -X POST http://localhost:5000/api/feeds/manual-fetch
-H "Content-Type: application/json"
--cookie "connect.sid=PASTE_SESSION_ID_HERE"
Trigger fetch directly from the server (no auth required)
Run this from the server folder; it loads .env and runs the fetch function immediately:
cd server
node -r dotenv/config -e "require('./src/jobs/feedFetcher').fetchAllFeeds().then(()=>console.log('done')).catch(e=>{console.error(e);process.exit(1)})"