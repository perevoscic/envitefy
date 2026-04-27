import type { StudioProvider } from "@/lib/studio/types";

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function normalizeStudioProvider(value: unknown): StudioProvider | null {
  const provider = safeString(value);
  if (provider === "openai" || provider === "gemini") return provider;
  return null;
}

export function resolveStudioProvider(): StudioProvider {
  const configuredProvider = safeString(process.env.STUDIO_PROVIDER);
  if (configuredProvider) {
    const provider = normalizeStudioProvider(configuredProvider);
    if (provider) return provider;
    throw new Error('Invalid STUDIO_PROVIDER. Expected "openai" or "gemini".');
  }

  return process.env.NODE_ENV === "production" ? "openai" : "gemini";
}
