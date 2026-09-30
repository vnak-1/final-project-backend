# UniSwap Backend

REST API for UniSwap, built with **Node.js + Express 5 + PostgreSQL**, as described in the
project proposal (Section 4, Methodology).

## Setup

Requires Node.js 20.6+ and PostgreSQL 13+ (local, or a free Supabase database).

```bash
cd backend
npm install
cp .env.example .env      # then edit DATABASE_URL and JWT_SECRET
npm run db:setup          # creates the tables (drops existing data!)
npm run db:seed           # optional demo data; every demo user's password is "password123"
npm run dev               # http://localhost:4000, restarts on file changes
npm test                  # unit tests (Node's built-in test runner)
```

Check it works: `curl http://localhost:4000/api/health` → `{"status":"ok"}`

## Folder layout

```
backend/
├── scripts/            db-setup.js (create tables), db-seed.js (demo data)
├── src/
│   ├── server.js       starts the HTTP server
│   ├── app.js          Express app: middleware + routes
│   ├── config.js       reads environment variables
│   ├── db/             schema.sql, connection pool, shared listing query
│   ├── middleware/     requireAuth (JWT), CORS, error handler
│   ├── routes/         auth, listings, users, messages
│   └── utils/          validation, password hashing, tokens, JSON serializers
└── test/               unit tests for validation
```

## Database

Tables follow the ER diagram in the proposal (Figure 2): `users`, `listings`, `messages`,
`reviews`. See [`src/db/schema.sql`](src/db/schema.sql). Allowed values are enforced twice, in
the API (`utils/validation.js`) and in the database (`CHECK` constraints):

- **category:** textbooks, electronics, furniture, clothing, bikes, other
- **condition:** new, like_new, good, fair
- **listing type:** sale, buy_request, trade, giveaway
- **status:** active, reserved, sold, traded

## API

Send JSON. Routes marked 🔒 need the header `Authorization: Bearer <token>` (the token comes from register or login).

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | API + database health check |
| POST | `/api/auth/register` | `{ name, email, password }`. Only `.edu.kh` emails. Returns `{ user, token }` |
| POST | `/api/auth/login` | `{ email, password }` → `{ user, token }` |
| POST | `/api/auth/verify-email` | `{ token }` → marks the account verified (badge) |
| GET 🔒 | `/api/auth/me` | The logged-in user |
| GET | `/api/listings` | Browse. Query: `query`, `category`, `condition`, `type`, `minPrice`, `maxPrice`, `status` (default `active`) |
| GET | `/api/listings/:id` | One listing, with seller info |
| POST 🔒 | `/api/listings` | `{ title, category, condition, description?, listingType?, price?, cashTopup?, imageUrls? }` |
| PATCH 🔒 | `/api/listings/:id` | Owner only. Any subset of fields, e.g. `{ "status": "sold" }` |
| DELETE 🔒 | `/api/listings/:id` | Owner only |
| GET | `/api/users/:id` | Public profile (email hidden) |
| GET | `/api/users/:id/listings` | All listings by a user |
| PATCH 🔒 | `/api/users/me` | `{ name?, major?, graduationYear?, bio?, avatarUrl? }` |
| GET 🔒 | `/api/messages/conversations` | My chat threads with unread counts |
| GET 🔒 | `/api/messages?listingId=&withUserId=` | One thread, oldest first |
| POST 🔒 | `/api/messages` | `{ listingId, receiverId, body }` |
| PATCH 🔒 | `/api/messages/read` | `{ listingId, withUserId }` → mark a thread read |

JSON field names match the frontend types in `frontend/src/types/index.ts` (camelCase).
Errors always look like `{ "error": "message", "details": { "field": "message" } }`.

## Security

- **SQL injection:** every query uses `$1, $2, ...` parameters, never string concatenation.
- **Passwords:** hashed with scrypt (Node's built-in `crypto`) plus a random salt; never returned by the API.
- **Auth:** signed JWTs expire after 7 days; listings can only be changed or deleted by their owner.
- **Privacy:** emails appear only on your own account, never on public profiles.
- **Secrets:** live in `.env` (git-ignored). Nothing secret is committed.

## Progress (week 4)

Done:
- Database schema from the ER diagram, with setup and seed scripts
- Campus-email registration, login, JWT sessions, email-verification flow
- Listings: create/read/update/delete, search, filters, sale/buy-request/trade/giveaway types, cash top-up, sold/traded status
- Profiles and messaging (threads per listing, unread counts)
- Unit tests for validation; all endpoints checked against a real PostgreSQL database

Next:
- Cloudinary image uploads (currently `imageUrls` takes URLs)
- Send the verification email (the link is printed to the server log for now)
- Connect the frontend: replace `frontend/src/lib/api` mock functions with calls to this API
- Deploy (Render + Supabase); then stretch goals: reviews, KHQR, meetup spots, Notify Me, Telegram bot
