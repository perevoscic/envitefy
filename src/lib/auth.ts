import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getUserByEmail, verifyPassword } from "@/lib/db";

const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
if (!secret) {
  throw new Error("Missing AUTH_SECRET / NEXTAUTH_SECRET");
}

export const authOptions: NextAuthOptions = {
  debug: false,              // quieter logs in prod
  secret,                    // <- works with either env name
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

// In App Router with next-auth v4, create the route at
// `app/api/auth/[...nextauth]/route.ts` and pass these options.


