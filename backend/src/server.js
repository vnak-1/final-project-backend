import { app } from "./app.js";
import { config } from "./config.js";
import { closeEndedAuctions } from "./db/auctions.js";
import { isCloudinaryConfigured } from "./services/cloudinary.js";
import { isStripeConfigured } from "./services/stripe.js";
import { isTelegramConfigured, startTelegramPolling } from "./services/telegram.js";
import { isEmailConfigured } from "./utils/email.js";
import { notifyAuctionClosed } from "./utils/notify.js";
import { handleBotMessage } from "./utils/telegramBot.js";

app.listen(config.port, () => {
  console.log(`UniSwap API running on http://localhost:${config.port}`);
  // Which optional services are switched on (each needs its keys in .env).
  const onOff = (enabled) => (enabled ? "on" : "off");
  console.log(`  email ${onOff(isEmailConfigured)} · photos ${isCloudinaryConfigured ? "Cloudinary" : "local disk"}`
    + ` · payments ${onOff(isStripeConfigured)} · Telegram ${onOff(isTelegramConfigured)}`);
});

// Telegram: listen for "/start <code>" messages that link accounts. Only one running copy of the
// API may poll per bot token, so do not run it locally and on Render with the same token.
if (isTelegramConfigured) void startTelegramPolling(handleBotMessage);

// Once a minute, hand each ended auction to its highest bidder. Bids are already refused the
// moment an auction ends; this only flips the listing's status to "reserved".
const AUCTION_CHECK_MS = 60 * 1000;

async function runAuctionCheck() {
  try {
    for (const closed of await closeEndedAuctions()) {
      console.log(`[auction] "${closed.title}" won by ${closed.winner_id} for $${closed.amount}`);
      notifyAuctionClosed(closed);
    }
  } catch (error) {
    console.error("[auction] could not close ended auctions:", error.message);
  }
}

void runAuctionCheck();
setInterval(runAuctionCheck, AUCTION_CHECK_MS);
