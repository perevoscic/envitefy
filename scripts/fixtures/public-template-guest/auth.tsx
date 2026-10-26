import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

let status = sessionStorage.getItem("guest-template:account") === "yes" ? "authenticated" : "unauthenticated";
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
const setStatus = (next: string) => { status = next; for (const listener of listeners) listener(); };
const account = { user: { id: "guest-template-account", email: "host@example.com" } };
export async function getSession() { return status === "authenticated" ? account : null; }
export function useSession() {
  const current = useSyncExternalStore(subscribe, () => status);
  return {
    status: current,
    data: current === "authenticated" ? account : null,
    update: async () => {
      setStatus("loading");
      await new Promise((resolve) => setTimeout(resolve, 30));
      sessionStorage.setItem("guest-template:account", "yes");
      setStatus("authenticated");
      return account;
    },
  };
}

export default function AuthModal({ open, mode, onClose, onModeChange, onAuthenticated, successRedirectUrl, description, action }: {
  open: boolean; mode: string; onClose: () => void; onAuthenticated?: () => Promise<void>;
  successRedirectUrl?: string; description?: string; action?: "save" | "publish";
  onModeChange?: (mode: "login" | "signup") => void;
}) {
  const [failure, setFailure] = useState("");
  if (!open) return null;
  const publish = action === "publish";
  return createPortal(<div role="dialog" aria-label="Account required" data-auth-return={successRedirectUrl} data-auth-action={action || "save"}
    style={{ position: "fixed", zIndex: 15000, inset: "20% 5% auto", padding: 24, background: "white", color: "black" }}>
    <p>{description}</p>
    {failure && <p role="alert">{failure}</p>}
    <button type="button" onClick={() => void onAuthenticated?.()}>{publish
      ? mode === "signup" ? "Create an account & publish" : "Sign in & publish"
      : `Complete ${mode === "signup" ? "account signup" : "login"}`}</button>
    <button type="button" onClick={() => { setFailure(""); onModeChange?.(mode === "signup" ? "login" : "signup"); }}>{mode === "signup" ? "Switch to sign in" : "Switch to create account"}</button>
    <button type="button" onClick={() => setFailure("Authentication failed. Your edits are still here.")}>Simulate failed authentication</button>
    <button type="button" onClick={() => {
      sessionStorage.setItem("guest-template:account", "yes");
      window.location.assign(successRedirectUrl || "/");
    }}>Complete Google redirect</button>
    <button type="button" onClick={onClose}>Close account dialog</button>
  </div>, document.body);
}
