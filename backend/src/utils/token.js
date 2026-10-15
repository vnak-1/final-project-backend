import jwt from "jsonwebtoken";
import { config } from "../config.js";

// Login sessions are stateless JWTs sent as "Authorization: Bearer <token>".

const EXPIRES_IN = "7d";

export function signToken(userId) {
  return jwt.sign({ sub: userId }, config.jwtSecret, { expiresIn: EXPIRES_IN });
}

/** Returns the user id inside a valid token. Throws if the token is invalid or expired. */
export function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret).sub;
}
