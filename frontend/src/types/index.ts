// Shared domain types for UniSwap.
// Route groups do not appear in these strings; they match the URL the user sees.

export type ListingCategory =
  | "textbooks"
  | "electronics"
  | "furniture"
  | "clothing"
  | "bikes"
  | "other";

export type ListingCondition = "new" | "like_new" | "good" | "fair";

export type ListingStatus = "active" | "reserved" | "sold" | "traded";

/** What the poster wants: sell it, find one (buy request), swap it, or give it away. */
export type ListingType = "sale" | "buy_request" | "trade" | "giveaway";

export interface User {
  id: string;
  name: string;
  /** Private: the API only includes it on your own account, never on public profiles. */
  email?: string;
  avatarUrl: string | null;
  major: string;
  graduationYear: number | null;
  bio: string;
  isVerified: boolean;
  createdAt: string;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  /** Extra cash offered on top of an uneven trade. */
  cashTopup: number | null;
  category: ListingCategory;
  condition: ListingCondition;
  listingType: ListingType;
  imageUrls: string[];
  sellerId: string;
  status: ListingStatus;
  createdAt: string;
}

export interface Message {
  id: string;
  listingId: string;
  senderId: string;
  receiverId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
}

/**
 * The API does not store conversations: a thread is every message between two users
 * about one listing. `id` is built from those two ids so a thread can have a URL.
 */
export interface Conversation {
  id: string;
  listingId: string;
  partnerId: string;
  participantIds: string[];
  lastMessageAt: string;
  unreadCount: number;
}

/** A listing joined with the fields a card needs, so the UI does not re-look-up the seller. */
export interface ListingWithSeller extends Listing {
  seller: Pick<User, "id" | "name" | "avatarUrl" | "isVerified">;
}

export interface ListingFilters {
  query?: string;
  listingType?: ListingType | "all";
  category?: ListingCategory | "all";
  minPrice?: number;
  maxPrice?: number;
  condition?: ListingCondition | "all";
}

