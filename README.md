# Personal Book Manager

A full-stack app to track your personal reading — built with the MERN stack and Next.js as part of the Thumbstack MERN Stack Developer assignment.

You can sign up, log in, and keep a private collection of books, marking each one as want-to-read, reading, or completed.

## Features

- JWT-based auth (signup, login, logout) with access + refresh tokens
- Add, edit, and delete books — title, author, tags, and reading status
- Filter by status or tag, search by title/author
- Dashboard with basic stats (total books, currently reading, completed)
- Dark mode toggle
- Toast notifications, custom confirm modals, skeleton loading states
- Protected routes — you get redirected to login if you're not authenticated

## Tech Stack

- Frontend: Next.js (App Router), React, Tailwind CSS
- Backend: Next.js API routes
- Database: MongoDB + Mongoose
- Auth: JWT (access + refresh tokens), httpOnly cookies, bcrypt for password hashing

## Auth flow

I went with a dual-token setup instead of one long-lived token, mainly for security.

- Access token — short-lived (15 min), used for actual requests
- Refresh token — longer-lived (7 days), only used to get a new access token when the old one expires

Both are kept in httpOnly cookies so client-side JS can't read them (helps against XSS). When the access token expires, the frontend automatically calls the refresh endpoint in the background, so the user doesn't get logged out mid-session.

## Project structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/          -> signup, login, logout, refresh
│   │   └── books/         -> CRUD routes for books
│   ├── dashboard/page.js
│   ├── login/page.js
│   ├── signup/page.js
│   └── page.js            -> redirects to /login or /dashboard
├── lib/
│   ├── db.js               -> MongoDB connection
│   ├── auth.js              -> JWT helper functions
│   └── apiClient.js         -> fetch wrapper that auto-refreshes tokens
├── models/
│   ├── User.js
│   └── Book.js
└── proxy.js                 -> route protection (Next.js 16)
```

## Database schema

**User** — name, email (unique), password (bcrypt hash)

**Book** — title, author, tags (array), status (want-to-read / reading / completed), userId (references the owning user)

Every book query is scoped by userId, so users only ever see their own books.

## Running it locally

Prerequisites: Node 18+, a MongoDB connection (local or Atlas free tier)

```bash
git clone https://github.com/akshita141105/personal-book-manager.git
cd personal-book-manager
npm install
```

Copy `.env.example` to `.env.local` and fill in your own values:

```
MONGODB_URI=your_mongodb_connection_string
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
```

Then run:

```bash
npm run dev
```

Go to http://localhost:3000 — it should redirect you to the login page.

## Deployment

Deployed on Vercel with MongoDB Atlas.

- Live URL: [add after deploying]
- GitHub Repo: https://github.com/akshita141105/personal-book-manager

Same three env variables need to be added in the Vercel project settings.

## A few notes on decisions I made

Status values are stored as plain strings in the DB (want-to-read, reading, completed) — the emoji/labels only get added at the UI layer, so data and display stay separate.

Route protection is two layers: a quick cookie-presence check in `proxy.js` at the edge, and full JWT verification inside each API route. Edge runtime doesn't reliably support full JWT verification, so the actual security check happens at the API level.

Tried to keep the UI simple — just the stats that matter, consistent spacing, nothing too decorative.