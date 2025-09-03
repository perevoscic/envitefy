import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getUserByEmail, verifyPassword } from "@/lib/db";

/**
 * Build-time safe getter.
 * - Does NOT throw at module import (so GitHub build succeeds even without envs).
 * - Provides a dev fallback secret only when NOT production.
 * - In production at runtime, NextAuth itself will error if secret is missing.
 */
export function getAuthOptions(): NextAuthOptions {
  const secret =
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    (process.env.NODE_ENV === "production" ? undefined : "dev-build-secret");

  return {
    debug: false,
    // Passing undefined is allowed at type level; NextAuth will require it at runtime in prod.
    secret,
    providers: [
      CredentialsProvider({
        name: "Email and Password",
        credentials: {
          email: { label: "Email", type: "text" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
          try {
            const email = credentials?.email || "";
            const password = credentials?.password || "";
            if (!email || !password) return null;
            const user = await getUserByEmail(email);
            if (!user) return null;
            const ok = await verifyPassword(password, user.password_hash);
            if (!ok) return null;
            return {
              id: user.id,
              email: user.email,
              name:
                [user.first_name, user.last_name].filter(Boolean).join(" ") ||
                user.email,
            } as any;
          } catch {
            return null;
          }
        },
      }),
    ],
    session: { strategy: "jwt" },
    pages: {
      signIn: "/landing",
      verifyRequest: "/verify-request",
    },
    callbacks: {},
  };
}
export const authOptions = getAuthOptions();
