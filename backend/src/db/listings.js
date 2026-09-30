import { query } from "./pool.js";

// Every listing is returned with the seller's public info, so the UI can render
// a card without a second request (matches ListingWithSeller in the frontend).
export const LISTING_SELECT = `
  SELECT l.*, u.name AS seller_name, u.avatar_url AS seller_avatar_url,
         u.is_verified AS seller_is_verified
  FROM listings l
  JOIN users u ON u.id = l.user_id`;

export async function findListingById(id) {
  const { rows } = await query(`${LISTING_SELECT} WHERE l.id = $1`, [id]);
  return rows[0] ?? null;
}
