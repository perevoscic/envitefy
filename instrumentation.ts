// src/instrumentation.ts
export async function register() {
  // Only run on Node.js (not Edge)
  const isNode =
    typeof process !== "undefined" &&
    !!(process as any).versions?.node;

  if (!isNode) return;

  try {
    const fs = await import("node:fs");
    const path = await import("node:path");

    const dir = process.env.NEXT_CACHE_DIR || "/tmp/next-cache";
    fs.mkdirSync(dir, { recursive: true });
    fs.mkdirSync(path.join(dir, "images"), { recursive: true });
  } catch (e) {
    // Best-effort — never crash the worker
    // eslint-disable-next-line no-console
    console.warn("Could not prepare NEXT_CACHE_DIR:", e);
  }
}
