import { randomBytes } from "node:crypto";
import { Router } from "express";
import { query } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";
import { HttpError } from "../utils/httpError.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { toUser } from "../utils/serializers.js";
import { signToken } from "../utils/token.js";
import { validateRegistration } from "../utils/validation.js";

export const authRouter = Router();

// POST /api/auth/register  { name, email, password }
authRouter.post("/register", async (req, res) => {
  const errors = validateRegistration(req.body);
  if (Object.keys(errors).length) throw new HttpError(400, "Please fix the highlighted fields.", errors);

  const email = req.body.email.trim().toLowerCase();
  const existing = await query("SELECT 1 FROM users WHERE email = $1", [email]);
  if (existing.rowCount) throw new HttpError(409, "An account with this email already exists.");

  const verificationToken = randomBytes(32).toString("hex");
  const { rows } = await query(
    `INSERT INTO users (name, email, password_hash, verification_token)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [req.body.name.trim(), email, await hashPassword(req.body.password), verificationToken],
  );

  // TODO: send this link by email. Until an email service is set up, it is printed to the server log.
  console.log(`[verify-email] ${email}: /verify-email?token=${verificationToken}`);

  res.status(201).json({ user: toUser(rows[0], { includeEmail: true }), token: signToken(rows[0].id) });
});

// POST /api/auth/verify-email  { token }  -> gives the account its verified badge
authRouter.post("/verify-email", async (req, res) => {
  const { rows } = await query(
    `UPDATE users SET is_verified = true, verification_token = NULL
     WHERE verification_token = $1 RETURNING *`,
    [String(req.body.token ?? "")],
  );
  if (!rows[0]) throw new HttpError(400, "This verification link is invalid or already used.");
  res.json({ user: toUser(rows[0], { includeEmail: true }) });
});

// POST /api/auth/login  { email, password }
authRouter.post("/login", async (req, res) => {
  const email = String(req.body.email ?? "").trim().toLowerCase();
  const { rows } = await query("SELECT * FROM users WHERE email = $1", [email]);
  const user = rows[0];
  // Same message for "no such user" and "wrong password", so attackers cannot probe for accounts.
  if (!user || !(await verifyPassword(String(req.body.password ?? ""), user.password_hash))) {
    throw new HttpError(401, "Email or password is incorrect.");
  }
  res.json({ user: toUser(user, { includeEmail: true }), token: signToken(user.id) });
});

// GET /api/auth/me  -> the logged-in user
authRouter.get("/me", requireAuth, async (req, res) => {
  const { rows } = await query("SELECT * FROM users WHERE id = $1", [req.userId]);
  if (!rows[0]) throw new HttpError(401, "Account no longer exists.");
  res.json({ user: toUser(rows[0], { includeEmail: true }) });
});
