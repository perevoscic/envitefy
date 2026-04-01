import { ArrowRight, FileText, RefreshCw, Share2 } from "lucide-react";

const proofCards = [
  {
    icon: FileText,
    label: "One source file",
    title: "The original PDF, flyer, or invite is just the starting point.",
    copy: "Envitefy gives that original file a cleaner presentation layer instead of leaving everyone inside attachments and screenshots.",
  },
  {
    icon: Share2,
    label: "One clean link",
    title: "Sharing gets easier when everyone gets the same page.",
    copy: "Families, coaches, and guests can open one mobile-friendly destination instead of piecing together context from multiple messages.",
  },
  {
    icon: RefreshCw,
    label: "One update point",
    title: "Changing one page is better than resending a full thread.",
    copy: "When schedules shift or new links appear, the live page becomes the current source of truth instead of another resend.",
  },
] as const;

export default function Testimonials() {
  return (
    <section id="proof" className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:items-start">
          <div className="max-w-xl">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-[#856ed1]">
              Product proof
            </p>
            <h2
              className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[#17132b] sm:text-5xl"
              style={{
                fontFamily:
                  'var(--font-montserrat), var(--font-sans), sans-serif',
              }}
            >
              The value is visible in the workflow itself.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#58536e]">
              The product is easiest to trust when the story stays concrete:
              messy source in, cleaner page out, and fewer questions after it
              is shared.
            </p>

            <div className="mt-8 rounded-[2rem] border border-[#ebe3ff] bg-white p-6 shadow-[0_20px_52px_rgba(102,76,189,0.08)]">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#7f69c8]">
                Why it converts
              </p>
              <div className="mt-4 space-y-3">
                {[
                  "Gymnastics makes the flagship story immediately clear",
                  "Snap broadens the use case without diluting the message",
                  "The page shows product outcomes instead of generic startup claims",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-2xl border border-[#f0eaff] bg-[#faf7ff] px-4 py-3"
                  >
                    <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-[#6f55c9]" />
                    <p className="text-sm font-semibold text-[#2d244c]">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {proofCards.map(({ icon: Icon, label, title, copy }) => (
              <article
                key={title}
                className="rounded-[2rem] border border-[#ece4ff] bg-white p-7 shadow-[0_22px_56px_rgba(100,74,188,0.08)]"
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f5f0ff] text-[#6d54ca]">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-6 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[#8b76ca]">
                  {label}
                </p>
                <h3
                  className="mt-3 text-xl font-semibold leading-8 tracking-[-0.03em] text-[#342d4f]"
                  style={{
                    fontFamily:
                      'var(--font-montserrat), var(--font-sans), sans-serif',
                  }}
                >
                  {title}
                </h3>
                <p className="mt-4 text-base leading-7 text-[#635d78]">{copy}</p>
                <div className="mt-6 border-t border-[#f1ebff] pt-5">
                  <p className="text-sm font-semibold text-[#1f1837]">
                    Better for families, coaches, and organizers
                  </p>
                  <p className="mt-1 text-sm text-[#6a657f]">
                    Cleaner presentation, easier sharing, lower confusion
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
