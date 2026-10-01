# UniSwap: project context for Claude Code

Campus-only marketplace for verified `.edu.kh` students: buy, sell, trade (with a cash top-up for
uneven trades), give away, or post a "wanted" request. FYP 401 final year project, Fall 2026
(Prof. Chandan Mukherjee). Final deadline: **10 Nov 2026**.

- **Long Vathanak** (GitHub `vnak-1`): backend, database, integration, testing, docs
- **Dy Nobsokun** (GitHub `dy-nobsokun1`): UI/UX and core frontend

## Team rules (must follow)

@Agent.md

In short: ask before adding any package; keep diffs small and scoped; never commit secrets (the repo
is public); state a plan before multi-file changes; explain every change so the student can defend it.

## Repos and branches

- `origin` / upstream: `dy-nobsokun1/final-project`. Its `main` is still the old frontend-only layout.
- Fork: `vnak-1/final-project-backend`. Work happens on branch **`implement_backend`**, which still
  needs a PR into upstream `main`.
- Write descriptive commit messages (not "update"). Never commit `.env`, `node_modules/` or `.DS_Store`.

## Layout

- `frontend/`: Next.js 16 (App Router), React 19, TypeScript, Tailwind 4, shadcn/ui.
  **This Next.js has breaking changes**: read `frontend/AGENTS.md` and `node_modules/next/dist/docs/`
  before writing Next code.
  - Only the Next.js server calls the API (`src/lib/api/http.ts`, `actions.ts`, `index.ts`); `API_URL`
    defaults to `http://localhost:4000`. The login JWT lives in the httpOnly cookie `uniswap_token`.
  - Shared types: `src/types/index.ts`. Labels and options: `src/lib/constants.ts`.
- `backend/`: Node.js 20.6+, Express 5, PostgreSQL, ES modules, plain JavaScript.
  - `src/app.js` mounts routes in `src/routes/`: auth, listings, users, messages, uploads.
  - `src/db/schema.sql`: tables `users`, `listings`, `messages`, `reviews` (from the proposal's ER
    diagram). `src/db/listings.js`: `buildBrowseQuery()` for browse/search.
  - `src/utils/`: validation, scrypt password hashing, JWT, email (nodemailer), serializers
    (database snake_case → API camelCase, matching the frontend types).
  - The full API table is in `backend/README.md`. Keep it updated when routes change.

## Commands

```bash
# backend/  (needs PostgreSQL; copy .env.example to .env first)
npm run dev          # API on http://localhost:4000
npm test             # unit tests (node --test)
npm run db:setup     # recreate tables: WIPES ALL DATA
npm run db:seed      # demo data
npm run email:test -- someone@aupp.edu.kh

# frontend/
npm run dev          # http://localhost:3000
npm run lint
npx tsc --noEmit
```

Demo users (password `password123`): `sokunth@aupp.edu.kh` and `chanrithorn@aupp.edu.kh` are
verified. `dara@aupp.edu.kh` is **unverified**, so its login returns 403 (useful for testing that flow).

## How things work (non-obvious)

- **Auth:** sign-up accepts only `.edu.kh` and returns `{ email, verificationRequired: true }` with
  no token: nobody is signed in until the emailed link is opened. Registering again with an
  unverified email replaces that account; a verified one gets 409. Login is blocked (403) until
  verified. `resend-verification` takes `{ email, password }`. `requireAuth` re-checks in the
  database that the account exists and is verified.
- **Email:** school Outlook / Microsoft 365 blocks password-based SMTP from apps. Send from Gmail
  (App Password, `smtp.gmail.com:465`) or Brevo; the recipients can still be `.edu.kh`. If sending
  fails, the verification link is printed in the API log.
- **Search:** full-text (`search_vector` generated column + GIN index), partial words (ILIKE with
  `%`/`_` escaped), and title typos (`pg_trgm`, `word_similarity >= 0.5`). Ranked best match first.
- **Auctions:** `listing_type = 'auction'` + `auction_ends_at` + `min_increment`; `price` is the
  starting bid. Bids go through `POST /api/listings/:id/bids` (`routes/bids.js`), which locks the
  listing row (`SELECT … FOR UPDATE` in `withTransaction`) so simultaneous bids cannot both win.
  `server.js` runs `closeEndedAuctions()` every minute: an ended auction with bids becomes
  `reserved` (highest bid wins; on a tie, the earlier bid). After the first bid, type, price,
  end time and raise are locked (409). Every listing in the API has `auction: null | {...}`.
- **Messaging:** there is no conversations table. A thread is all messages between two users about
  one listing (this follows the ER diagram).
- **Uploads:** `POST /api/uploads` with raw image bytes (max 5 MB), saved to `backend/uploads/`
  (git-ignored). Must move to Cloudinary before deploying, because Render wipes the disk on restart.
- **Schema changes:** existing databases do not update themselves. For each change, provide an
  idempotent SQL snippet in `backend/README.md` (see the "Search" section) as well as editing `schema.sql`.
- **SQL safety:** always use `$1, $2…` parameters. Only whitelisted column names may be built into SQL.

## Status and roadmap

Done (week 5): auth with email verification, listings CRUD with five types (incl. auction) and statuses,
ranked typo-tolerant search and filters, auctions/bidding, profiles, per-listing messaging, photo
uploads; frontend fully wired to the API.

Next (professor's feedback, in priority order):
1. Move the database to Supabase (only `DATABASE_URL` changes; it is still PostgreSQL)
2. Email notifications (new message, outbid, auction won, sold) through one shared notify function;
   hook "auction won" into the loop in `server.js` that logs closed auctions
3. Cloudinary uploads, then deploy: Render (API), Supabase (database), Vercel (frontend, root = `frontend`)
4. Online payment in Stripe test mode (KHQR/Bakong as the local alternative)
5. Telegram bot notifications (reusing the notify function), real-time chat if time allows
