import { getServerSession } from "next-auth";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { NextResponse } from "next/server";

const requests = new Map<string, { count: number; until: number }>();
export async function builderApiAccess(
  workload: "assist" | "location" | "design",
): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions);
  const userId = await resolveSessionUserId(session);
  if (!userId)
    return NextResponse.json({ error: "Sign in to continue creating." }, { status: 401 });
  const now = Date.now();
  for (const [key, value] of requests) if (value.until < now) requests.delete(key);
  const key = `${userId}:${workload}`;
  const window = requests.get(key) || { count: 0, until: now + 60_000 };
  if (window.count >= (workload === "design" ? 4 : workload === "assist" ? 12 : 60) || requests.size > 10000)
    return NextResponse.json(
      { error: "Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  window.count += 1;
  requests.set(key, window);
  return null;
}
