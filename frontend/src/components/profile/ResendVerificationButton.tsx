"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { resendVerification } from "@/lib/api/actions";

/** Emails the signed-in user a new verification link. The previous link stops working. */
export function ResendVerificationButton() {
  const [status, setStatus] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  async function handleClick() {
    setIsSending(true);
    const result = await resendVerification();
    setIsSending(false);
    setStatus(result.error ?? "Sent. Check your inbox and your Junk folder.");
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Button type="button" variant="secondary" disabled={isSending} onClick={handleClick}>
        {isSending ? "Sending..." : "Resend verification email"}
      </Button>
      {status ? (
        <p role="status" className="text-sm text-foreground">
          {status}
        </p>
      ) : null}
    </div>
  );
}
