function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function booleanTrue(value: unknown): boolean {
  return value === true || value === "true" || value === "1";
}

function booleanFalse(value: unknown): boolean {
  return value === false || value === "false" || value === "0";
}

function normalizeVisibility(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase().replace(/[\s_]+/g, "-");
  return normalized || null;
}

export function isIndexablePublicSmartSignupData(value: unknown): boolean {
  const data = asRecord(value);
  if (!data) return false;
  const signupForm = asRecord(data.signupForm);
  if (!signupForm) return false;
  if (booleanFalse(signupForm.enabled)) return false;

  const visibility =
    normalizeVisibility(signupForm.visibility) ||
    normalizeVisibility(signupForm.publicVisibility) ||
    normalizeVisibility(data.signupVisibility) ||
    normalizeVisibility(data.publicVisibility) ||
    normalizeVisibility(data.visibility);
  const explicitlyPrivate =
    visibility === "private" ||
    visibility === "restricted" ||
    visibility === "invite-only" ||
    visibility === "unlisted";

  const explicitlyNoindexed =
    booleanTrue(data.noindex) ||
    booleanTrue(data.signupNoindex) ||
    booleanTrue(signupForm.noindex) ||
    booleanFalse(data.indexable) ||
    booleanFalse(data.publicIndex) ||
    booleanFalse(data.signupIndexable) ||
    booleanFalse(signupForm.indexable) ||
    booleanFalse(signupForm.publicIndex);

  const explicitlyPublic =
    visibility === "public" ||
    booleanTrue(data.publicSignup) ||
    booleanTrue(data.signupPublic) ||
    booleanTrue(data.smartSignupPublic) ||
    booleanTrue(data.signupIndexable) ||
    booleanTrue(signupForm.publicPage) ||
    booleanTrue(signupForm.isPublic) ||
    booleanTrue(signupForm.public) ||
    booleanTrue(signupForm.publicIndex) ||
    booleanTrue(signupForm.indexable);

  return explicitlyPublic && !explicitlyPrivate && !explicitlyNoindexed;
}
