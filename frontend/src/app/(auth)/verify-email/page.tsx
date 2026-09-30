import { CircleAlert, CircleCheck, Mail } from "lucide-react";
import Link from "next/link";
import { ResendVerificationButton } from "@/components/profile/ResendVerificationButton";
import { getCurrentUser, verifyEmail } from "@/lib/api";

export const metadata = { title: "Verify email | UniSwap" };

/**
 * Two states on one route. Right after registering there is no token, so this is the
 * "check your email" step. The link in that email comes back here with `?token=...`,
 * which the API checks before giving the account its verified badge.
 */
export default async function VerifyEmailPage({ searchParams }: PageProps<"/verify-email">) {
  const { token } = await searchParams;

  if (typeof token === "string" && token) {
    const isVerified = await verifyEmail(token);
    const Icon = isVerified ? CircleCheck : CircleAlert;
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <Icon aria-hidden="true" className="size-10 text-foreground" />
        <h1 className="font-heading text-2xl tracking-tight">
          {isVerified ? "Email verified" : "Link not valid"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isVerified
            ? "Your account now shows the verified student badge."
            : "This verification link is invalid or has already been used."}
        </p>
        <Link href="/" className="text-sm font-medium underline">
          Go to UniSwap
        </Link>
      </div>
    );
  }

  const user = await getCurrentUser();

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <CircleCheck aria-hidden="true" className="size-10 text-foreground" />
      <h1 className="font-heading text-2xl tracking-tight">Check your email</h1>
      <p className="text-sm text-muted-foreground">
        We sent a confirmation link to {user?.email ?? "your campus email"}. Click it to finish
        setting up your account.
      </p>

      <div className="w-full rounded-lg border border-border bg-muted p-3 text-left">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail aria-hidden="true" className="size-4 shrink-0" />
          <span>Check your spam folder if it does not arrive within a minute.</span>
        </p>
      </div>

      {user && !user.isVerified ? <ResendVerificationButton /> : null}

      {process.env.NODE_ENV !== "production" ? (
        <p className="text-xs text-muted-foreground">
          Development: if the API cannot send email (see SMTP_* in backend/.env), the link is
          printed in its log instead.
        </p>
      ) : null}

      <Link href="/" className="text-sm font-medium underline">
        Continue to UniSwap
      </Link>
    </div>
  );
}
