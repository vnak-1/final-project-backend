-- UniSwap database schema (PostgreSQL 13+).
-- Follows the ER diagram in the proposal (Figure 2): users, listings, messages, reviews.
-- Extra user fields (major, bio, ...) match the frontend's User type in frontend/src/types.
-- WARNING: re-running this drops all data. Development only.

DROP TABLE IF EXISTS reviews, messages, listings, users CASCADE;

CREATE TABLE users (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name               TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 80),
  email              TEXT NOT NULL UNIQUE CHECK (email = lower(email) AND email LIKE '%.edu.kh'),
  password_hash      TEXT NOT NULL,
  is_verified        BOOLEAN NOT NULL DEFAULT false,
  verification_token TEXT,
  avatar_url         TEXT,
  major              TEXT NOT NULL DEFAULT '',
  graduation_year    INTEGER,
  bio                TEXT NOT NULL DEFAULT '',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE listings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 120),
  description  TEXT NOT NULL DEFAULT '',
  category     TEXT NOT NULL CHECK (category IN
                 ('textbooks', 'electronics', 'furniture', 'clothing', 'bikes', 'other')),
  condition    TEXT NOT NULL CHECK (condition IN ('new', 'like_new', 'good', 'fair')),
  listing_type TEXT NOT NULL DEFAULT 'sale' CHECK (listing_type IN
                 ('sale', 'buy_request', 'trade', 'giveaway')),
  price        NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  -- Value-gap negotiation: extra cash offered on top of an uneven trade.
  cash_topup   NUMERIC(10, 2) CHECK (cash_topup >= 0),
  image_urls   TEXT[] NOT NULL DEFAULT '{}',
  status       TEXT NOT NULL DEFAULT 'active' CHECK (status IN
                 ('active', 'reserved', 'sold', 'traded')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX listings_browse_idx ON listings (status, created_at DESC);
CREATE INDEX listings_user_idx ON listings (user_id);

CREATE TABLE messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id  UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL CHECK (length(content) BETWEEN 1 AND 2000),
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (sender_id <> receiver_id)
);

CREATE INDEX messages_thread_idx ON messages (listing_id, sender_id, receiver_id, created_at);

-- Stretch goal (reviews & ratings). Table exists now so the schema matches the ER diagram.
CREATE TABLE reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id  UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (listing_id, reviewer_id),
  CHECK (reviewer_id <> reviewee_id)
);
