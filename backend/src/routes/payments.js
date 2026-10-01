import { Router } from "express";
import { config } from "../config.js";
import { LISTING_SELECT } from "../db/listings.js";
import { markPaid } from "../db/payments.js";
import { query, withTransaction } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";
import {
  createCheckoutSession,
  isStripeConfigured,
  isValidWebhookSignature,
  retrieveCheckoutSession,
} from "../services/stripe.js";
import { HttpError } from "../utils/httpError.js";
import { amountToPay } from "../utils/payments.js";

// Online card payments with Stripe Checkout (test mode). The buyer is sent to a page hosted by
// Stripe, so card numbers never touch our servers.
export const paymentsRouter = Router();

// GET /api/payments/config  -> whether the "Pay with card" button should be shown
paymentsRouter.get("/config", (req, res) => {
  res.json({ enabled: isStripeConfigured });
});

// POST /api/payments/checkout  { listingId }  (logged in) -> { url } of Stripe's payment page
paymentsRouter.post("/checkout", requireAuth, async (req, res) => {
  if (!isStripeConfigured) throw new HttpError(503, "Online payment is not set up yet.");

  const url = await withTransaction(async (client) => {
    // Lock the listing so two buyers cannot start paying for the same item at the same moment.
    const locked = await client.query("SELECT id FROM listings WHERE id = $1 FOR UPDATE", [req.body.listingId]);
    if (!locked.rows[0]) throw new HttpError(404, "Listing not found.");
    const listing = (await client.query(`${LISTING_SELECT} WHERE l.id = $1`, [req.body.listingId])).rows[0];
    const amount = amountToPay(listing, req.userId);

    // Someone else already paid, or is on Stripe's page right now (a checkout lasts 30 minutes).
    const { rows: busy } = await client.query(
      `SELECT status FROM payments
       WHERE listing_id = $1 AND (status = 'paid'
         OR (status = 'pending' AND buyer_id <> $2 AND created_at > now() - interval '30 minutes'))`,
      [listing.id, req.userId],
    );
    if (busy.some((row) => row.status === "paid")) throw new HttpError(409, "This item has already been paid for.");
    if (busy.length) throw new HttpError(409, "Someone else is paying for this right now. Try again in 30 minutes.");

    const page = `${config.frontendOrigin}/listings/${listing.id}`;
    const session = await createCheckoutSession({
      title: listing.title,
      amountCents: Math.round(amount * 100),
      listingId: listing.id,
      buyerId: req.userId,
      // Stripe replaces {CHECKOUT_SESSION_ID}, so the listing page can confirm the payment.
      successUrl: `${page}?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: page,
    });
    await client.query(
      "INSERT INTO payments (listing_id, buyer_id, amount, stripe_session_id) VALUES ($1, $2, $3, $4)",
      [listing.id, req.userId, amount, session.id],
    );
    return session.url;
  });

  res.status(201).json({ url });
});

// POST /api/payments/confirm  { sessionId }  (logged in) -> { status: "paid" | "pending" }
// Called when the buyer comes back from Stripe. We ask Stripe directly instead of trusting the URL.
paymentsRouter.post("/confirm", requireAuth, async (req, res) => {
  const sessionId = String(req.body.sessionId ?? "");
  const { rows } = await query("SELECT buyer_id, status FROM payments WHERE stripe_session_id = $1", [sessionId]);
  if (!rows[0] || rows[0].buyer_id !== req.userId) throw new HttpError(404, "Payment not found.");
  if (rows[0].status === "paid") return res.json({ status: "paid" });

  const session = await retrieveCheckoutSession(sessionId);
  if (session.payment_status !== "paid") return res.json({ status: "pending" });
  await markPaid(sessionId);
  res.json({ status: "paid" });
});

/**
 * POST /api/payments/webhook  (called by Stripe, not by users). Mounted in app.js with the raw
 * body, because the signature is computed over the exact bytes Stripe sent. Covers buyers who
 * close the tab before returning to UniSwap.
 */
export async function stripeWebhook(req, res) {
  const secret = config.stripe.webhookSecret;
  if (!isStripeConfigured || !secret) throw new HttpError(503, "Stripe webhooks are not set up.");
  const rawBody = req.body.toString("utf8");
  if (!isValidWebhookSignature(rawBody, req.get("stripe-signature"), secret)) {
    throw new HttpError(400, "Invalid Stripe signature.");
  }
  const event = JSON.parse(rawBody);
  const session = event.data?.object;
  if (event.type === "checkout.session.completed" && session?.payment_status === "paid") {
    await markPaid(session.id);
  }
  res.json({ received: true });
}
