import { createContext } from "react";
export const SessionContext = createContext({ data: null, status: "unauthenticated" });
export function useSession() {
  const signedOut = new URLSearchParams(window.location.search).has("signedOut");
  return {
    data: signedOut ? null : { user: { id: "qa-host", email: "host@test.com" } },
    status: signedOut ? "unauthenticated" : "authenticated",
    update: async () => {},
  };
}
export function useSidebar() {
  return { setEventEditAction() {} };
}
export default function AuthModal() {
  return null;
}
