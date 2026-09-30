"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { resendVerification } from "@/lib/api/actions";

interface ResendVerificationButtonProps {
  email: string;
  password: string;
}

/**
 * Emails a new verification link; the previous link stops working. Shown on the sign-in form
 * when the password was right but the email is not verified yet, so it reuses those details.
 */
export function ResendVerificationButton({ email, password }: ResendVerificationButtonProps) {
  const [status, setStatus] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  async function handleClick() {
    setIsSending(true);
    const result = await resendVerification(email, password);
    setIsSending(false);
    setStatus(result.error ?? "Sent. Check your inbox and your Junk folder.");
  }

  return (
    <div className="flex flex-col gap-2">
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
