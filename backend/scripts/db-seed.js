// Inserts demo users, listings and a chat so the API has data to show.  Run: npm run db:seed
// Demo login for every user: password "password123". Development only.
import { pool } from "../src/db/pool.js";
import { hashPassword } from "../src/utils/password.js";

const passwordHash = await hashPassword("password123");

const users = [
  ["Sokunth Navy", "sokunth@aupp.edu.kh", "Computer Science", 2027, true],
  ["Chanrithorn Lim", "chanrithorn@aupp.edu.kh", "Business", 2026, true],
  ["Dara Phal", "dara@aupp.edu.kh", "Architecture", 2028, false],
];

const ids = [];
for (const [name, email, major, year, verified] of users) {
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password_hash, major, graduation_year, is_verified)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [name, email, passwordHash, major, year, verified],
  );
  ids.push(rows[0].id);
}

// [owner index, title, category, condition, type, price, image]
const listings = [
  [0, "Calculus: Early Transcendentals", "textbooks", "good", "sale", 25, "/listings/calculus-book.jpg"],
  [0, "Used MacBook Air M1", "electronics", "like_new", "sale", 550, "/listings/used-macbook.jpg"],
  [1, "Mini fridge for dorm", "furniture", "good", "sale", 60, "/listings/mini-fridge.avif"],
  [1, "City bike - trade for a desk", "bikes", "fair", "trade", 0, "/listings/bike.jpg"],
  [2, "Winter jacket (free)", "clothing", "good", "giveaway", 0, "/listings/jacket.svg"],
];

const listingIds = [];
for (const [owner, title, category, condition, type, price, image] of listings) {
  const { rows } = await pool.query(
    `INSERT INTO listings (user_id, title, description, category, condition, listing_type, price, image_urls)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
    [ids[owner], title, `Demo listing: ${title}.`, category, condition, type, price, [image]],
  );
  listingIds.push(rows[0].id);
}

// A short chat: Chanrithorn asks Sokunth about the MacBook.
await pool.query(
  `INSERT INTO messages (listing_id, sender_id, receiver_id, content) VALUES
     ($1, $2, $3, 'Hi! Is the MacBook still available?'),
     ($1, $3, $2, 'Yes it is. Want to meet at the library tomorrow?')`,
  [listingIds[1], ids[1], ids[0]],
);

console.log(`Seeded ${ids.length} users, ${listingIds.length} listings, 2 messages.`);
await pool.end();
