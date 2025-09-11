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
    useSecureCookies: true,  // Force non-secure cookies for local dev consistency
    providers: [
      CredentialsProvider({
        name: "Email and Password",
        credentials: {
          email: { label: "Email", type: "text" },
          password: { label: "Password", type: "password" },
        },
// src/lib/auth.ts (only the authorize function body changed)
async authorize(credentials) {
  const email = (credentials?.email || "").toLowerCase();
  const password = credentials?.password || "";
  try {
    console.log("[auth] credentials sign-in start", { email });

    if (!email || !password) {
      console.warn("[auth] missing email/password");
      return null;
    }

    const user = await getUserByEmail(email);
    console.log("[auth] getUserByEmail result", { found: !!user });

    if (!user) {
      console.warn("[auth] user not found");
      return null;
    }

    const ok = await verifyPassword(password, user.password_hash);
    console.log("[auth] password check", { ok });

    if (!ok) {
      console.warn("[auth] bad password");
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email,
    } as any;
  } catch (err: any) {
    console.error("[auth] authorize error", { message: err?.message, code: err?.code, stack: err?.stack });
    // Returning null triggers CredentialsSignin (401). We just want the *server log* details.
    return null;
  }
}

      }),
    ],
    session: { strategy: "jwt" },
    pages: { signIn: "/landing", verifyRequest: "/verify-request" },
    callbacks: {},
  };
}

export const authOptions = getAuthOptions();
