import { createContext, useSyncExternalStore } from "react";
let session = { user: { id: "unified-host", email: "unified-host@test.com" } };
export function setFixtureOwner(id: string) { session = { user: { id, email: `${id}@test.com` } }; window.dispatchEvent(new Event("fixture-auth-change")); }
export function fixtureOwner() { return session.user.id; }
const subscribe = (listener: () => void) => { window.addEventListener("fixture-auth-change", listener); return () => window.removeEventListener("fixture-auth-change", listener); };
export const SessionContext = createContext({ data: session, status: "authenticated" });
export function useSession() { const current = useSyncExternalStore(subscribe, () => session); return { data: current, status: "authenticated", update: async () => session }; }
export async function getSession() { return session; }
export function useSidebar() { return { setEventEditAction() {} }; }
export default function AuthModal() { return null; }
