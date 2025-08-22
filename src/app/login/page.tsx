"use client";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Logo from "@/assets/logo.png";

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    if (status === "authenticated") router.replace("/");
  }, [status, router]);

  useEffect(() => {
    const id = setInterval(() => {
      setSlide((s) => (s + 1) % 3);
    }, 4200);
    return () => clearInterval(id);
  }, []);

  const slides = useMemo(
    () => [
      {
        title: "Snap a flyer",
        subtitle:
          "Use your camera to capture flyers, invites, or appointment cards.",
        chip: "OCR-powered extraction",
      },
      {
        title: "We parse the details",
        subtitle:
          "Dates, times, and addresses are detected and organized instantly.",
        chip: "AI date & address parsing",
      },
      {
        title: "Add to your calendar",
        subtitle: "One tap to add to Google, Outlook, or download for Apple.",
        chip: "Works with your calendars",
      },
    ],
    []
  );

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
      if (res?.ok) setMessage("Check your email for a sign-in link.");
      else setMessage(res?.error || "Failed to send email link");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-[100dvh] grid grid-cols-1 md:grid-cols-2">
      <section className="relative hidden md:flex items-center justify-center p-10 overflow-hidden bg-gradient-to-br from-primary/15 via-secondary/10 to-accent/10">
        <div className="absolute inset-0 -z-10 opacity-20" aria-hidden>
          <div className="scan-grid" />
        </div>
        <div className="max-w-xl w-full space-y-6">
          <div className="space-y-2">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-shadow-soft">
              Scan flyers. Save the date.
            </h2>
            <p className="text-muted-foreground">
              Turn any flyer or appointment card into a calendar event in
              seconds.
            </p>
          </div>

          <div className="scan-card">
            <div className="scan-grid" />
            <div className="scan-sheen" />
            <div className="scan-logo-wrap">
              <div className="scan-logo-sheen" />
              <div className="scan-logo" />
            </div>
            <div className="scan-title">
              <span className="scan-dot" />
              <div className="flex-1">
                <p className="text-sm opacity-90">{slides[slide].title}</p>
                <p className="text-xs text-muted-foreground">
                  {slides[slide].subtitle}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2">
            {slides.map((_, i) => (
              <span
                key={i}
                className={`h-2 w-2 rounded-full transition-all ${
                  i === slide ? "bg-accent w-6" : "bg-border"
                }`}
              />
            ))}
          </div>

          <div className="text-xs text-muted-foreground text-center">
            {slides[slide].chip}
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-surface/70 backdrop-blur-md p-6 shadow-md">
          <div className="flex flex-col items-center gap-2">
            <Image src={Logo} alt="Logo" height={64} className="rounded" />
            <h1 className="text-2xl font-semibold">Welcome back</h1>
            <p className="text-sm text-muted-foreground">
              Sign in to access your calendar assistant
            </p>
          </div>

          <div className="space-y-3">
            <button
              className="w-full px-4 py-2 rounded bg-[#4285F4] hover:bg-[#3367D6] text-white"
              onClick={() => signIn("google", { callbackUrl: "/" })}
            >
              Continue with Google
            </button>
            <button
              className="w-full px-4 py-2 rounded bg-[#0078D4] hover:bg-[#106EBE] text-white"
              onClick={() => signIn("azure-ad", { callbackUrl: "/" })}
            >
              Continue with Microsoft
            </button>
            <button
              className="w-full px-4 py-2 rounded bg-black text-white"
              onClick={() => signIn("apple", { callbackUrl: "/" })}
            >
              Continue with Apple
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
              {submitting ? "Sending..." : "Continue with email"}
            </button>
            {message && (
              <p className="text-sm text-muted-foreground">{message}</p>
            )}
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Don\'t have an account?{" "}
            <Link className="text-secondary hover:underline" href="/signup">
              Sign up
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
