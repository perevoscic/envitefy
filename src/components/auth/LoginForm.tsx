"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export type LoginFormProps = {
  onSuccess?: () => void;
  onSwitchMode?: (mode: "login" | "signup") => void;
};

export default function LoginForm({ onSuccess, onSwitchMode }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const onEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/",
      });
      if (result?.ok) {
        onSuccess?.();
        // Force a full page reload to ensure session is available
        window.location.href = "/";
        return;
      }
      setMessage("Invalid email or password");
      setShake(true);
      setTimeout(() => setShake(false), 320);
    } finally {
      setSubmitting(false);
    }
  };

  const onGoogleSignIn = async () => {
    setSubmitting(true);
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch (err) {
      console.error("Google sign-in error:", err);
      setMessage("Failed to sign in with Google");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      id="login-form"
      name="login"
      className="space-y-3"
      onSubmit={onEmailSubmit}
      autoComplete="on"
      method="post"
      action="#"
    >
      <button
        type="button"
        onClick={onGoogleSignIn}
        disabled={submitting}
        className="btn btn-outline w-full justify-center gap-3"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M17.64 9.20443C17.64 8.56625 17.5827 7.95262 17.4764 7.36353H9V10.8449H13.8436C13.635 11.9699 13.0009 12.9231 12.0477 13.5613V15.8194H14.9564C16.6582 14.2526 17.64 11.9453 17.64 9.20443Z"
            fill="#4285F4"
          />
          <path
            d="M8.99976 18C11.4298 18 13.467 17.1941 14.9561 15.8195L12.0475 13.5613C11.2416 14.1013 10.2107 14.4204 8.99976 14.4204C6.65567 14.4204 4.67158 12.8372 3.96385 10.71H0.957031V13.0418C2.43794 15.9831 5.48158 18 8.99976 18Z"
            fill="#34A853"
          />
          <path
            d="M3.96409 10.7098C3.78409 10.1698 3.68182 9.59301 3.68182 8.99983C3.68182 8.40664 3.78409 7.82983 3.96409 7.28983V4.95801H0.957273C0.347727 6.17301 0 7.54755 0 8.99983C0 10.4521 0.347727 11.8266 0.957273 13.0416L3.96409 10.7098Z"
            fill="#FBBC05"
          />
          <path
            d="M8.99976 3.57955C10.3211 3.57955 11.5075 4.03364 12.4402 4.92545L15.0216 2.34409C13.4629 0.891818 11.4257 0 8.99976 0C5.48158 0 2.43794 2.01682 0.957031 4.95818L3.96385 7.29C4.67158 5.16273 6.65567 3.57955 8.99976 3.57955Z"
            fill="#EA4335"
          />
        </svg>
        Sign in with Google
      </button>

      <div className="relative flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-border"></div>
        <span className="text-sm text-muted-foreground">or</span>
        <div className="flex-1 h-px bg-border"></div>
      </div>

      <input
        id="login-email-input"
        name="email"
        type="email"
        autoComplete="username"
        className="w-full rounded-xl border border-border/80 bg-white/80 px-4 py-3 text-sm text-foreground/90 shadow-inner focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)] transition"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <div className="relative">
        <input
          id="login-password-input"
          name="password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          data-form-type="login"
          className={`w-full rounded-xl border border-border/80 bg-white/80 px-4 py-3 pr-12 text-sm text-foreground/90 shadow-inner focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)] transition${
            message ? " input-error" : ""
          }${shake ? " input-shake" : ""}`}
          placeholder="Password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (message) setMessage(null);
          }}
          aria-invalid={message ? true : false}
          required
        />
        <button
          type="button"
          aria-label={showPassword ? "Hide password" : "Show password"}
          aria-pressed={showPassword}
          className="absolute inset-y-0 right-3 my-auto flex h-9 w-9 items-center justify-center wedding-icon-button text-muted-foreground/80 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-secondary)] z-10"
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
      <div className="text-right">
        <p className="text-center text-sm text-muted-foreground">
          Having trouble signing in?{" "}
          <Link href="/forgot" className="text-secondary hover:underline">
            Reset password
          </Link>
        </p>
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="btn btn-primary w-full justify-center"
      >
        {submitting ? "Signing in..." : "Sign in"}
      </button>
      <p className="text-center text-sm text-muted-foreground">
        Don't have an account yet?{" "}
        <button
          type="button"
          onClick={() => onSwitchMode?.("signup")}
          className="text-secondary hover:underline"
        >
          Sign up
        </button>
      </p>
      {message && <p className="text-sm text-error font-medium">{message}</p>}
    </form>
  );
}
