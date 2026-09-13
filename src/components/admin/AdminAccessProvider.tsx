"use client";

import { useSession } from "next-auth/react";
import { createContext, type ReactNode, useContext } from "react";

const AdminAccessContext = createContext<string | null>(null);

// Only the server admin layout supplies this identity, after checking the database.
// API routes still authorize each request independently.
export function AdminAccessProvider({ email, children }: { email: string; children: ReactNode }) {
  return (
    <AdminAccessContext.Provider value={email.trim().toLowerCase()}>
      {children}
    </AdminAccessContext.Provider>
  );
}

export function useAdminAccess() {
  const verifiedEmail = useContext(AdminAccessContext);
  const { data: session, status } = useSession();
  const email = session?.user?.email?.trim().toLowerCase() || null;

  return {
    email,
    status,
    isAdmin: status === "authenticated" && verifiedEmail !== null && email === verifiedEmail,
  };
}
