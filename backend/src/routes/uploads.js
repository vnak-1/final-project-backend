import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import express, { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { isCloudinaryConfigured, uploadImage } from "../services/cloudinary.js";
import { HttpError } from "../utils/httpError.js";

// Listing photos are saved to backend/uploads/ and served from /uploads/<file>.
// Good enough for local demos; swap for Cloudinary before deploying (Render's disk is wiped on restart).
export const UPLOAD_DIR = fileURLToPath(new URL("../../uploads/", import.meta.url));
const MAX_SIZE = "5mb";

// Only these image types are accepted. The file extension comes from this list, never from the client.
const EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const uploadsRouter = Router();

// POST /api/uploads  (logged in)  body: the raw image bytes, with Content-Type set to the image type
uploadsRouter.post(
  "/",
  requireAuth,
  express.raw({ type: Object.keys(EXTENSIONS), limit: MAX_SIZE }),
  async (req, res) => {
    const extension = EXTENSIONS[req.get("content-type")?.split(";")[0]];
    if (!extension || !Buffer.isBuffer(req.body) || req.body.length === 0) {
      throw new HttpError(400, "Send a JPEG, PNG, WebP or GIF image.");
    }

    // With Cloudinary set up, photos are hosted there; otherwise they are saved on this server.
    if (isCloudinaryConfigured) {
      return res.status(201).json({ url: await uploadImage(req.body, req.get("content-type").split(";")[0]) });
    }

    const fileName = `${randomUUID()}.${extension}`;
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(`${UPLOAD_DIR}${fileName}`, req.body);

    // Absolute URL, so the browser can load it no matter which site shows the listing.
    res.status(201).json({ url: `${req.protocol}://${req.get("host")}/uploads/${fileName}` });
  },
);
