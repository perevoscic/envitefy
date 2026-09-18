import type { SignupConfirmationEmailStatus } from "@/types/signup";

export default function SignupEmailNotice({
  status,
}: {
  status: SignupConfirmationEmailStatus | null;
}) {
  if (!status) return null;
  return (
    <p
      role="status"
      className="rounded-xl border border-[var(--signup-border)] bg-[var(--signup-page)] p-3 text-sm text-[var(--signup-text)]"
    >
      {status === "failed"
        ? "Your signup is saved, but we couldn’t send the confirmation email. Don’t sign up again. You can still edit or cancel from this browser. Contact the organizer if you need help."
        : status === "accepted"
          ? "Your confirmation email is on its way. It includes your signup details and a link to the form. Check your spam folder too."
          : "No email address was provided, so no confirmation email was sent. You can manage your signup from this browser."}
    </p>
  );
}
