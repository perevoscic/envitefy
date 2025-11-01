import { NextRequest } from "next/server";
import path from "path";
import { promises as fs } from "fs";

const memoryCache = new Map<string, string[]>();

const THEME_FOLDER_MAP: Record<string, string> = {
  "Spring": "spring",
  "Summer": "summer",
  "School & Education": "school-and-education",
  "Fall & Seasonal": "fall-and-seasonal",
  "Winter & Holidays": "winter-and-holidays",
  "Church & Community": "church-and-community",
  "Sports & Recreation": "sports-and-recreation",
  "Fundraising & Food": "fundraising-and-food",
  "Family & Personal": "family-and-personal",
  "Business & Professional": "business-and-professional",
  "Parties & Events": "parties-and-events",
  "Health & Fitness": "health-and-fitness",
  "Clubs & Groups": "clubs-and-groups",
  "General": "general",
  "Other / Special Interest": "other-special-interest",
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = (searchParams.get("category") || "").trim();
    if (!category) {
      return new Response(JSON.stringify({ ok: false, error: "category is required" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const mappedFolder = THEME_FOLDER_MAP[category] || category;
    const cacheKey = `${mappedFolder}::${category}`;
    if (memoryCache.has(cacheKey)) {
      const images = memoryCache.get(cacheKey)!;
      return new Response(JSON.stringify({ ok: true, images }), {
        headers: { "content-type": "application/json" },
      });
    }

    const root = path.join(process.cwd(), "public", "templates", "signup");
    const slug = (s: string) =>
      s
        .trim()
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9_-]/g, "-");
    const uslug = (s: string) =>
      s
        .trim()
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_-]/g, "_");

    const original = category;
    const andToWord = original.replace(/&/g, "and");
    const andRemoved = original.replace(/&/g, "");
    const candidates = Array.from(
      new Set([
        // explicit mapping and slug variants
        mappedFolder,
        mappedFolder.trim(),
        decodeURIComponent(mappedFolder),
        THEME_FOLDER_MAP[category] || slug(mappedFolder),
        slug(decodeURIComponent(mappedFolder)),
        uslug(mappedFolder),
        uslug(decodeURIComponent(mappedFolder)),
        // originals (including &)
        original,
        original.trim(),
        decodeURIComponent(original),
        // replace & with 'and' or remove it
        andToWord,
        slug(andToWord),
        uslug(andToWord),
        andRemoved,
        slug(andRemoved),
        uslug(andRemoved),
        // plain slug of the original
        slug(original),
        slug(decodeURIComponent(original)),
        uslug(original),
        uslug(decodeURIComponent(original)),
      ])
    );

    let files: string[] = [];
    let resolvedDirName: string | null = null;
    for (const cand of candidates) {
      const dir = path.join(root, cand);
      try {
        const stats = await fs.stat(dir);
        if (stats.isDirectory()) {
          files = await fs.readdir(dir);
          if (files.length >= 0) {
            // resolve to this candidate
            resolvedDirName = cand;
            break;
          }
        }
      } catch {
        // try next candidate
      }
    }

    const allowed = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
    const folderForUrl = resolvedDirName || (THEME_FOLDER_MAP[category] || category);
    const images = files
      .filter((f) => allowed.has(path.extname(f).toLowerCase()))
      .sort((a, b) => a.localeCompare(b))
      .map((f) => `/templates/signup/${encodeURIComponent(folderForUrl)}/${encodeURIComponent(f)}`);

    memoryCache.set(cacheKey, images);

    return new Response(JSON.stringify({ ok: true, images }), {
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: "internal" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}


