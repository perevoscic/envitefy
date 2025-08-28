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
  const [showEmailForm, setShowEmailForm] = useState(true);
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
              <span className="block text-3xl md:text-4xl pb-2">
                <span className="font-pacifico">Snap</span>
                <span> </span>
                <span className="font-montserrat">My Date</span>
              </span>
            </h1>
            <p className="text-base md:text-lg text-foreground/70 text-center">
              From papers to reminders.
            </p>
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
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-2 my-auto h-8 w-8 rounded-full text-muted-foreground hover:bg-foreground/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-5 w-5 mx-auto"
                  >
                    {showPassword ? (
                      <>
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M5.91444 7.59106C4.3419 9.04124 3.28865 10.7415 2.77052 11.6971C2.66585 11.8902 2.66585 12.1098 2.77052 12.3029C3.28865 13.2585 4.3419 14.9588 5.91444 16.4089C7.48195 17.8545 9.50572 19 12 19C14.4943 19 16.518 17.8545 18.0855 16.4089C19.6581 14.9588 20.7113 13.2585 21.2295 12.3029C21.3341 12.1098 21.3341 11.8902 21.2295 11.6971C20.7113 10.7415 19.6581 9.04124 18.0855 7.59105C16.518 6.1455 14.4943 5 12 5C9.50572 5 7.48195 6.1455 5.91444 7.59106ZM4.55857 6.1208C6.36059 4.45899 8.84581 3 12 3C15.1542 3 17.6394 4.45899 19.4414 6.1208C21.2384 7.77798 22.4152 9.68799 22.9877 10.7438C23.4147 11.5315 23.4147 12.4685 22.9877 13.2562C22.4152 14.312 21.2384 16.222 19.4414 17.8792C17.6394 19.541 15.1542 21 12 21C8.84581 21 6.36059 19.541 4.55857 17.8792C2.76159 16.222 1.58478 14.312 1.01232 13.2562C0.58525 12.4685 0.585249 11.5315 1.01232 10.7438C1.58478 9.688 2.76159 7.77798 4.55857 6.1208ZM12 9.5C10.6193 9.5 9.49999 10.6193 9.49999 12C9.49999 13.3807 10.6193 14.5 12 14.5C13.3807 14.5 14.5 13.3807 14.5 12C14.5 10.6193 13.3807 9.5 12 9.5ZM7.49999 12C7.49999 9.51472 9.51471 7.5 12 7.5C14.4853 7.5 16.5 9.51472 16.5 12C16.5 14.4853 14.4853 16.5 12 16.5C9.51471 16.5 7.49999 14.4853 7.49999 12Z"
                          fill="currentColor"
                        />
                        <path
                          d="M3 3L21 21"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </>
                    ) : (
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M5.91444 7.59106C4.3419 9.04124 3.28865 10.7415 2.77052 11.6971C2.66585 11.8902 2.66585 12.1098 2.77052 12.3029C3.28865 13.2585 4.3419 14.9588 5.91444 16.4089C7.48195 17.8545 9.50572 19 12 19C14.4943 19 16.518 17.8545 18.0855 16.4089C19.6581 14.9588 20.7113 13.2585 21.2295 12.3029C21.3341 12.1098 21.3341 11.8902 21.2295 11.6971C20.7113 10.7415 19.6581 9.04124 18.0855 7.59105C16.518 6.1455 14.4943 5 12 5C9.50572 5 7.48195 6.1455 5.91444 7.59106ZM4.55857 6.1208C6.36059 4.45899 8.84581 3 12 3C15.1542 3 17.6394 4.45899 19.4414 6.1208C21.2384 7.77798 22.4152 9.68799 22.9877 10.7438C23.4147 11.5315 23.4147 12.4685 22.9877 13.2562C22.4152 14.312 21.2384 16.222 19.4414 17.8792C17.6394 19.541 15.1542 21 12 21C8.84581 21 6.36059 19.541 4.55857 17.8792C2.76159 16.222 1.58478 14.312 1.01232 13.2562C0.58525 12.4685 0.585249 11.5315 1.01232 10.7438C1.58478 9.688 2.76159 7.77798 4.55857 6.1208ZM12 9.5C10.6193 9.5 9.49999 10.6193 9.49999 12C9.49999 13.3807 10.6193 14.5 12 14.5C13.3807 14.5 14.5 13.3807 14.5 12C14.5 10.6193 13.3807 9.5 12 9.5ZM7.49999 12C7.49999 9.51472 9.51471 7.5 12 7.5C14.4853 7.5 16.5 9.51472 16.5 12C16.5 14.4853 14.4853 16.5 12 16.5C9.51471 16.5 7.49999 14.4853 7.49999 12Z"
                        fill="currentColor"
                      />
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
                  aria-pressed={showConfirmPassword}
                  className="absolute inset-y-0 right-2 my-auto h-8 w-8 rounded-full text-muted-foreground hover:bg-foreground/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-5 w-5 mx-auto"
                  >
                    {showConfirmPassword ? (
                      <>
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M5.91444 7.59106C4.3419 9.04124 3.28865 10.7415 2.77052 11.6971C2.66585 11.8902 2.66585 12.1098 2.77052 12.3029C3.28865 13.2585 4.3419 14.9588 5.91444 16.4089C7.48195 17.8545 9.50572 19 12 19C14.4943 19 16.518 17.8545 18.0855 16.4089C19.6581 14.9588 20.7113 13.2585 21.2295 12.3029C21.3341 12.1098 21.3341 11.8902 21.2295 11.6971C20.7113 10.7415 19.6581 9.04124 18.0855 7.59105C16.518 6.1455 14.4943 5 12 5C9.50572 5 7.48195 6.1455 5.91444 7.59106ZM4.55857 6.1208C6.36059 4.45899 8.84581 3 12 3C15.1542 3 17.6394 4.45899 19.4414 6.1208C21.2384 7.77798 22.4152 9.68799 22.9877 10.7438C23.4147 11.5315 23.4147 12.4685 22.9877 13.2562C22.4152 14.312 21.2384 16.222 19.4414 17.8792C17.6394 19.541 15.1542 21 12 21C8.84581 21 6.36059 19.541 4.55857 17.8792C2.76159 16.222 1.58478 14.312 1.01232 13.2562C0.58525 12.4685 0.585249 11.5315 1.01232 10.7438C1.58478 9.688 2.76159 7.77798 4.55857 6.1208ZM12 9.5C10.6193 9.5 9.49999 10.6193 9.49999 12C9.49999 13.3807 10.6193 14.5 12 14.5C13.3807 14.5 14.5 13.3807 14.5 12C14.5 10.6193 13.3807 9.5 12 9.5ZM7.49999 12C7.49999 9.51472 9.51471 7.5 12 7.5C14.4853 7.5 16.5 9.51472 16.5 12C16.5 14.4853 14.4853 16.5 12 16.5C9.51471 16.5 7.49999 14.4853 7.49999 12Z"
                          fill="currentColor"
                        />
                        <path
                          d="M3 3L21 21"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </>
                    ) : (
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M5.91444 7.59106C4.3419 9.04124 3.28865 10.7415 2.77052 11.6971C2.66585 11.8902 2.66585 12.1098 2.77052 12.3029C3.28865 13.2585 4.3419 14.9588 5.91444 16.4089C7.48195 17.8545 9.50572 19 12 19C14.4943 19 16.518 17.8545 18.0855 16.4089C19.6581 14.9588 20.7113 13.2585 21.2295 12.3029C21.3341 12.1098 21.3341 11.8902 21.2295 11.6971C20.7113 10.7415 19.6581 9.04124 18.0855 7.59105C16.518 6.1455 14.4943 5 12 5C9.50572 5 7.48195 6.1455 5.91444 7.59106ZM4.55857 6.1208C6.36059 4.45899 8.84581 3 12 3C15.1542 3 17.6394 4.45899 19.4414 6.1208C21.2384 7.77798 22.4152 9.68799 22.9877 10.7438C23.4147 11.5315 23.4147 12.4685 22.9877 13.2562C22.4152 14.312 21.2384 16.222 19.4414 17.8792C17.6394 19.541 15.1542 21 12 21C8.84581 21 6.36059 19.541 4.55857 17.8792C2.76159 16.222 1.58478 14.312 1.01232 13.2562C0.58525 12.4685 0.585249 11.5315 1.01232 10.7438C1.58478 9.688 2.76159 7.77798 4.55857 6.1208ZM12 9.5C10.6193 9.5 9.49999 10.6193 9.49999 12C9.49999 13.3807 10.6193 14.5 12 14.5C13.3807 14.5 14.5 13.3807 14.5 12C14.5 10.6193 13.3807 9.5 12 9.5ZM7.49999 12C7.49999 9.51472 9.51471 7.5 12 7.5C14.4853 7.5 16.5 9.51472 16.5 12C16.5 14.4853 14.4853 16.5 12 16.5C9.51471 16.5 7.49999 14.4853 7.49999 12Z"
                        fill="currentColor"
                      />
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
