// Convert database rows (snake_case) into the JSON shapes the frontend expects
// (camelCase, see frontend/src/types/index.ts). Secrets like password_hash never leave here.

export function toUser(row, { includeEmail = false } = {}) {
  const user = {
    id: row.id,
    name: row.name,
    avatarUrl: row.avatar_url,
    major: row.major,
    graduationYear: row.graduation_year,
    bio: row.bio,
    isVerified: row.is_verified,
    createdAt: row.created_at,
  };
  // Email is private: only shown to the account owner.
  if (includeEmail) user.email = row.email;
  return user;
}

/** Expects a listing row joined with seller columns (seller_name, seller_avatar_url, seller_is_verified). */
export function toListing(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    price: Number(row.price),
    cashTopup: row.cash_topup === null ? null : Number(row.cash_topup),
    category: row.category,
    condition: row.condition,
    listingType: row.listing_type,
    imageUrls: row.image_urls,
    sellerId: row.user_id,
    status: row.status,
    createdAt: row.created_at,
    seller: {
      id: row.user_id,
      name: row.seller_name,
      avatarUrl: row.seller_avatar_url,
      isVerified: row.seller_is_verified,
    },
  };
}

export function toMessage(row) {
  return {
    id: row.id,
    listingId: row.listing_id,
    senderId: row.sender_id,
    receiverId: row.receiver_id,
    body: row.content,
    createdAt: row.created_at,
    readAt: row.read_at,
  };
}
