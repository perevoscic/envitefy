import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { getUserByEmail, verifyPassword, getIsAdminByEmail, createOrUpdateOAuthUser, saveGoogleRefreshToken, getGoogleRefreshToken, getMicrosoftRefreshToken } from "@/lib/db";

function isTransientDbError(err: unknown): boolean {
  const anyErr = err as any;
  const code = String(anyErr?.code || "");
  const message = String(anyErr?.message || "");
  return (
    ["ENOTFOUND", "ETIMEDOUT", "ECONNREFUSED", "ECONNRESET", "EHOSTUNREACH", "ENETUNREACH"].includes(code) ||
    /getaddrinfo|timeout|refused|not known/i.test(message)
  );
}

export function getAuthOptions(): NextAuthOptions {
  const authDebugEnabled = process.env.AUTH_DEBUG === "1";
  const secret =
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    // Fallback to a dev-only secret to avoid hard crashes during local prod builds/start.
    "dev-build-secret";

  if (
    process.env.NODE_ENV === "production" &&
    !process.env.AUTH_SECRET &&
    !process.env.NEXTAUTH_SECRET
  ) {
    console.warn(
      "[auth] Missing AUTH_SECRET/NEXTAUTH_SECRET; using dev-build-secret fallback. Set a real secret in production."
    );
  }

  return {
    debug: authDebugEnabled,
    secret,
    // Secure cookies only in production/HTTPS; localhost (http) must be non-secure
    useSecureCookies: process.env.NODE_ENV === "production",
    providers: [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        authorization: {
          params: {
            prompt: "consent",
            access_type: "offline",
            response_type: "code",
          },
        },
      }),
      CredentialsProvider({
        name: "Email and Password",
        credentials: {
          email: { label: "Email", type: "text" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
          const email = (credentials?.email || "").toLowerCase();
          const password = credentials?.password || "";
          try {
            if (authDebugEnabled) {
              console.log("[auth] credentials sign-in start", { email });
            }

            if (!email || !password) {
              console.warn("[auth] missing email/password");
              return null;
            }

            const user = await getUserByEmail(email);
            if (authDebugEnabled) {
              console.log("[auth] getUserByEmail result", { found: !!user });
            }

            if (!user) {
              console.warn("[auth] user not found");
              return null;
            }

            const ok = await verifyPassword(password, user.password_hash);
            if (authDebugEnabled) {
              console.log("[auth] password check", { ok });
            }

            if (!ok) {
              console.warn("[auth] bad password");
              return null;
            }

            return {
              id: user.id,
              email: user.email,
              name:
                [user.first_name, user.last_name].filter(Boolean).join(" ") ||
                user.email,
            } as any;
          } catch (err: any) {
            console.error("[auth] authorize error", {
              message: err?.message,
              code: err?.code,
              stack: err?.stack,
            });
            // Returning null triggers CredentialsSignin (401). We just want the *server log* details.
            return null;
          }
        },
      }),
    ],
    session: { strategy: "jwt" },
    pages: { signIn: "/", verifyRequest: "/verify-request" },
    callbacks: {
      async signIn({ user, account, profile }) {
        try {
          // Handle OAuth sign-ins (Google, etc.)
          if (account?.provider === "google" && user?.email) {
            if (authDebugEnabled) {
              console.log("[auth] Google sign-in", { email: user.email });
            }
            
            // Create or update user in database
            const firstName = (profile as any)?.given_name || user.name?.split(" ")[0] || null;
            const lastName = (profile as any)?.family_name || user.name?.split(" ").slice(1).join(" ") || null;
            
            await createOrUpdateOAuthUser({
              email: user.email,
              firstName,
              lastName,
              provider: "google",
            });
            
            return true;
          }
          return true;
        } catch (err) {
          console.error("[auth] signIn callback error", err);
          return false;
        }
      },
      async jwt({ token, user, account }) {
        try {
          const email = (user?.email as string) || (token?.email as string) || null;
          const tokenAny = token as any;
          tokenAny.providers = tokenAny.providers || {};

          // Keep admin claims in sync with DB changes (e.g. user promoted while still logged in).
          // We refresh periodically instead of only once to avoid stale JWT claims.
          const now = Date.now();
          const ADMIN_CLAIM_REFRESH_MS = 15 * 60 * 1000;
          const PROVIDER_TOKEN_REFRESH_MS = 60 * 60 * 1000;
          const lastAdminCheckAt =
            typeof tokenAny?.isAdminCheckedAt === "number"
              ? tokenAny.isAdminCheckedAt
              : 0;
          const shouldRefreshAdminClaim =
            !email ||
            tokenAny.isAdmin === undefined ||
            now - lastAdminCheckAt > ADMIN_CLAIM_REFRESH_MS;

          if (email && shouldRefreshAdminClaim) {
            try {
              tokenAny.isAdmin = await getIsAdminByEmail(email);
            } catch (err) {
              const message = (err as any)?.message || String(err);
              if (isTransientDbError(err)) {
                console.warn("[auth] isAdmin lookup skipped: database unavailable", message);
              } else {
                console.error("[auth] isAdmin lookup failed; defaulting to false", message);
              }
              tokenAny.isAdmin = false;
            } finally {
              tokenAny.isAdminCheckedAt = now;
            }
          }

          if (account?.provider) {
            // OAuth sign-in: store provider tokens from the OAuth account
            tokenAny.provider = account.provider;
            const prev = tokenAny.providers[account.provider] || {};
            const accessToken = (account as any)?.access_token ?? prev.accessToken;
            const refreshToken = (account as any)?.refresh_token ?? prev.refreshToken;
            const expiresAtSeconds =
              typeof (account as any)?.expires_at === 'number'
                ? (account as any).expires_at
                : undefined;
            const expiresAt =
              typeof expiresAtSeconds === 'number'
                ? expiresAtSeconds * 1000
                : prev.expiresAt;

            tokenAny.providers[account.provider] = {
              ...prev,
              accessToken,
              refreshToken,
              expiresAt,
            };

            if (account.provider === 'google' && email && (account as any)?.refresh_token) {
              try {
                await saveGoogleRefreshToken(email, (account as any).refresh_token as string);
              } catch (err) {
                const message = (err as any)?.message || String(err);
                if (isTransientDbError(err)) {
                  console.warn("[auth] saveGoogleRefreshToken skipped: database unavailable", message);
                } else {
                  console.error("[auth] saveGoogleRefreshToken failed", message);
                }
              }
            }
          }
          
          // Periodically refresh provider token presence from DB so every request
          // does not issue two extra token lookups in hot paths.
          const lastProviderTokenCheckAt =
            typeof tokenAny?.providerTokensCheckedAt === "number"
              ? tokenAny.providerTokensCheckedAt
              : 0;
          const shouldRefreshProviderTokens =
            Boolean(email) &&
            (account?.provider != null ||
              tokenAny.providerTokensCheckedAt === undefined ||
              now - lastProviderTokenCheckAt > PROVIDER_TOKEN_REFRESH_MS);

          if (
            email &&
            shouldRefreshProviderTokens &&
            (!tokenAny.providers?.google?.refreshToken ||
              !tokenAny.providers?.microsoft?.refreshToken)
          ) {
            try {
              if (!tokenAny.providers?.google?.refreshToken) {
                const googleRefresh = await getGoogleRefreshToken(email);
                if (googleRefresh) {
                  tokenAny.providers.google = tokenAny.providers.google || {};
                  tokenAny.providers.google.refreshToken = googleRefresh;
                }
              }
              if (!tokenAny.providers?.microsoft?.refreshToken) {
                const microsoftRefresh = await getMicrosoftRefreshToken(email);
                if (microsoftRefresh) {
                  tokenAny.providers.microsoft = tokenAny.providers.microsoft || {};
                  tokenAny.providers.microsoft.refreshToken = microsoftRefresh;
                  tokenAny.providers.microsoft.connected = true;
                }
              }
            } catch (err) {
              const message = (err as any)?.message || String(err);
              if (isTransientDbError(err)) {
                console.warn("[auth] stored provider token lookup skipped: database unavailable", message);
              } else {
                console.error("[auth] failed to load stored provider tokens", message);
              }
              // Continue even if loading fails - database lookup in /api/calendars will handle it
            } finally {
              tokenAny.providerTokensCheckedAt = now;
            }
          }
        } catch (err) {
          const message = (err as any)?.message || String(err);
          if (isTransientDbError(err)) {
            console.warn("[auth] jwt callback recovered from transient database error", message);
          } else {
            console.error("[auth] jwt callback error", message);
          }
        }
        return token;
      },
      async session({ session, token }) {
        try {
          if (session?.user) {
            (session.user as any).isAdmin = Boolean((token as any)?.isAdmin);
            (session.user as any).provider = (token as any)?.provider || "credentials";
          }
        } catch {}
        return session;
      },
    },
  };
}

export const authOptions = getAuthOptions();
