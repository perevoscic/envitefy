import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { getToken } from "next-auth/jwt";
import { cookies } from "next/headers";
import { TEMPLATE_KEYS } from "@/config/feature-visibility";
import { getUserByEmail, verifyPassword, getIsAdminByEmail, createOrUpdateOAuthUser, saveGoogleRefreshToken, getGoogleRefreshToken, getMicrosoftRefreshToken, getUserIdByEmail, updateFeatureVisibilityByEmail } from "@/lib/db";
import {
  normalizePrimarySignupSource,
  normalizeProductScopes,
  type PrimarySignupSource,
  type ProductScope,
} from "@/lib/product-scopes";
import { normalizeSignupIntent, type SignupIntent } from "@/lib/signup-intent";

function isTransientDbError(err: unknown): boolean {
  const anyErr = err as any;
  const code = String(anyErr?.code || "");
  const message = String(anyErr?.message || "");
  return (
    ["ENOTFOUND", "ETIMEDOUT", "ECONNREFUSED", "ECONNRESET", "EHOSTUNREACH", "ENETUNREACH"].includes(code) ||
    /getaddrinfo|timeout|refused|not known/i.test(message)
  );
}

function resolveAuthSecret() {
  return (
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    // Fallback to a dev-only secret to avoid hard crashes during local prod builds/start.
    "dev-build-secret"
  );
}

type SessionUserLike = {
  id?: string | null;
  email?: string | null;
  name?: string | null;
} | null | undefined;

const USER_ID_CACHE_TTL_MS = 60_000;
const userIdByEmailCache = new Map<string, { userId: string; expiresAt: number }>();
const USER_ACCESS_CACHE_TTL_MS = 5 * 60_000;
const userAccessByEmailCache = new Map<
  string,
  {
    expiresAt: number;
    primarySignupSource: PrimarySignupSource;
    productScopes: ProductScope[];
  }
>();

async function readSignupSourceCookie(): Promise<"snap" | "gymnastics" | null> {
  try {
    const jar = await cookies();
    const value = jar.get("envitefy_signup_source")?.value || null;
    return value === "snap" || value === "gymnastics" ? value : null;
  } catch {
    return null;
  }
}

async function readSignupIntentCookie(): Promise<SignupIntent | null> {
  try {
    const jar = await cookies();
    return normalizeSignupIntent(jar.get("envitefy_signup_intent")?.value);
  } catch {
    return null;
  }
}

async function applySignupIntentDefaults(email: string, intent: SignupIntent | null) {
  if (!intent || intent === "snap") return;
  await updateFeatureVisibilityByEmail({
    email,
    persona: null,
    personas: [],
    visibleTemplateKeys: [...TEMPLATE_KEYS],
    defaultCreateIntent: intent,
  });
}

async function resolveUserAccessMetadata(email: string): Promise<{
  primarySignupSource: PrimarySignupSource;
  productScopes: ProductScope[];
} | null> {
  const lower = email.trim().toLowerCase();
  const cached = userAccessByEmailCache.get(lower);
  if (cached && cached.expiresAt > Date.now()) {
    return {
      primarySignupSource: cached.primarySignupSource,
      productScopes: cached.productScopes,
    };
  }

  const user = await getUserByEmail(lower);
  if (!user) return null;
  const metadata = {
    primarySignupSource:
      normalizePrimarySignupSource(user.primary_signup_source) || "legacy",
    productScopes: normalizeProductScopes(user.product_scopes),
  };
  userAccessByEmailCache.set(lower, {
    ...metadata,
    expiresAt: Date.now() + USER_ACCESS_CACHE_TTL_MS,
  });
  return metadata;
}

export async function resolveSessionUserId(sessionLike: {
  user?: SessionUserLike;
} | null | undefined): Promise<string | null> {
  const sessionUser = sessionLike?.user || null;
  const email =
    typeof sessionUser?.email === "string" ? sessionUser.email.trim().toLowerCase() : "";
  if (email) {
    const cached = userIdByEmailCache.get(email);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.userId;
    }
    try {
      const userId = await getUserIdByEmail(email);
      if (userId) {
        userIdByEmailCache.set(email, {
          userId,
          expiresAt: Date.now() + USER_ID_CACHE_TTL_MS,
        });
        return userId;
      }
      return null;
    } catch (err) {
      const message = (err as any)?.message || String(err);
      if (isTransientDbError(err)) {
        console.warn("[auth] resolveSessionUserId email lookup skipped: database unavailable", message);
      } else {
        console.error("[auth] resolveSessionUserId email lookup failed", message);
      }
      return null;
    }
  }
  if (typeof sessionUser?.id === "string" && sessionUser.id.trim()) {
    return sessionUser.id.trim();
  }
  return null;
}

