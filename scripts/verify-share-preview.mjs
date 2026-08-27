import sharp from "sharp";

const inputUrl = process.argv[2];
if (!inputUrl) {
  console.error("Usage: npm run verify:share-preview -- https://envitefy.com/event/<slug>");
  process.exit(2);
}

const pageUrl = new URL(inputUrl);
// Twitterbot is in Next.js's HTML-limited bot list, so dynamic metadata must be resolved into
// the initial document head instead of being streamed later as browser-only RSC instructions.
const crawlerHeaders = { "user-agent": "Twitterbot/1.0" };

function readAttribute(tag, attribute) {
  const escaped = attribute.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (
    tag.match(new RegExp(`${escaped}=["']([^"']+)["']`, "i"))?.[1]?.replace(/&amp;/g, "&") ||
    ""
  );
}

function findMetaContent(html, keyAttribute, keyValue) {
  for (const match of html.matchAll(/<meta\s+[^>]*>/gi)) {
    if (readAttribute(match[0], keyAttribute).toLowerCase() === keyValue.toLowerCase()) {
      return { content: readAttribute(match[0], "content"), index: match.index || 0 };
    }
  }
  return null;
}

const pageResponse = await fetch(pageUrl, { headers: crawlerHeaders, redirect: "follow" });
if (!pageResponse.ok) {
  throw new Error(`Share page returned HTTP ${pageResponse.status}`);
}
const html = await pageResponse.text();
const ogImage = findMetaContent(html, "property", "og:image");
const twitterImage = findMetaContent(html, "name", "twitter:image");
if (!ogImage?.content) throw new Error("Share page did not emit og:image");
if (!twitterImage?.content) throw new Error("Share page did not emit twitter:image");
if (ogImage.index > 256 * 1024) {
  throw new Error(`og:image appears too late in HTML at byte ${ogImage.index}`);
}

const imageUrl = new URL(ogImage.content, pageResponse.url);
if (imageUrl.origin === pageUrl.origin && imageUrl.pathname.startsWith("/api/")) {
  throw new Error(`og:image uses robots-blocked API path: ${imageUrl.pathname}`);
}

const imageResponse = await fetch(imageUrl, { headers: crawlerHeaders, redirect: "follow" });
if (!imageResponse.ok) throw new Error(`og:image returned HTTP ${imageResponse.status}`);
const contentType = imageResponse.headers.get("content-type") || "";
if (!contentType.startsWith("image/")) {
  throw new Error(`og:image returned unexpected content type: ${contentType || "missing"}`);
}
const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
if (imageBuffer.length < 1024) {
  throw new Error(`og:image returned only ${imageBuffer.length} bytes`);
}
const imageMetadata = await sharp(imageBuffer).metadata();
if (!imageMetadata.width || !imageMetadata.height) {
  throw new Error("og:image is not a decodable image with dimensions");
}

console.log(
  JSON.stringify(
    {
      ok: true,
      pageUrl: pageResponse.url,
      pageBytes: Buffer.byteLength(html),
      ogImageTagByte: ogImage.index,
      ogImage: imageUrl.toString(),
      twitterImage: new URL(twitterImage.content, pageResponse.url).toString(),
      imageStatus: imageResponse.status,
      imageContentType: contentType,
      imageBytes: imageBuffer.length,
      imageWidth: imageMetadata.width,
      imageHeight: imageMetadata.height,
      imageCacheControl: imageResponse.headers.get("cache-control"),
    },
    null,
    2,
  ),
);
