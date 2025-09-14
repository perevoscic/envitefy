/**
 * Extracts the first phone-like string from arbitrary text and normalizes it
 * to a clean 10 or 11 digit number (US-style, optional leading 1).
 *
 * This intentionally uses a stricter pattern than the generic digit matcher to
 * avoid accidentally consuming trailing numbers from addresses (e.g., ZIPs or
 * street numbers) when text is concatenated.
 */
export function extractFirstPhoneNumber(sourceText: string | null | undefined): string | null {
  try {
    const text = (sourceText || "").toString();
    if (!text) return null;
    // US-style: optional +1/1, 3-digit area, 3-digit prefix, 4-digit line
    const pattern = /(?:\+?1[\s().-]*)?(?:\(?\d{3}\)?[\s().-]*)\d{3}[\s().-]*\d{4}/;
    const match = text.match(pattern);
    if (!match) return null;
    // Strip all non-digits
    const digitsOnly = match[0].replace(/\D/g, "");
    if (!digitsOnly) return null;

    // Normalize length: prefer 11 if it starts with 1, otherwise 10
    if (digitsOnly.length >= 11 && digitsOnly.startsWith("1")) {
      return digitsOnly.slice(0, 11);
    }
    if (digitsOnly.length >= 10) {
      return digitsOnly.slice(-10);
    }
    return digitsOnly;
  } catch {
    return null;
  }
}


