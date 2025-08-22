import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import AzureADProvider from "next-auth/providers/azure-ad";
import AppleProvider from "next-auth/providers/apple";

export const authOptions: NextAuthOptions = {
  debug: true,
  secret: process.env.NEXTAUTH_SECRET as string,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          access_type: "offline",
          response_type: "code",
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
    ...(process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET
      ? [
          AppleProvider({
            clientId: process.env.APPLE_CLIENT_ID as string,
            clientSecret: process.env.APPLE_CLIENT_SECRET as string,
          }),
        ]
      : []),
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
        t.providers.google = {
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at ? account.expires_at * 1000 : undefined,
        };
      }
      if (account?.provider === "azure-ad") {
        t.providers = t.providers || {};
        t.providers.microsoft = {
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at ? account.expires_at * 1000 : undefined,
        };
      }
      return t;
    },
    async session({ session, token }) {
      const providers = (token as any).providers || {};
      (session as any).providers = {
        google: Boolean(providers.google?.refreshToken || providers.google?.accessToken),
        microsoft: Boolean(
          providers.microsoft?.refreshToken || providers.microsoft?.accessToken
        ),
      };
      return session;
    },
  },
};

// In App Router with next-auth v4, create the route at
// `app/api/auth/[...nextauth]/route.ts` and pass these options.


