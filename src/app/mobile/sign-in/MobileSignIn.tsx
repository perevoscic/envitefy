"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import LoginForm from "@/components/auth/LoginForm";
import SignupForm from "@/components/auth/SignupForm";
import { MOBILE_AUTH_SCHEME } from "@/lib/mobile-auth-contract";
import type { SignupIntent } from "@/lib/signup-intent";

export default function MobileSignIn({
  challenge,
  state,
  returnTo,
  initialMode,
  intent,
  calendar,
  calendarDone,
  calendarConnected,
}: {
  challenge: string;
  state: string;
  returnTo: string;
  initialMode: "login" | "signup";
  intent: SignupIntent;
  calendar: "google" | "outlook" | null;
  calendarDone: boolean;
  calendarConnected: boolean;
}) {
  const { data: session, status, update } = useSession();
  const [mode, setMode] = useState(initialMode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const callbackParams = new URLSearchParams({ challenge, state, returnTo, intent });
  if (calendar) callbackParams.set("calendar", calendar);
  const callbackUrl = `/mobile/sign-in?${callbackParams}`;
  const connectCalendar = () => {
    callbackParams.set("calendarDone", "1");
    const next = `/mobile/sign-in?${callbackParams}`;
    window.location.assign(`/api/${calendar}/auth?next=${encodeURIComponent(next)}`);
  };
  const finish = async () => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/mobile/auth/authorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challenge, state, returnTo }),
        credentials: "same-origin",
      });
      const body: { callback?: string; error?: string } = await response.json();
      if (!response.ok || !body.callback?.startsWith(`${MOBILE_AUTH_SCHEME}://auth/callback?`))
        throw new Error(body.error || "Unable to return to the app.");
      window.location.assign(body.callback);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="mx-auto w-full max-w-md px-5 py-10">
      <h1 className="text-2xl font-semibold">
        {session
          ? "Continue in Envitefy"
          : mode === "signup"
            ? "Create your Envitefy account"
            : "Sign in to Envitefy"}
      </h1>
      <p className="mb-6 mt-3 text-sm text-muted-foreground">
        Your account connects your events across the website and iPhone app.
      </p>
      {status === "loading" ? (
        <p role="status">Loading your account…</p>
      ) : session?.user ? (
        <div className="space-y-4">
          <p>
            Signed in as <strong>{session.user.email}</strong>.
          </p>
          {calendar ? (
            <div className="space-y-3">
              <p>
                {calendarDone
                  ? calendarConnected
                    ? "Your calendar is connected."
                    : "Calendar connection did not finish. You can try again."
                  : "Connect a calendar to this Envitefy account, then return to the app."}
              </p>
              {!calendarConnected ? (
                <button
                  type="button"
                  className="btn btn-outline min-h-11 w-full"
                  onClick={connectCalendar}
                >
                  Connect {calendar === "google" ? "Google Calendar" : "Outlook Calendar"}
                </button>
              ) : null}
            </div>
          ) : null}
          <button
            type="button"
            className="btn btn-primary min-h-11 w-full"
            disabled={busy}
            onClick={finish}
          >
            {busy ? "Opening…" : "Continue in Envitefy"}
          </button>
          <p className="text-sm text-muted-foreground">
            Continue only if you opened this screen from the Envitefy app. To use a different
            account, close this window and start sign-in again.
          </p>
        </div>
      ) : mode === "login" ? (
        <LoginForm
          successRedirectUrl={callbackUrl}
          onAuthenticated={async () => {
            await update();
          }}
          onSwitchMode={setMode}
        />
      ) : (
        <SignupForm
          successRedirectUrl={callbackUrl}
          signupSource={intent}
          signupIntent={intent}
          onAuthenticated={async () => {
            await update();
          }}
          onSwitchMode={setMode}
        />
      )}
      {error ? (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </main>
  );
}
