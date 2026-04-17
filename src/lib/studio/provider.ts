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
  return normalizeStudioProvider(process.env.STUDIO_PROVIDER) || "gemini";
}
