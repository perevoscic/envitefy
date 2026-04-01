import { CalendarClock, MapPin, Share2, WandSparkles } from "lucide-react";

type SnapEventPreviewProps = {
  className?: string;
};

const extractedRows = [
  { label: "Title", value: "Winter Classic Invite" },
  { label: "When", value: "Jan 18 · 8:00 AM" },
  { label: "Where", value: "Lakeview Sports Center" },
] as const;

export default function SnapEventPreview({
  className = "",
}: SnapEventPreviewProps) {
  return (
    <div className={`relative overflow-hidden ${className}`.trim()}>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-10 top-8 h-40 w-40 rounded-full bg-[#d8ccff]/55 blur-3xl" />
        <div className="absolute -right-10 bottom-0 h-44 w-44 rounded-full bg-[#efe7ff] blur-3xl" />
      </div>

      <div className="relative overflow-hidden rounded-[2rem] border border-[#e7ddff] bg-[linear-gradient(180deg,#ffffff_0%,#faf7ff_100%)] p-4 shadow-[0_28px_80px_rgba(91,58,191,0.12)] sm:p-5">
        <div className="rounded-[1.6rem] border border-[#ece1ff] bg-white p-5 shadow-[0_12px_30px_rgba(91,58,191,0.06)]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-[#8c73d6]">
              Snap workflow
            </p>
            <span className="rounded-full border border-[#eadfff] bg-[#faf7ff] px-3 py-1 text-[0.68rem] font-semibold text-[#6e55b5]">
              PDF or image
            </span>
          </div>

          <div className="mt-4 rounded-[1.35rem] bg-[linear-gradient(135deg,#7450ff_0%,#9f7bff_52%,#efe8ff_100%)] p-5 text-white">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/16 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em]">
              <WandSparkles className="h-3.5 w-3.5" />
              Extracted and organized
            </div>
            <h3
              className="mt-4 text-[1.55rem] font-semibold leading-tight tracking-[-0.04em]"
              style={{
                fontFamily:
                  'var(--font-montserrat), var(--font-sans), sans-serif',
              }}
            >
              Winter Classic Invite
            </h3>
            <p className="mt-2 text-sm leading-6 text-white/84">
              Title, time, venue, and share-ready details pulled into one draft.
            </p>
          </div>

          <div className="mt-4 space-y-2.5">
            {extractedRows.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between rounded-2xl border border-[#efe9ff] bg-[#faf8ff] px-4 py-3"
              >
                <span className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[#8b83aa]">
                  {row.label}
                </span>
                <span className="text-sm font-semibold text-[#231c49]">
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#efe9ff] bg-white px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2 text-[#6d57bd]">
                <CalendarClock className="h-4 w-4" />
                <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em]">
                  Faster setup
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold text-[#221a47]">
                Review the details instead of retyping them.
              </p>
            </div>
            <div className="rounded-2xl border border-[#efe9ff] bg-white px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2 text-[#6d57bd]">
                <Share2 className="h-4 w-4" />
                <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em]">
                  Shareable output
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold text-[#221a47]">
                Publish one clean page instead of forwarding the source file.
              </p>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-5 right-5 hidden rounded-full border border-white/70 bg-white/88 px-4 py-2 shadow-lg shadow-[#7d62dc]/10 backdrop-blur sm:flex">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#3d315f]">
            <MapPin className="h-4 w-4 text-[#6f55c9]" />
            Organized and ready to share
          </div>
        </div>
      </div>
    </div>
  );
}
