/**
 * Parse a data URL with base64 payload without RegExp on the full string (large
 * payloads can overflow the JS engine stack with greedy patterns).
 */
export function parseDataUrlBase64(dataUrl: string): {
  mimeType: string;
  base64Payload: string;
} | null {
  const prefix = "data:";
  const marker = ";base64,";
  if (!dataUrl.startsWith(prefix)) return null;
  const markerIdx = dataUrl.indexOf(marker, prefix.length);
  if (markerIdx === -1) return null;
  const mimeType = dataUrl.slice(prefix.length, markerIdx);
  if (!mimeType || mimeType.length > 128) return null;
  const base64Payload = dataUrl.slice(markerIdx + marker.length);
  return { mimeType, base64Payload };
}
