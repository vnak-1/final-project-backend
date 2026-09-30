"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { ApiError, apiFetch, TOKEN_COOKIE } from "@/lib/api/http";
import type { ListingStatus, ListingWithSeller, User } from "@/types";

/**
 * Server Actions: the changes the browser asks for. They run on the Next.js server and forward
 * each request to the Express API with the user's token. The API checks the token and who owns
 * what on every call, so calling an action directly cannot get around those checks.
 */

/** What a form gets back: an error to show, or no error on success. */
export interface ActionResult {
  error?: string;
  fieldErrors?: Record<string, string>;
}

/** Same lifetime as the API's tokens (7 days). */
const SESSION_SECONDS = 60 * 60 * 24 * 7;

async function saveSession(token: string) {
  (await cookies()).set(TOKEN_COOKIE, token, {
    httpOnly: true, // page scripts cannot read it, so a script injected into the page cannot steal the session
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

/** API errors become messages for the form. Anything else is a bug, so it is logged. */
function toActionError(error: unknown): ActionResult {
  if (error instanceof ApiError) return { error: error.message, fieldErrors: error.details };
  console.error(error);
  return { error: "Something went wrong. Please try again." };
}

export async function signIn(email: string, password: string): Promise<ActionResult & { user?: User }> {
  try {
    const { user, token } = await apiFetch<{ user: User; token: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    await saveSession(token);
    return { user };
  } catch (error) {
    return toActionError(error);
  }
}

export async function register(values: {
  name: string;
  email: string;
  password: string;
  major: string;
  graduationYear: number;
}): Promise<ActionResult & { user?: User }> {
  try {
    const { token } = await apiFetch<{ token: string }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name: values.name, email: values.email, password: values.password }),
    });
    await saveSession(token);
    // Registration only takes name, email and password; major and year are profile fields.
    const { user } = await apiFetch<{ user: User }>("/api/users/me", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ major: values.major, graduationYear: values.graduationYear }),
    });
    return { user };
  } catch (error) {
    return toActionError(error);
  }
}

export async function signOut(): Promise<void> {
  (await cookies()).delete(TOKEN_COOKIE);
}

/** Emails the signed-in user a fresh verification link. */
export async function resendVerification(): Promise<ActionResult> {
  try {
    await apiFetch("/api/auth/resend-verification", { method: "POST" });
    return {};
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateProfile(values: { name: string; bio: string }): Promise<ActionResult & { user?: User }> {
  try {
    const { user } = await apiFetch<{ user: User }>("/api/users/me", {
      method: "PATCH",
      body: JSON.stringify(values),
    });
    return { user };
  } catch (error) {
    return toActionError(error);
  }
}

/** Uploads the photo (if any), then creates the listing. Returns the new listing's id. */
export async function createListing(formData: FormData): Promise<ActionResult & { listingId?: string }> {
  try {
    const photo = formData.get("photo");
    const imageUrls = photo instanceof File && photo.size > 0 ? [await uploadPhoto(photo)] : [];
    const { listing } = await apiFetch<{ listing: ListingWithSeller }>("/api/listings", {
      method: "POST",
      body: JSON.stringify({
        title: formData.get("title"),
        description: formData.get("description"),
        category: formData.get("category"),
        condition: formData.get("condition"),
        listingType: formData.get("listingType"),
        price: Number(formData.get("price") || 0),
        imageUrls,
      }),
    });
    return { listingId: listing.id };
  } catch (error) {
    return toActionError(error);
  }
}

/** Sends the image bytes to the API's upload route and returns the photo's public URL. */
async function uploadPhoto(photo: File): Promise<string> {
  const { url } = await apiFetch<{ url: string }>("/api/uploads", {
    method: "POST",
    headers: { "Content-Type": photo.type },
    body: photo,
  });
  return url;
}

export async function updateListingStatus(id: string, status: ListingStatus): Promise<ActionResult> {
  try {
    await apiFetch(`/api/listings/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  } catch (error) {
    return toActionError(error);
  }
  refresh(); // re-render the page so the new status shows
  return {};
}

export async function deleteListing(id: string): Promise<ActionResult> {
  try {
    await apiFetch(`/api/listings/${encodeURIComponent(id)}`, { method: "DELETE" });
    return {};
  } catch (error) {
    return toActionError(error);
  }
}

export async function sendMessage(listingId: string, receiverId: string, body: string): Promise<ActionResult> {
  try {
    await apiFetch("/api/messages", {
      method: "POST",
      body: JSON.stringify({ listingId, receiverId, body }),
    });
  } catch (error) {
    return toActionError(error);
  }
  refresh(); // re-render the thread so the new message shows
  return {};
}
