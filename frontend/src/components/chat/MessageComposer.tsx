"use client";

import { Send } from "lucide-react";
import { useState } from "react";
import { sendMessage } from "@/lib/api/actions";

interface MessageComposerProps {
  listingId: string;
  receiverId: string;
}

/**
 * Chat input. Sends the draft through a Server Action; on success the action refreshes the
 * thread page, so the new message appears without a reload.
 */
export function MessageComposer({ listingId, receiverId }: MessageComposerProps) {
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.trim()) return;
    setIsSending(true);
    setError(null);
    const result = await sendMessage(listingId, receiverId, draft);
    setIsSending(false);
    if (result.error) setError(result.error);
    else setDraft("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1">
      <div className="flex items-end gap-2">
        <label htmlFor="message" className="sr-only">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={2}
          maxLength={2000}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Write a message..."
          className="flex-1 resize-none rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
        />
        <button
          type="submit"
          disabled={!draft.trim() || isSending}
          aria-label="Send message"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/85 disabled:opacity-50"
        >
          <Send aria-hidden="true" className="size-4" />
        </button>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-foreground">
          {error}
        </p>
      ) : null}
    </form>
  );
}
