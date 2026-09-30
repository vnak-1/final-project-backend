import { HttpError } from "../utils/httpError.js";
import { verifyToken } from "../utils/token.js";

/** Blocks the request unless it carries a valid "Authorization: Bearer <token>" header. */
export function requireAuth(req, res, next) {
  const [scheme, token] = (req.headers.authorization ?? "").split(" ");
  if (scheme !== "Bearer" || !token) {
    return next(new HttpError(401, "Please log in first."));
  }
  try {
    req.userId = verifyToken(token);
    next();
  } catch {
    next(new HttpError(401, "Your session has expired. Please log in again."));
  }
}