export function getAuthOptions(): NextAuthOptions {
  const authDebugEnabled = process.env.AUTH_DEBUG === "1";
  const secret = resolveAuthSecret();

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

            const existingUser = await getUserByEmail(user.email);
            if (existingUser) {
              return true;
            }

            const signupSource = await readSignupSourceCookie();
            if (!signupSource) {
              console.warn("[auth] blocked Google signup without source", {
                email: user.email,
              });
              return false;
            }
            const signupIntent = await readSignupIntentCookie();

            const firstName = (profile as any)?.given_name || user.name?.split(" ")[0] || null;
            const lastName = (profile as any)?.family_name || user.name?.split(" ").slice(1).join(" ") || null;

            await createOrUpdateOAuthUser({
              email: user.email,
              firstName,
              lastName,
              provider: "google",
              signupSource,
            });
            await applySignupIntentDefaults(user.email, signupIntent);

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
          if (email) {
            const resolvedUserId =
              (await getUserIdByEmail(email).catch(() => null)) ||
              (typeof user?.id === "string" && user.id.trim() ? user.id.trim() : null);
            if (resolvedUserId) {
              tokenAny.userId = resolvedUserId;
            }
          }

          // Keep admin claims in sync with DB changes (e.g. user promoted while still logged in).
          // We refresh periodically instead of only once to avoid stale JWT claims.
          const now = Date.now();
          const ADMIN_CLAIM_REFRESH_MS = 15 * 60 * 1000;
          const ACCESS_METADATA_REFRESH_MS = 15 * 60 * 1000;
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

          const lastAccessMetadataCheckAt =
            typeof tokenAny?.accessMetadataCheckedAt === "number"
              ? tokenAny.accessMetadataCheckedAt
              : 0;
          const shouldRefreshAccessMetadata =
            Boolean(email) &&
            (account?.provider != null ||
              tokenAny.accessMetadataCheckedAt === undefined ||
              tokenAny.primarySignupSource === undefined ||
              tokenAny.productScopes === undefined ||
              now - lastAccessMetadataCheckAt > ACCESS_METADATA_REFRESH_MS);

          if (email && shouldRefreshAccessMetadata) {
            try {
              const accessMetadata = await resolveUserAccessMetadata(email);
              if (accessMetadata) {
                tokenAny.primarySignupSource = accessMetadata.primarySignupSource;
                tokenAny.productScopes = accessMetadata.productScopes;
              }
            } catch (err) {
              const message = (err as any)?.message || String(err);
              if (isTransientDbError(err)) {
                console.warn("[auth] product scope lookup skipped: database unavailable", message);
              } else {
                console.error("[auth] product scope lookup failed", message);
              }
            } finally {
              tokenAny.accessMetadataCheckedAt = now;
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
            (session.user as any).id =
              (typeof (token as any)?.userId === "string" && (token as any).userId.trim()) ||
              (typeof (session.user as any)?.id === "string" && (session.user as any).id.trim()) ||
              null;
            (session.user as any).isAdmin = Boolean((token as any)?.isAdmin);
            (session.user as any).provider = (token as any)?.provider || "credentials";
            (session.user as any).primarySignupSource =
              normalizePrimarySignupSource((token as any)?.primarySignupSource) || "legacy";
            (session.user as any).productScopes = normalizeProductScopes(
              (token as any)?.productScopes,
            );
          }
        } catch {}
        return session;
      },
    },
  };
}

export const authOptions = getAuthOptions();

type AuthenticatedRequestUser = {
  ok: true;
  session: {
    user?: {
      email?: string | null;
      id?: string | null;
      name?: string | null;
    } | null;
  };
  email: string;
  userId: string;
};

type UnauthenticatedRequestUser = {
  ok: false;
  session: {
    user?: {
      email?: string | null;
      id?: string | null;
      name?: string | null;
    } | null;
  } | null;
  reason: "no-session-email" | "no-resolved-user";
  email: string | null;
};

type RequestSessionUser = AuthenticatedRequestUser | UnauthenticatedRequestUser;

function cleanSessionEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  return trimmed || null;
}

async function getTokenSessionFallback(req: Request) {
  try {
    const token = await getToken({
      req: req as any,
      secret: resolveAuthSecret(),
      secureCookie: process.env.NODE_ENV === "production",
    });
    const email = cleanSessionEmail(token?.email);
    if (!email) return null;
    const userId =
      typeof (token as any)?.userId === "string" &&
      (token as any).userId.trim()
        ? String((token as any).userId).trim()
        : null;
    return {
      user: {
        email,
        id: userId,
      },
    };
  } catch {
    return null;
  }
}

export async function getAuthenticatedRequestUser(
  req?: Request,
): Promise<RequestSessionUser> {
  const session =
    ((await getServerSession(authOptions as any)) as AuthenticatedRequestUser["session"] | null) ??
    (req ? await getTokenSessionFallback(req) : null);
  const email = cleanSessionEmail(session?.user?.email);
  if (!email) {
    return {
      ok: false,
      session,
      reason: "no-session-email",
      email: null,
    };
  }

  const resolvedSession = session ?? { user: { email } };
  const userId = await resolveSessionUserId(resolvedSession);
  if (!userId) {
    return {
      ok: false,
      session,
      reason: "no-resolved-user",
      email,
    };
  }

  return {
    ok: true,
    session: resolvedSession,
    email,
    userId,
  };
}
