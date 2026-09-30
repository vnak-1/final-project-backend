import { Router } from "express";
import { findListingById, LISTING_SELECT } from "../db/listings.js";
import { query } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";
import { HttpError } from "../utils/httpError.js";
import { toListing } from "../utils/serializers.js";
import { parseListingFilters, validateListing } from "../utils/validation.js";

export const listingsRouter = Router();

// Request field (camelCase) -> database column. Only these can be written by clients.
const WRITABLE_COLUMNS = {
  title: "title",
  description: "description",
  category: "category",
  condition: "condition",
  listingType: "listing_type",
  price: "price",
  cashTopup: "cash_topup",
  imageUrls: "image_urls",
  status: "status",
};

function assertValid(body, options) {
  const errors = validateListing(body, options);
  if (Object.keys(errors).length) throw new HttpError(400, "Please fix the highlighted fields.", errors);
}

async function findOwnedListing(id, userId) {
  const listing = await findListingById(id);
  if (!listing) throw new HttpError(404, "Listing not found.");
  if (listing.user_id !== userId) throw new HttpError(403, "You can only change your own listings.");
  return listing;
}

// GET /api/listings?query=&category=&condition=&type=&minPrice=&maxPrice=&status=
listingsRouter.get("/", async (req, res) => {
  const filters = parseListingFilters(req.query);
  const conditions = [];
  const params = [];
  // Adds one filter: each "?" becomes the next $n placeholder, and the value goes into params.
  const add = (sql, value) => {
    params.push(value);
    conditions.push(sql.replaceAll("?", `$${params.length}`));
  };

  add("l.status = ?", filters.status);
  if (filters.query) add("(l.title ILIKE ? OR l.description ILIKE ?)", `%${filters.query}%`);
  if (filters.category) add("l.category = ?", filters.category);
  if (filters.condition) add("l.condition = ?", filters.condition);
  if (filters.listingType) add("l.listing_type = ?", filters.listingType);
  if (filters.minPrice !== undefined) add("l.price >= ?", filters.minPrice);
  if (filters.maxPrice !== undefined) add("l.price <= ?", filters.maxPrice);

  const { rows } = await query(
    `${LISTING_SELECT} WHERE ${conditions.join(" AND ")} ORDER BY l.created_at DESC LIMIT 100`,
    params,
  );
  res.json({ listings: rows.map(toListing) });
});

// GET /api/listings/:id
listingsRouter.get("/:id", async (req, res) => {
  const listing = await findListingById(req.params.id);
  if (!listing) throw new HttpError(404, "Listing not found.");
  res.json({ listing: toListing(listing) });
});

// POST /api/listings  (logged in)
listingsRouter.post("/", requireAuth, async (req, res) => {
  assertValid(req.body);
  const b = req.body;
  const { rows } = await query(
    `INSERT INTO listings
       (user_id, title, description, category, condition, listing_type, price, cash_topup, image_urls)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
    [req.userId, b.title.trim(), b.description ?? "", b.category, b.condition,
      b.listingType ?? "sale", b.price ?? 0, b.cashTopup ?? null, b.imageUrls ?? []],
  );
  res.status(201).json({ listing: toListing(await findListingById(rows[0].id)) });
});

// PATCH /api/listings/:id  (owner only) -- any subset of fields, e.g. { "status": "sold" }
listingsRouter.patch("/:id", requireAuth, async (req, res) => {
  await findOwnedListing(req.params.id, req.userId);
  assertValid(req.body, { partial: true });

  const fields = Object.keys(WRITABLE_COLUMNS).filter((field) => req.body[field] !== undefined);
  if (!fields.length) throw new HttpError(400, "Nothing to update.");

  // Column names come from our own whitelist above; values are always $n parameters.
  const setSql = fields.map((field, i) => `${WRITABLE_COLUMNS[field]} = $${i + 2}`).join(", ");
  await query(
    `UPDATE listings SET ${setSql}, updated_at = now() WHERE id = $1`,
    [req.params.id, ...fields.map((field) => req.body[field])],
  );
  res.json({ listing: toListing(await findListingById(req.params.id)) });
});

// DELETE /api/listings/:id  (owner only)
listingsRouter.delete("/:id", requireAuth, async (req, res) => {
  await findOwnedListing(req.params.id, req.userId);
  await query("DELETE FROM listings WHERE id = $1", [req.params.id]);
  res.status(204).end();
});
