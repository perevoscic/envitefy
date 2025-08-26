import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import AzureADProvider from "next-auth/providers/azure-ad";
import AppleProvider from "next-auth/providers/apple";
import { getAppleClientSecretCached } from "@/lib/apple";
import {
  saveMicrosoftRefreshToken,
  saveGoogleRefreshToken,
  getUserByEmail,
  verifyPassword,
} from "@/lib/supabase";

const appleClientId = process.env.APPLE_CLIENT_ID as string | undefined;
const appleSecretEnv = process.env.APPLE_CLIENT_SECRET as string | undefined;
const canSignAppleDynamically = Boolean(
  process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY
);

// Generate Apple client secret once per server start if env vars are present
let generatedAppleClientSecret: string | undefined;
if (!appleSecretEnv && appleClientId && canSignAppleDynamically) {
  try {
    // Top-level await supported in Next.js server modules
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    generatedAppleClientSecret = await getAppleClientSecretCached();
  } catch (err) {
    console.warn("Failed to generate Apple client secret:", err);
  }
}

export const authOptions: NextAuthOptions = {
  debug: true,
  secret: process.env.NEXTAUTH_SECRET as string,
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
            name: [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email,
          } as any;
        } catch {
          return null;
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          access_type: "offline",
          include_granted_scopes: true,
          prompt: "consent",
          scope:
            "openid email profile https://www.googleapis.com/auth/calendar.events",
        },
      },
    }),
    AzureADProvider({
      clientId: process.env.OUTLOOK_CLIENT_ID as string,
      clientSecret: process.env.OUTLOOK_CLIENT_SECRET as string,
      tenantId: (process.env.OUTLOOK_TENANT_ID as string) || "common",
      authorization: {
        params: {
          scope: "openid email profile offline_access Calendars.ReadWrite",
          response_type: "code",
        },
      },
    }),
    ...(
      appleClientId && (appleSecretEnv || generatedAppleClientSecret)
        ? [
            AppleProvider({
              clientId: appleClientId,
              clientSecret: (appleSecretEnv || generatedAppleClientSecret) as string,
            }),
          ]
        : []
    ),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    verifyRequest: "/verify-request",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      const t: any = token as any;
      if (account?.provider === "google") {
        t.providers = t.providers || {};
        // Persist Google refresh token in Supabase; avoid losing it on other provider sign-ins
        try {
          if (account.refresh_token && (t.email || (profile as any)?.email)) {
            const email = (t.email as string) || ((profile as any)?.email as string);
            if (email) await saveGoogleRefreshToken(email, account.refresh_token);
          }
        } catch {}
        const prev = t.providers.google || {};
        t.providers.google = {
          accessToken: account.access_token || prev.accessToken,
          refreshToken: account.refresh_token || prev.refreshToken,
          expiresAt: account.expires_at ? account.expires_at * 1000 : prev.expiresAt,
          connected: true,
        } as any;
      }
      if (account?.provider === "azure-ad") {
        t.providers = t.providers || {};
        // Persist the refresh token securely in Supabase; don't store it in the JWT
        try {
          if (account.refresh_token && (t.email || (profile as any)?.email)) {
            const email = (t.email as string) || ((profile as any)?.email as string);
            if (email) await saveMicrosoftRefreshToken(email, account.refresh_token);
          }
        } catch {}
        // Keep connection flag, and in dev/fallback also carry refreshToken in JWT for convenience
        const prev = (t.providers as any).microsoft || {};
        const nextMs: any = { connected: true };
        if (account.refresh_token) nextMs.refreshToken = account.refresh_token;
        else if (prev.refreshToken) nextMs.refreshToken = prev.refreshToken;
        t.providers.microsoft = nextMs;
      }
      if (account?.provider === "apple") {
        t.providers = t.providers || {};
        t.providers.apple = { connected: true } as any;
      }
      return t;
    },
    async session({ session, token }) {
      const providers = (token as any).providers || {};
      (session as any).providers = {
        google: Boolean(
          providers.google?.connected ||
          providers.google?.refreshToken ||
          providers.google?.accessToken
        ),
        microsoft: Boolean(providers.microsoft?.connected),
        apple: Boolean(providers.apple?.connected),
      };
      return session;
    },
  },
};

// In App Router with next-auth v4, create the route at
// `app/api/auth/[...nextauth]/route.ts` and pass these options.


