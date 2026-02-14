import { NextRequest } from "next/server";

// Edge Runtime: no Node (fs/path), so this route is bundled separately and stays under Vercel's 300MB limit.
export const runtime = "edge";

const THEME_FOLDER_MAP: Record<string, string> = {
  "Spring": "spring",
  "Summer": "summer",
  "School & Education": "school-and-education",
  "Fall & Seasonal": "fall-and-seasonal",
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

type ManifestEntry = { name: string; tier: string; path: string };
type Manifest = Record<string, ManifestEntry[]>;

function slug(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "-");
}

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

    const origin = req.nextUrl?.origin ?? new URL(req.url).origin;
    const manifestUrl = `${origin}/templates/signup/manifest.json`;
    const res = await fetch(manifestUrl);
    if (!res.ok) {
      return new Response(JSON.stringify({ ok: false, error: "internal" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }
    const manifest: Manifest = await res.json();

    const categorySlug = slug(category);
    const mappedFolder = THEME_FOLDER_MAP[category] ?? category;
    const candidates = [
      category,
      mappedFolder,
      categorySlug,
      slug(mappedFolder),
      ...Object.keys(manifest),
    ];

    let images: string[] | null = null;
    for (const cand of candidates) {
      const entry = manifest[cand];
      if (Array.isArray(entry) && entry.length > 0) {
        images = entry.map((e) => e.path);
        break;
      }
      const bySlug = Object.keys(manifest).find((k) => slug(k) === slug(cand));
      if (bySlug && Array.isArray(manifest[bySlug])) {
        images = manifest[bySlug].map((e) => e.path);
        break;
      }
    }

    if (!images) {
      return new Response(JSON.stringify({ ok: true, images: [] }), {
        headers: { "content-type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, images }), {
      headers: { "content-type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "internal" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
