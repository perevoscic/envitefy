import fs from "node:fs";
import path from "node:path";

export async function register() {
  try {
    const dir = process.env.NEXT_CACHE_DIR || "/tmp/next-cache";
    fs.mkdirSync(dir, { recursive: true });
    // Optional subdir for image optimizer
    fs.mkdirSync(path.join(dir, "images"), { recursive: true });
  } catch (e) {
    console.warn("Could not prepare NEXT_CACHE_DIR:", e);
  }
}
