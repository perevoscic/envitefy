import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getUserByEmail, verifyPassword } from "@/lib/db";

export function getAuthOptions(): NextAuthOptions {
  const secret =
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    (process.env.NODE_ENV === "production" ? undefined : "dev-build-secret");

  return {
    debug: true,              // TEMP: leave on while debugging
    secret,
    useSecureCookies: true,
    providers: [
      CredentialsProvider({
        name: "Email and Password",
        credentials: {
          email: { label: "Email", type: "text" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
          const email = credentials?.email?.trim() || "";
          const password = credentials?.password || "";

          if (!email || !password) {
            console.error("[auth] missing email/password");
            return null;
          }

          console.log("[auth] authorize start", { email });

          try {
            const user = await getUserByEmail(email);
            if (!user) {
              console.warn("[auth] user not found", { email });
              return null;
            }

            if (!user.password_hash) {
              console.error("[auth] user has no password_hash", { userId: user.id });
              return null;
            }

            let ok = false;
            try {
              ok = await verifyPassword(password, user.password_hash);
            } catch (e) {
              console.error("[auth] verifyPassword threw", e);
              return null;
            }

            if (!ok) {
              console.warn("[auth] bad password", { email });
              return null;
            }

            console.log("[auth] authorize success", { userId: user.id });
            return {
              id: user.id,
              email: user.email,
              name: [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email,
            } as any;
          } catch (err) {
            console.error("[auth] authorize threw", err);
            return null;
          }
        },
      }),
    ],
    session: { strategy: "jwt" },
    pages: { signIn: "/landing", verifyRequest: "/verify-request" },
    callbacks: {},
  };
}

export const authOptions = getAuthOptions();
