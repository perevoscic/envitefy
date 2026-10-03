"use client";
import { AlertCircle, Clock, Loader2, Lock, Mail, ShieldCheck, UserPlus } from "lucide-react";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import AuthModal from "@/components/auth/AuthModal";
import EnvitefyWordmark from "@/components/branding/EnvitefyWordmark";

type Invitation = {
  title: string;
  ownerName: string;
  email: string;
  available: boolean;
  accepted: boolean;
  acceptedByCurrentUser: boolean;
  href: string | null;
  signedInEmail: string | null;
};
const button =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:opacity-50";
const primary = "bg-slate-900 text-white hover:bg-slate-800";
const secondary = "border border-slate-300 bg-white text-slate-800 shadow-sm hover:bg-slate-50";
export default function CoHostInvitation() {
  const [token, setToken] = useState("");
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  async function load(value: string, accept = false) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/cohost-invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: value, action: accept ? "accept" : "inspect" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "The invitation could not be loaded.");
      if (accept) window.location.assign(result.href);
      else setInvitation(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The invitation could not be loaded.");
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    const value =
      window.location.hash.slice(1) || sessionStorage.getItem("envitefy:cohost-invitation") || "";
    if (value) sessionStorage.setItem("envitefy:cohost-invitation", value);
    window.history.replaceState(window.history.state, "", window.location.pathname);
    setToken(value);
    void load(value);
  }, []);
  const wrongAccount =
    invitation?.signedInEmail &&
    invitation.signedInEmail.toLowerCase() !== invitation.email.toLowerCase();
  const returnPath = `/cohost-invite#${token}`;
  return (
    <main className="flex min-h-[100dvh] w-full flex-col items-center justify-center bg-slate-50 px-4 py-12 text-slate-950">
      <a
        href="/"
        aria-label="Envitefy home"
        className="mb-6 rounded-lg px-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
      >
        <EnvitefyWordmark scaled={false} className="text-[2rem]" />
      </a>
      <section className="w-full max-w-[28rem] overflow-hidden rounded-2xl bg-white shadow-[0_24px_70px_-24px_rgba(15,23,42,0.28)] ring-1 ring-slate-900/[0.08]">
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-3.5">
            <span
              aria-hidden="true"
              className="grid size-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm"
            >
              <UserPlus size={18} />
            </span>
            <div className="min-w-0">
              <h1 className="text-[17px] font-semibold leading-6 tracking-tight">
                Co-host invitation
              </h1>
              <p className="mt-0.5 text-[13px] leading-5 text-slate-500">
                {invitation ? (
                  <>
                    {invitation.ownerName} invited you to co-host{" "}
                    <span className="font-medium text-slate-800">{invitation.title}</span>.
                  </>
                ) : (
                  "Help run an event on Envitefy as a co-host."
                )}
              </p>
            </div>
          </div>
          {busy && (
            <p role="status" className="mt-5 flex items-center gap-2 text-[13px] text-slate-500">
              <Loader2
                size={15}
                className="animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
              {invitation ? "Accepting invitation…" : "Loading invitation…"}
            </p>
          )}
          {invitation && (
            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-slate-200">
                <div className="flex items-center gap-3 px-3.5 py-3">
                  <Mail size={16} aria-hidden="true" className="shrink-0 text-slate-400" />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">Invited email</p>
                    <p className="break-words text-sm font-medium text-slate-900">
                      {invitation.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 border-t border-slate-200 px-3.5 py-3">
                  <ShieldCheck
                    size={16}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-slate-400"
                  />
                  <p className="text-[13px] leading-5 text-slate-600">
                    You can edit the event and Live Card, save and publish changes, and manage RSVPs
                    and guest messages.
                  </p>
                </div>
              </div>
              {invitation.acceptedByCurrentUser && invitation.href ? (
                <a href={invitation.href} className={`${button} ${primary} w-full`}>
                  Open event workspace
                </a>
              ) : !invitation.available ? (
                <p
                  role="status"
                  className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] text-slate-700"
                >
                  <Clock size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                  This invitation has expired or has already been used. Ask the owner to send a new
                  invitation.
                </p>
              ) : wrongAccount ? (
                <>
                  <p
                    role="alert"
                    className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-800"
                  >
                    <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                    <span className="min-w-0 break-words">
                      You’re signed in as {invitation.signedInEmail}. Sign in with{" "}
                      {invitation.email} to accept.
                    </span>
                  </p>
                  <button
                    type="button"
                    className={`${button} ${primary} w-full`}
                    onClick={() => {
                      void (async () => {
                        await signOut({ redirect: false });
                        await load(token);
                        setMode("login");
                        setAuthOpen(true);
                      })();
                    }}
                  >
                    Switch account
                  </button>
                </>
              ) : invitation.signedInEmail ? (
                <button
                  type="button"
                  disabled={busy}
                  className={`${button} ${primary} w-full`}
                  onClick={() => void load(token, true)}
                >
                  Accept invitation
                </button>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    className={`${button} ${primary}`}
                    onClick={() => {
                      setMode("login");
                      setAuthOpen(true);
                    }}
                  >
                    Sign in to accept
                  </button>
                  <button
                    type="button"
                    className={`${button} ${secondary}`}
                    onClick={() => {
                      setMode("signup");
                      setAuthOpen(true);
                    }}
                  >
                    Create an account
                  </button>
                </div>
              )}
            </div>
          )}
          {error && (
            <div className="mt-5 space-y-3">
              <p
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-800"
              >
                <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                {error}
              </p>
              <button
                type="button"
                disabled={busy}
                className={`${button} ${secondary} w-full`}
                onClick={() => void load(token)}
              >
                Try again
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 border-t border-slate-200 bg-slate-50/80 px-5 py-3 text-xs text-slate-500 sm:px-6">
          <Lock size={13} className="shrink-0" aria-hidden="true" />
          Access applies only to this event.
        </div>
        <AuthModal
          open={authOpen}
          mode={mode}
          onModeChange={setMode}
          onClose={() => setAuthOpen(false)}
          successRedirectUrl={returnPath}
          onAuthenticated={async () => {
            setAuthOpen(false);
            await load(token);
          }}
          description={
            invitation ? `Use ${invitation.email} to accept this event invitation.` : undefined
          }
        />
      </section>
    </main>
  );
}
