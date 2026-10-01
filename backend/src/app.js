import express from "express";
import { query } from "./db/pool.js";
import { cors } from "./middleware/cors.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { authRouter } from "./routes/auth.js";
import { bidsRouter } from "./routes/bids.js";
import { listingsRouter } from "./routes/listings.js";
import { messagesRouter } from "./routes/messages.js";
import { UPLOAD_DIR, uploadsRouter } from "./routes/uploads.js";
import { usersRouter } from "./routes/users.js";

// Builds the Express app. Kept separate from server.js so tests can import it without listening.
export const app = express();

app.use(cors);
app.use(express.json({ limit: "1mb" }));

// GET /api/health  -> quick check that the API and the database are both up
app.get("/api/health", async (req, res) => {
  await query("SELECT 1");
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/listings/:id/bids", bidsRouter);
app.use("/api/listings", listingsRouter);
app.use("/api/users", usersRouter);
app.use("/api/messages", messagesRouter);
app.use("/api/uploads", uploadsRouter);

// Uploaded listing photos. "nosniff" stops browsers from treating a disguised file as HTML or script.
app.use("/uploads", express.static(UPLOAD_DIR, {
  setHeaders: (res) => res.setHeader("X-Content-Type-Options", "nosniff"),
}));

app.use(notFound);
app.use(errorHandler);
