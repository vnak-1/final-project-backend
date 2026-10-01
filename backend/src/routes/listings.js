import { Router } from "express";
import { buildBrowseQuery, findListingById } from "../db/listings.js";
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
  auctionEndsAt: "auction_ends_at",
  minIncrement: "min_increment",
};

// Once someone has bid, these would change the deal under the bidders' feet, so they are locked.
const LOCKED_AFTER_BIDS = ["listingType", "price", "auctionEndsAt", "minIncrement"];

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
// With `query`, results are ranked best match first and tolerate small typos (see buildBrowseQuery).
listingsRouter.get("/", async (req, res) => {
  const { text, params } = buildBrowseQuery(parseListingFilters(req.query));
  const { rows } = await query(text, params);
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
       (user_id, title, description, category, condition, listing_type, price, cash_topup, image_urls,
        auction_ends_at, min_increment)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
    [req.userId, b.title.trim(), b.description ?? "", b.category, b.condition,
      b.listingType ?? "sale", b.price ?? 0, b.cashTopup ?? null, b.imageUrls ?? [],
      // An end time only means something for an auction.
      b.listingType === "auction" ? b.auctionEndsAt : null, b.minIncrement ?? 1],
  );
  res.status(201).json({ listing: toListing(await findListingById(rows[0].id)) });
});

// PATCH /api/listings/:id  (owner only) -- any subset of fields, e.g. { "status": "sold" }
listingsRouter.patch("/:id", requireAuth, async (req, res) => {
  const listing = await findOwnedListing(req.params.id, req.userId);
  assertValid(req.body, { partial: true });

  const changes = { ...req.body };
  const fields = Object.keys(WRITABLE_COLUMNS).filter((field) => changes[field] !== undefined);
  if (!fields.length) throw new HttpError(400, "Nothing to update.");

  if (listing.bid_count > 0) {
    const locked = fields.filter((field) => LOCKED_AFTER_BIDS.includes(field));
    if (locked.length) {
      throw new HttpError(409, "People have already bid, so the type, price and auction settings are locked.");
    }
  }
  const nextType = changes.listingType ?? listing.listing_type;
  if (nextType === "auction" && !(changes.auctionEndsAt ?? listing.auction_ends_at)) {
    throw new HttpError(400, "An auction needs an end date and time.", { auctionEndsAt: "Required for an auction." });
  }
  // Switching away from an auction clears its end time.
  if (nextType !== "auction" && listing.auction_ends_at) {
    changes.auctionEndsAt = null;
    if (!fields.includes("auctionEndsAt")) fields.push("auctionEndsAt");
  }

  // Column names come from our own whitelist above; values are always $n parameters.
  const setSql = fields.map((field, i) => `${WRITABLE_COLUMNS[field]} = $${i + 2}`).join(", ");
  await query(
    `UPDATE listings SET ${setSql}, updated_at = now() WHERE id = $1`,
    [req.params.id, ...fields.map((field) => changes[field])],
  );
  res.json({ listing: toListing(await findListingById(req.params.id)) });
});

// DELETE /api/listings/:id  (owner only)
listingsRouter.delete("/:id", requireAuth, async (req, res) => {
  await findOwnedListing(req.params.id, req.userId);
  await query("DELETE FROM listings WHERE id = $1", [req.params.id]);
  res.status(204).end();
});
