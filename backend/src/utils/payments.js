import { HttpError } from "./httpError.js";

/**
 * How much `buyerId` should pay for a listing row (from LISTING_SELECT), or a clear error.
 * Only two things can be paid online: an item for sale, and an auction you won.
 * Trades, giveaways and "wanted" posts are settled in person.
 */
export function amountToPay(listing, buyerId) {
  if (listing.user_id === buyerId) throw new HttpError(400, "You cannot pay for your own listing.");

  if (listing.listing_type === "sale") {
    if (listing.status !== "active") throw new HttpError(400, "This item is no longer available.");
    if (Number(listing.price) <= 0) throw new HttpError(400, "This item has no price to pay.");
    return Number(listing.price);
  }
  if (listing.listing_type === "auction") {
    if (listing.status !== "reserved" || listing.leading_bidder_id !== buyerId) {
      throw new HttpError(403, "Only the winner can pay, once the auction has ended.");
    }
    return Number(listing.highest_bid);
  }
  throw new HttpError(400, "Only items for sale and won auctions can be paid online.");
}
