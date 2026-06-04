import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { assertConciergeV2Enabled, isConciergeV2FlagEnabled } from "@/config/concierge-v2-flags";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { acceptConciergeV2HubInvitation } from "@/lib/concierge-v2/team-class-hub";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ConciergeV2InvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  assertConciergeV2Enabled();
  if (!isConciergeV2FlagEnabled("ENABLE_TEAM_CLASS_HUB")) redirect("/");
  const { token } = await params;
  const session: any = await getServerSession(authOptions as any);
  const userId = await resolveSessionUserId(session);
  const email = session?.user?.email || null;
  if (!userId) {
    redirect(`/api/auth/signin?callbackUrl=${encodeURIComponent(`/concierge-v2/invitations/${token}`)}`);
  }

  try {
    const result = await acceptConciergeV2HubInvitation({ token, userId, email });
    return (
      <main className="min-h-screen bg-[#f7f8fb] px-4 py-16 text-slate-950">
        <section className="mx-auto max-w-xl rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-700">Invitation accepted</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight">
            {result.eventTitle || "You're in"}
          </h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
            Your workspace role is {result.role.replace(/_/g, " ")}.
          </p>
          {result.eventHistoryId ? (
            <Link
              href={`/concierge-v2/events/${encodeURIComponent(result.eventHistoryId)}/hub`}
              className="mt-6 inline-flex h-11 items-center rounded-full bg-violet-700 px-5 text-sm font-black text-white"
            >
              Open Hub
            </Link>
          ) : (
            <Link
              href="/concierge-v2"
              className="mt-6 inline-flex h-11 items-center rounded-full bg-violet-700 px-5 text-sm font-black text-white"
            >
              Open Concierge
            </Link>
          )}
        </section>
      </main>
    );
  } catch (error: any) {
    return (
      <main className="min-h-screen bg-[#f7f8fb] px-4 py-16 text-slate-950">
        <section className="mx-auto max-w-xl rounded-lg border border-rose-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-rose-700">Invitation issue</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight">Unable to accept this invitation</h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
            {String(error?.message || "This invitation could not be accepted.")}
          </p>
          <Link
            href="/concierge-v2"
            className="mt-6 inline-flex h-11 items-center rounded-full bg-slate-950 px-5 text-sm font-black text-white"
          >
            Open Concierge
          </Link>
        </section>
      </main>
    );
  }
}
