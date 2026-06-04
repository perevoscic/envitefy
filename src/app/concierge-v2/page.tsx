import type { Metadata } from "next";
import { getConciergeV2Flags } from "@/config/concierge-v2-flags";
import ConciergeV2Client from "./ConciergeV2Client";

export const metadata: Metadata = {
  title: "Concierge V2 | Envitefy",
  description:
    "Create event pages, schedules, RSVPs, forms, reminders, and planning boards from a natural-language event brief.",
};

function DisabledState() {
  return (
    <main className="min-h-screen bg-[#f8f6ff] px-4 py-10 text-slate-950 sm:px-6">
      <section className="mx-auto max-w-2xl rounded-2xl border border-violet-100 bg-white p-6 shadow-[0_24px_70px_rgba(88,64,150,0.12)]">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-700">
          Concierge V2
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight">This workspace feature is off.</h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Set `ENABLE_CONCIERGE_V2=true` to try the new event operating system flow locally.
        </p>
      </section>
    </main>
  );
}

export default function ConciergeV2Page() {
  const flags = getConciergeV2Flags();
  if (!flags.ENABLE_CONCIERGE_V2) return <DisabledState />;
  return <ConciergeV2Client flags={flags} />;
}
