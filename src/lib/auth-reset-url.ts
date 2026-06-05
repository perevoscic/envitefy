import { buildPublicAssetUrl } from "./public-asset-url";

export function buildPublicPasswordResetUrl(baseResetUrl: string): string {
  const url = new URL(buildPublicAssetUrl(baseResetUrl || "/reset"));
  if (!url.pathname || url.pathname === "/") {
    url.pathname = "/reset";
  }
  return url.toString();
}

export function buildSupabasePasswordResetRedirectUrl(baseResetUrl: string): string {
  const url = new URL(buildPublicPasswordResetUrl(baseResetUrl));
  url.searchParams.set("provider", "supabase");
  return url.toString();
}

export function rewriteSupabaseRecoveryActionLinkRedirect(
  actionLink: string,
  baseResetUrl: string,
): string {
  const url = new URL(actionLink);
  url.searchParams.set(
    "redirect_to",
    buildSupabasePasswordResetRedirectUrl(baseResetUrl),
  );
  return url.toString();
}
