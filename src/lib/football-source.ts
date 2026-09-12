import { lookup } from "node:dns/promises";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { isIP } from "node:net";

const MAX_BYTES = 12 * 1024 * 1024;

export function isPublicSourceAddress(address: string): boolean {
  if (isIP(address) === 6)
    return /^[23][0-9a-f]{3}:/i.test(address) && !/^2001:(?:db8|0|10|20):/i.test(address);
  if (isIP(address) !== 4) return false;
  const [a, b] = address.split(".").map(Number);
  return !(
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 168 || b === 0 || b === 2)) ||
    (a === 198 && (b === 18 || b === 19 || b === 51)) ||
    (a === 203 && b === 0)
  );
}

/** Resolve and pin public addresses for every hop. Never forward account cookies. */
export async function fetchFootballSource(rawUrl: string, signal?: AbortSignal) {
  let url = new URL(rawUrl);
  for (let hop = 0; hop < 5; hop++) {
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      (url.port && !["80", "443"].includes(url.port))
    )
      throw new Error("Use a public website URL.");
    const hostname = url.hostname.replace(/^\[|\]$/g, "");
    const addresses = await lookup(hostname, { all: true });
    if (!addresses.length || addresses.some(({ address }) => !isPublicSourceAddress(address)))
      throw new Error("Private network URLs cannot be imported.");
    const pinned = addresses[0];
    const response = await new Promise<{
      status: number;
      location?: string;
      contentType: string;
      buffer: Buffer;
    }>((resolve, reject) => {
      const send = url.protocol === "https:" ? httpsRequest : httpRequest;
      const req = send(
        {
          hostname: pinned.address,
          family: pinned.family,
          servername: hostname,
          port: url.port || (url.protocol === "https:" ? 443 : 80),
          path: url.pathname + url.search,
          headers: {
            Host: url.host,
            "User-Agent": "Envitefy/1.0",
            Accept: "text/html,application/pdf,text/plain,application/json",
          },
          signal,
          timeout: 12_000,
        },
        (res) => {
          const chunks: Buffer[] = [];
          let size = 0;
          res.on("error", reject);
          res.on("data", (chunk: Buffer) => {
            size += chunk.length;
            if (size > MAX_BYTES) {
              res.destroy(new Error("Source is too large."));
              return;
            }
            chunks.push(chunk);
          });
          res.on("end", () =>
            resolve({
              status: res.statusCode || 0,
              location: res.headers.location,
              contentType: res.headers["content-type"] || "",
              buffer: Buffer.concat(chunks),
            }),
          );
        },
      );
      req.on("timeout", () => req.destroy(new Error("Website took too long to respond.")));
      req.on("error", reject);
      req.end();
    });
    if ([301, 302, 303, 307, 308].includes(response.status) && response.location) {
      url = new URL(response.location, url);
      continue;
    }
    if (response.status < 200 || response.status >= 300)
      throw new Error("Website could not be opened.");
    return { ...response, url: url.toString() };
  }
  throw new Error("Website redirected too many times.");
}

export function footballWebsiteText(html: string, url: string) {
  const structured: string[] = [];
  const content = html
    .replace(
      /<script\b([^>]*)>([\s\S]*?)<\/script>/gi,
      (_match, attributes: string, body: string) => {
        if (/application\/(?:ld\+)?json/i.test(attributes)) structured.push(body.slice(0, 60_000));
        return " ";
      },
    )
    .replace(/<(style|noscript|svg)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(
      /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
      (_match, href: string, label: string) => {
        try {
          const target = new URL(href, url);
          return `${label} ${/^https?:$/.test(target.protocol) ? target.href : ""}`;
        } catch {
          return label;
        }
      },
    )
    .replace(/<\/(?:tr|p|div|h[1-6]|li|section)>|<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_match, digits: string) => {
      const n = Number(digits);
      return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : "";
    })
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n/g, "\n")
    .trim();
  return `Source URL: ${url}\n${content}\n${structured.join("\n")}`.slice(0, 120_000);
}
