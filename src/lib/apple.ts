import { SignJWT, importPKCS8 } from "jose";

type AppleEnv = {
  clientId: string;
  teamId: string;
  keyId: string;
  privateKey: string;
};

let cachedSecret: { value: string; expiresAt: number } | null = null;

function getAppleEnv(): AppleEnv | null {
  const clientId = process.env.APPLE_CLIENT_ID as string | undefined;
  const teamId = process.env.APPLE_TEAM_ID as string | undefined;
  const keyId = process.env.APPLE_KEY_ID as string | undefined;
  const rawKey = process.env.APPLE_PRIVATE_KEY as string | undefined;
  if (!clientId || !teamId || !keyId || !rawKey) return null;
  // Handle escaped newlines from env stores
  const privateKey = rawKey.replace(/\\n/g, "\n");
  return { clientId, teamId, keyId, privateKey } as AppleEnv;
}

export async function generateAppleClientSecret(): Promise<string> {
  const env = getAppleEnv();
  if (!env) throw new Error("Missing Apple env vars");
  const now = Math.floor(Date.now() / 1000);
  const expiresInSeconds = 60 * 60 * 24 * 180; // 180 days (Apple max ~6 months)
  const exp = now + expiresInSeconds;
  const pk = await importPKCS8(env.privateKey, "ES256");
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: env.keyId })
    .setIssuer(env.teamId)
    .setSubject(env.clientId)
    .setAudience("https://appleid.apple.com")
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .sign(pk);
  return token;
}

export async function getAppleClientSecretCached(): Promise<string> {
  const fiveMinutes = 60 * 5;
  const now = Math.floor(Date.now() / 1000);
  if (cachedSecret && cachedSecret.expiresAt - now > fiveMinutes) {
    return cachedSecret.value;
  }
  const env = getAppleEnv();
  if (!env) throw new Error("Missing Apple env vars");
  const secret = await generateAppleClientSecret();
  // Store approximate exp used in generateAppleClientSecret
  const expiresAt = now + 60 * 60 * 24 * 180;
  cachedSecret = { value: secret, expiresAt };
  return secret;
}


