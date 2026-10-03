"use client";
import { Loader2, UserPlus } from "lucide-react";
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
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:opacity-50";
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
    <main className="mx-auto flex min-h-[75dvh] max-w-xl items-center px-4 py-10">
      <section className="w-full rounded-3xl border border-violet-100 bg-white p-6 text-slate-950 shadow-xl sm:p-8">
        <EnvitefyWordmark className="text-4xl" />
        <div className="mt-7 flex items-center gap-3">
          <UserPlus className="text-violet-700" aria-hidden="true" />
          <h1 className="text-2xl font-semibold">Co-host invitation</h1>
        </div>
        {busy && (
          <p role="status" className="mt-5 flex items-center gap-2">
            <Loader2
              size={18}
              className="animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
            {invitation ? "Accepting invitation…" : "Loading invitation…"}
          </p>
        )}
        {invitation && (
          <div className="mt-5 space-y-4">
            <p>
              {invitation.ownerName} invited you to co-host <strong>{invitation.title}</strong>.
            </p>
            <p className="text-sm leading-relaxed text-slate-600">
              You can edit the event and Live Card, save and publish changes, and manage RSVPs and
              guest messages. Access applies only to this event.
            </p>
            <p className="break-words text-sm text-slate-600">
              Invited email: <strong>{invitation.email}</strong>
            </p>
            {invitation.acceptedByCurrentUser && invitation.href ? (
              <a href={invitation.href} className={`${button} bg-violet-700 text-white`}>
                Open event workspace
              </a>
            ) : !invitation.available ? (
              <p role="status" className="text-sm text-slate-700">
                This invitation has expired or has already been used. Ask the owner to send a new
                invitation.
              </p>
            ) : wrongAccount ? (
              <>
                <p role="alert" className="text-sm text-rose-700">
                  You’re signed in as {invitation.signedInEmail}. Sign in with {invitation.email} to
                  accept.
                </p>
                <button
                  type="button"
                  className={`${button} bg-violet-700 text-white`}
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
                className={`${button} w-full bg-violet-700 text-white`}
                onClick={() => void load(token, true)}
              >
                Accept invitation
              </button>
            ) : (
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className={`${button} bg-violet-700 text-white`}
                  onClick={() => {
                    setMode("login");
                    setAuthOpen(true);
                  }}
                >
                  Sign in to accept
                </button>
                <button
                  type="button"
                  className={`${button} border border-violet-300 text-violet-700`}
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
          <div className="mt-4">
            <p role="alert" className="text-sm text-rose-700">
              {error}
            </p>
            <button
              type="button"
              disabled={busy}
              className={`${button} mt-2 text-violet-700`}
              onClick={() => void load(token)}
            >
              Try again
            </button>
          </div>
        )}
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
