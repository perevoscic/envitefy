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
        router.replace("/");
        return;
      }
      setMessage("Invalid email or password");
      setShake(true);
      setTimeout(() => setShake(false), 320);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-3" onSubmit={onEmailSubmit}>
      <input
        id="login-email-input"
        type="email"
        className="w-full border border-border bg-surface text-foreground p-2 rounded"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <div className="relative">
        <input
          id="login-password-input"
          type={showPassword ? "text" : "password"}
          className={`w-full border border-border bg-surface text-foreground p-2 rounded pr-10${
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
        className="w-1/2 block mx-auto px-4 py-2 rounded-2xl bg-[#A259FF] text-white disabled:opacity-70"
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
