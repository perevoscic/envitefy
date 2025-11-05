import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function VerifyRequestPage() {
  return (
    <main className="mx-auto max-w-md p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Check your email</h1>
      <p className="text-muted-foreground">
        We sent you a sign-in link. Please click the link in your email to
        continue.
      </p>
    </main>
  );
}
