export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET() {
  const results: any = {};

  async function ping(name: string, url: string) {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 8_000);
    try {
      const res = await fetch(url, { signal: ac.signal });
      results[name] = { ok: res.ok, status: res.status };
    } catch (e: any) {
      results[name] = { ok: false, error: String(e?.name || e?.message || e) };
    } finally {
      clearTimeout(t);
    }
  }

  await ping("google_204", "https://www.google.com/generate_204");         // generic internet
  await ping("vision_root", "https://vision.googleapis.com/");              // Google APIs front door
  await ping("vision_metadata", "https://vision.googleapis.com/v1/");       // Vision v1 root

  return new Response(JSON.stringify({ ok: true, results }, null, 2), {
    status: 200,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}
