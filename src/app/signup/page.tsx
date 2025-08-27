"use client";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Logo from "@/assets/logo.png";

export default function SignupPage() {
  const { status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [slide, setSlide] = useState(0);
  const toastTimerRef = useRef<number | undefined>(undefined);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastText, setToastText] = useState("");

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
        title: "Snap a flyer",
        subtitle: "Use your phone camera to capture details",
      },
      {
        chip: "Syncs to your calendar instantly",
        title: "Instant sync",
        subtitle: "Events appear in your calendar right away",
      },
      {
        chip: "No more manual typing",
        title: "We parse the details",
        subtitle: "Dates, times, and locations extracted for you",
      },
    ],
    []
  );

  const onEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      if (password !== confirmPassword) {
        setMessage("Passwords do not match.");
        setToastText("Passwords do not match.");
        setToastOpen(true);
        if (toastTimerRef.current !== undefined) {
          window.clearTimeout(toastTimerRef.current);
        }
        toastTimerRef.current = window.setTimeout(() => {
          setToastOpen(false);
          toastTimerRef.current = undefined;
        }, 2800);
        return;
      }
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          firstName,
          lastName,
          password,
        }),
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const errMsg = (data && data.error) || "Failed to create account";
        setMessage(errMsg);
        setToastText(errMsg);
        setToastOpen(true);
        if (toastTimerRef.current !== undefined) {
          window.clearTimeout(toastTimerRef.current);
        }
        toastTimerRef.current = window.setTimeout(() => {
          setToastOpen(false);
          toastTimerRef.current = undefined;
        }, 2800);
        return;
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/",
      });
      if (result?.ok) {
        router.replace("/");
        return;
      }
      setMessage("Account created, please log in");
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
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-shadow-soft">
              <span className="block">Create</span>
              <span className="block">your account</span>
            </h2>
            <p className="text-muted-foreground">
              Join <span className="font-pacifico">Snap</span>
              <span> </span>
              <span className="font-montserrat">My Date</span> and turn flyers
              into calendar events in seconds.
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
        <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-surface/70 backdrop-blur-md p-6 shadow-xl shadow-black/20">
          <div className="flex flex-col items-center gap-2">
            <Link href="/">
              <Image src={Logo} alt="Logo" height={64} className="rounded" />
            </Link>
            <h1 className="text-2xl font-semibold">
              <span className="block text-center">Join</span>
              <span className="block">
                <span className="font-pacifico">Snap</span>
                <span> </span>
                <span className="font-montserrat">My Date</span>
              </span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Create an account to access your calendar assistant
            </p>
          </div>

          <div className="space-y-3">
            <button
              className="w-full px-4 py-2 rounded-full bg-white text-black border border-[#DADCE0] shadow-sm hover:bg-[#F6F6F6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4285F4]/30"
              onClick={() => signIn("google", { callbackUrl: "/" })}
            >
              <span className="inline-flex items-center justify-center gap-3">
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
                <span>Sign up with Google</span>
              </span>
            </button>
            <button
              className="w-full px-4 py-2 rounded-full bg-white text-black border border-[#DADCE0] shadow-sm hover:bg-[#F6F6F6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0078D4]/30"
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
                <span>Sign up with Microsoft</span>
              </span>
            </button>
            <button
              className="w-full px-4 py-2 rounded-full bg-[#A259FF] text-white disabled:opacity-70"
              onClick={() => {
                setShowEmailForm((v) => !v);
                requestAnimationFrame(() => {
                  const el = document.getElementById("email-signup-form");
                  if (el)
                    el.scrollIntoView({ behavior: "smooth", block: "center" });
                });
              }}
            >
              <span className="inline-flex items-center justify-center gap-3">
                <svg
                  aria-hidden="true"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M2 5.5A2.5 2.5 0 0 1 4.5 3h15A2.5 2.5 0 0 1 22 5.5v13A2.5 2.5 0 0 1 19.5 21h-15A2.5 2.5 0 0 1 2 18.5v-13Zm2.4-.5l7.6 5.32L19.6 5H4.4Zm15.6 2.08-7.18 5.03a1.5 1.5 0 0 1-1.64 0L4 7.08V18.5c0 .276.224.5.5.5h15a.5.5 0 0 0 .5-.5V7.08Z" />
                </svg>
                <span>Signup with Email</span>
              </span>
            </button>
          </div>

          {showEmailForm && (
            <form
              id="email-signup-form"
              className="space-y-3"
              onSubmit={onEmailSubmit}
            >
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  className="w-full border border-border bg-surface text-foreground p-2 rounded"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
                <input
                  type="text"
                  className="w-full border border-border bg-surface text-foreground p-2 rounded"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
              <input
                type="email"
                className="w-full border border-border bg-surface text-foreground p-2 rounded"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <div
                className={`relative ${
                  message === "Passwords do not match." ? "input-shake" : ""
                }`}
              >
                <input
                  type={showPassword ? "text" : "password"}
                  className={`w-full border bg-surface text-foreground p-2 rounded pr-10 ${
                    message === "Passwords do not match."
                      ? "input-error"
                      : "border-border"
                  }`}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-2 my-auto h-6 w-6 text-muted-foreground"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    {showPassword ? (
                      <path d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 15.338 6.445 18 12 18c.97 0 1.87-.097 2.713-.28l-1.74-1.74A7.32 7.32 0 0 1 12 16.5c-4.613 0-7.393-2.78-8.52-4.5a9.742 9.742 0 0 1 1.884-2.245l-1.384-1.532zM20.02 15.777c.63-.604 1.17-1.3 1.546-2.03C20.774 10.662 17.555 8 12 8c-.402 0-.79.02-1.163.058l-1.79-1.79C9.944 6.096 10.94 6 12 6c5.555 0 8.774 2.662 10.066 6-.424.997-1.101 1.973-1.93 2.827l-1.116-1.05zM9.75 12a2.25 2.25 0 0 0 2.25 2.25c.22 0 .43-.032.629-.092l-2.787-2.787A2.216 2.216 0 0 0 9.75 12zm4.5 0c0-.22-.032-.43-.092-.629l-2.787-2.787c.2-.06.409-.092.629-.092A2.25 2.25 0 0 1 16.5 12z" />
                    ) : (
                      <path d="M12 6c5.555 0 8.774 2.662 10.066 6-1.292 3.338-4.511 6-10.066 6S3.226 15.338 1.934 12C3.226 8.662 6.445 6 12 6zm0 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
                    )}
                  </svg>
                </button>
              </div>
              <div
                className={`relative ${
                  message === "Passwords do not match." ? "input-shake" : ""
                }`}
              >
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className={`w-full border bg-surface text-foreground p-2 rounded pr-10 ${
                    message === "Passwords do not match."
                      ? "input-error"
                      : "border-border"
                  }`}
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                  className="absolute inset-y-0 right-2 my-auto h-6 w-6 text-muted-foreground"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    {showConfirmPassword ? (
                      <path d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 15.338 6.445 18 12 18c.97 0 1.87-.097 2.713-.28l-1.74-1.74A7.32 7.32 0 0 1 12 16.5c-4.613 0-7.393-2.78-8.52-4.5a9.742 9.742 0 0 1 1.884-2.245l-1.384-1.532zM20.02 15.777c.63-.604 1.17-1.3 1.546-2.03C20.774 10.662 17.555 8 12 8c-.402 0-.79.02-1.163.058l-1.79-1.79C9.944 6.096 10.94 6 12 6c5.555 0 8.774 2.662 10.066 6-.424.997-1.101 1.973-1.93 2.827l-1.116-1.05zM9.75 12a2.25 2.25 0 0 0 2.25 2.25c.22 0 .43-.032.629-.092l-2.787-2.787A2.216 2.216 0 0 0 9.75 12zm4.5 0c0-.22-.032-.43-.092-.629l-2.787-2.787c.2-.06.409-.092.629-.092A2.25 2.25 0 0 1 16.5 12z" />
                    ) : (
                      <path d="M12 6c5.555 0 8.774 2.662 10.066 6-1.292 3.338-4.511 6-10.066 6S3.226 15.338 1.934 12C3.226 8.662 6.445 6 12 6zm0 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
                    )}
                  </svg>
                </button>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full px-4 py-2 rounded-full bg-[#A259FF] text-white disabled:opacity-70"
              >
                {submitting ? "Creating..." : "Create account"}
              </button>
              {message && (
                <p className="text-sm text-muted-foreground">{message}</p>
              )}
            </form>
          )}

          {/* Inline toast (bottom center) */}
          {toastOpen && toastText && (
            <div
              className={`fixed left-1/2 -translate-x-1/2 bottom-6 z-50 transition-all duration-200 ${
                toastOpen
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-2 pointer-events-none"
              }`}
              aria-live="polite"
              aria-atomic="true"
            >
              <div className="relative rounded-lg border border-error/50 bg-surface text-foreground shadow-md px-4 py-2 flex items-center gap-3 whitespace-nowrap">
                <div
                  className="absolute -top-2 left-6 h-0 w-0 border-l-6 border-r-6 border-b-6 border-transparent"
                  style={{ borderBottomColor: "var(--color-surface)" }}
                />
                <span
                  className="inline-flex items-center justify-center h-6 w-6 rounded text-white text-sm font-bold select-none"
                  style={{ background: "var(--color-warning)" }}
                  aria-hidden
                >
                  !
                </span>
                <span className="text-sm">{toastText}</span>
              </div>
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link className="text-secondary hover:underline" href="/login">
              Log in
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
