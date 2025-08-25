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
        chip: "Snap a flyer using your camera",
      },
      {
        chip: "Syncs to your calendar instantly",
      },
      {
        chip: "No more manual typing",
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
          <div className="space-y-2 text-center">
            <h2 className="text-xl md:text-4xl font-extrabold tracking-tight text-shadow-soft login-hero-heading">
              <span className="block">Scan flyers.</span>
              <span className="block">Save the date.</span>
            </h2>
            <p className="text-muted-foreground">
              Turn any flyer or appointment card into a calendar event in
              seconds.
            </p>
          </div>

          <div className="scan-card">
            <div className="scan-grid" />
            {slide === 0 && (
              <video
                className="absolute inset-0 w-full h-full object-cover"
                src="/scan.mp4"
                autoPlay
                muted
                loop
                playsInline
              />
            )}
            {slide === 1 && (
              <img
                className="absolute inset-0 w-full h-full object-cover"
                src="/invite.jpg"
                alt="Invite example"
              />
            )}
            {slide === 2 && (
              <img
                className="absolute inset-0 w-full h-full object-cover"
                src="/3rd.jpg"
                alt="Third slide"
              />
            )}
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
              className="w-full px-4 py-2 rounded bg-white text-black border border-[#DADCE0] shadow-sm hover:bg-[#F6F6F6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4285F4]/30"
              onClick={() => signIn("google", { callbackUrl: "/" })}
            >
              <span className="inline-flex items-center justify-center gap-3 pl-[2px]">
                <svg
                  aria-hidden="true"
                  width="20"
                  height="20"
                  viewBox="0 0 48 48"
                >
                  <path
                    fill="#FFC107"
                    d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12
 s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C32.651,6.053,28.478,4,24,4C12.955,4,4,12.955,4,24
 s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
                  />
                  <path
                    fill="#FF3D00"
                    d="M6.306,14.691l6.571,4.814C14.602,16.289,18.961,14,24,14c3.059,0,5.842,1.154,7.961,3.039
 l5.657-5.657C32.651,6.053,28.478,4,24,4C16.318,4,9.715,8.337,6.306,14.691z"
                  />
                  <path
                    fill="#4CAF50"
                    d="M24,44c5.176,0,9.86-1.977,13.409-5.197l-6.174-5.238C29.215,35.091,26.751,36,24,36
 c-5.202,0-9.619-3.317-11.283-7.946l-6.54,5.037C9.553,39.556,16.227,44,24,44z"
                  />
                  <path
                    fill="#1976D2"
                    d="M43.611,20.083H42V20H24v8h11.303c-0.793,2.237-2.231,4.166-3.997,5.565
 c0.001-0.001,0.002-0.001,0.003-0.002l6.174,5.238C39.059,36.284,44,30.627,44,24C44,22.659,43.862,21.35,43.611,20.083z"
                  />
                </svg>
                <span>Continue with Google</span>
              </span>
            </button>
            <button
              className="w-full px-4 py-2 rounded bg-white text-black border border-[#DADCE0] shadow-sm hover:bg-[#F6F6F6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0078D4]/30"
              onClick={() => signIn("azure-ad", { callbackUrl: "/" })}
            >
              <span className="inline-flex items-center justify-center gap-3">
                <svg
                  aria-hidden="true"
                  width="20"
                  height="20"
                  viewBox="0 0 23 23"
                >
                  <rect width="10" height="10" x="1" y="1" fill="#F25022" />
                  <rect width="10" height="10" x="12" y="1" fill="#7FBA00" />
                  <rect width="10" height="10" x="1" y="12" fill="#00A4EF" />
                  <rect width="10" height="10" x="12" y="12" fill="#FFB900" />
                </svg>
                <span>Continue with Microsoft</span>
              </span>
            </button>
          </div>

          <div className="flex items-center gap-3 select-none">
            <div className="h-px bg-border flex-1" />
            <span
              className="text-xs tracking-wide uppercase dark:text-white"
              style={{ color: "#000" }}
            >
              or
            </span>
            <div className="h-px bg-border flex-1" />
          </div>

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
              className="w-full px-4 py-2 rounded bg-[#A259FF] text-white disabled:opacity-70"
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
