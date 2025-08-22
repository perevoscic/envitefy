"use client";
import { FormEvent, useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const { status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") router.replace("/");
  }, [status, router]);

  const onEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await signIn("email", {
        email,
        redirect: false,
        callbackUrl: "/",
      });
      if (res?.ok) setMessage("Check your email to finish signing up.");
      else setMessage(res?.error || "Failed to send email link");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-md p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Sign up</h1>
      <div className="space-y-3">
        <button
          className="w-full px-4 py-2 rounded bg-[#4285F4] hover:bg-[#3367D6] text-white"
          onClick={() => signIn("google", { callbackUrl: "/" })}
        >
          Sign up with Google
        </button>
        <button
          className="w-full px-4 py-2 rounded bg-[#0078D4] hover:bg-[#106EBE] text-white"
          onClick={() => signIn("azure-ad", { callbackUrl: "/" })}
        >
          Sign up with Microsoft
        </button>
        <button
          className="w-full px-4 py-2 rounded bg-black text-white"
          onClick={() => signIn("apple", { callbackUrl: "/" })}
        >
          Sign up with Apple
        </button>
      </div>

      <div className="h-px bg-border" />

      <form className="space-y-3" onSubmit={onEmailSubmit}>
        <label className="block text-sm text-muted-foreground">Email</label>
        <input
          type="email"
          className="w-full border border-border bg-surface text-foreground p-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={submitting}
          className="w-full px-4 py-2 rounded bg-accent text-white disabled:opacity-70"
        >
          {submitting ? "Sending..." : "Continue with Email"}
        </button>
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </form>
    </main>
  );
}
