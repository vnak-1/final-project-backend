import { query } from "../db/pool.js";
import { HttpError } from "../utils/httpError.js";
import { verifyToken } from "../utils/token.js";

/**
 * Blocks the request unless it carries a valid "Authorization: Bearer <token>" header
 * for an account that still exists and has verified its email.
 */
export async function requireAuth(req, res, next) {
  const [scheme, token] = (req.headers.authorization ?? "").split(" ");
  if (scheme !== "Bearer" || !token) throw new HttpError(401, "Please log in first.");

  let userId;
  try {
    userId = verifyToken(token);
  } catch {
    throw new HttpError(401, "Your session has expired. Please log in again.");
  }

  // The token proves who is asking; the database says whether that account may still act.
  const { rows } = await query("SELECT is_verified FROM users WHERE id = $1", [userId]);
  if (!rows[0]?.is_verified) throw new HttpError(401, "Please log in again.");

  req.userId = userId;
  next();
}
