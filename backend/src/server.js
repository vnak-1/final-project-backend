import { app } from "./app.js";
import { config } from "./config.js";
import { closeEndedAuctions } from "./db/auctions.js";
import { notifyAuctionClosed } from "./utils/notify.js";

app.listen(config.port, () => {
  console.log(`UniSwap API running on http://localhost:${config.port}`);
});

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
