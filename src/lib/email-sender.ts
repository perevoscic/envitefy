export const DEFAULT_ENVITEFY_SENDER = "Envitefy <onboarding@resend.dev>";

/** Keep the configured mailbox while making the customer-facing sender name consistent. */
export function normalizeEnvitefySender(value: string): string {
  const singleLine = value.replace(/[\r\n]+/g, " ").trim();
  const bracketedAddress = singleLine.match(/<\s*([^<>\s]+@[^<>\s]+)\s*>/i)?.[1];
  const address = bracketedAddress || (/^[^<>\s]+@[^<>\s]+$/.test(singleLine) ? singleLine : "");
  return address ? `Envitefy <${address}>` : singleLine;
}
