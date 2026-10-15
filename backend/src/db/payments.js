import { notifyPaid } from "../utils/notify.js";
import { withTransaction } from "./pool.js";

/**
 * Records that a Stripe checkout was paid and marks the listing sold. Safe to call more than once
 * for the same session (the return page and Stripe's webhook may both report it): only the first
 * call changes anything. Returns the payment row the first time, otherwise null.
 */
export async function markPaid(stripeSessionId) {
  const payment = await withTransaction(async (client) => {
    const { rows } = await client.query(
      `UPDATE payments SET status = 'paid', paid_at = now()
       WHERE stripe_session_id = $1 AND status = 'pending'
       RETURNING listing_id, buyer_id, amount`,
      [stripeSessionId],
    );
    if (!rows[0]) return null;
    await client.query("UPDATE listings SET status = 'sold', updated_at = now() WHERE id = $1", [rows[0].listing_id]);
    return rows[0];
  });
  if (payment) notifyPaid(payment);
  return payment;
}
