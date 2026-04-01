import {
  CheckSquare2,
  FileText,
  Link2,
  Map as MapIcon,
  Megaphone,
  Route,
  ScanText,
  Smartphone,
  Sparkles,
  Trophy,
} from "lucide-react";
import GymnasticsMeetPreview from "@/components/landing/GymnasticsMeetPreview";
import SnapEventPreview from "@/components/landing/SnapEventPreview";

const featureCards = [
  {
    icon: Sparkles,
    title: "AI-powered detail extraction",
    copy: "Start from a source file and pull the event basics into a structured draft instead of copying them manually.",
  },
  {
    icon: Trophy,
    title: "Gymnastics meet pages",
    copy: "Give families, coaches, and organizers one polished destination for the full meet weekend.",
  },
  {
    icon: Smartphone,
    title: "Mobile event hubs",
    copy: "Pages are built to be opened, scanned, and shared on phones first.",
  },
  {
    icon: MapIcon,
    title: "Venue and parking info",
    copy: "Keep directions, parking notes, and arrival guidance attached to the same shareable page.",
  },
  {
    icon: FileText,
    title: "Schedules and documents together",
    copy: "Session timing, supporting docs, and key links stay in one clear place instead of scattered files.",
  },
  {
    icon: CheckSquare2,
    title: "Editable after import",
    copy: "Review, refine, and publish the details instead of being locked into raw extraction output.",
  },
] as const;

const gymnasticsModules = [
  "Meet schedule and session timing",
  "Venue details, parking, and maps",
  "Documents, announcements, and links",
  "One shareable destination for families and coaches",
] as const;

const snapModules = [
  "Upload or snap the image you already have",
  "Extract title, date, time, and location details",
  "Review and refine before sharing",
  "Publish a polished page instead of a messy thread",
] as const;

export default function Features() {
  return (
    <section className="py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-[#856ed1]">
            Product depth
          </p>
          <h2
            className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[#17132b] sm:text-5xl"
            style={{
              fontFamily:
                'var(--font-montserrat), var(--font-sans), sans-serif',
            }}
          >
            Concrete product value, not generic marketing promises.
          </h2>
          <p className="mt-5 text-lg leading-8 text-[#58536e]">
            Envitefy is useful because it turns messy inputs into usable event
            pages. These are the product capabilities people actually care
            about.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {featureCards.map(({ icon: Icon, title, copy }) => (
            <article
              key={title}
              className="rounded-[2rem] border border-[#ece4ff] bg-white p-7 shadow-[0_20px_55px_rgba(102,76,189,0.08)]"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#f1e9ff_0%,#ffffff_100%)] text-[#6d52cc] shadow-[0_10px_24px_rgba(108,82,196,0.1)]">
                <Icon className="h-5 w-5" />
              </div>
              <h3
                className="mt-5 text-xl font-semibold tracking-[-0.03em] text-[#1b1530]"
                style={{
                  fontFamily:
                    'var(--font-montserrat), var(--font-sans), sans-serif',
                }}
              >
                {title}
              </h3>
              <p className="mt-3 text-base leading-7 text-[#59546c]">{copy}</p>
            </article>
          ))}
        </div>

        <div className="mt-12 space-y-8">
          <article className="overflow-hidden rounded-[2.5rem] border border-[#e9dfff] bg-white p-6 shadow-[0_28px_70px_rgba(96,69,183,0.1)] sm:p-8">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1.06fr)_minmax(0,0.94fr)] lg:items-center">
              <GymnasticsMeetPreview className="min-h-[unset] pt-0" />

              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#e7ddff] bg-[#f8f4ff] px-4 py-2 text-sm font-semibold text-[#6148c3]">
                  <Smartphone className="h-4 w-4" />
                  Gymnastics page modules
                </div>
                <h3
                  className="mt-5 text-[2rem] font-semibold leading-tight tracking-[-0.05em] text-[#17132b] sm:text-[2.5rem]"
                  style={{
                    fontFamily:
                      'var(--font-montserrat), var(--font-sans), sans-serif',
                  }}
                >
                  A better destination for meet weekends.
                </h3>
                <p className="mt-5 text-lg leading-8 text-[#58536e]">
                  Gymnastics is strongest when the page feels like a polished
                  event product, not a static packet. Families should be able to
                  find what they need in seconds.
                </p>

                <div className="mt-6 grid gap-3">
                  {gymnasticsModules.map((item, index) => {
                    const icons = [Route, MapIcon, Link2, Megaphone];
                    const Icon = icons[index];

                    return (
                      <div
                        key={item}
                        className="flex items-center gap-3 rounded-2xl border border-[#efe8ff] bg-[#faf7ff] px-4 py-3"
                      >
                        <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#6f55c9] shadow-sm">
                          <Icon className="h-4.5 w-4.5" />
                        </div>
                        <p className="text-sm font-semibold text-[#2f2550]">
                          {item}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </article>

          <article className="overflow-hidden rounded-[2.5rem] border border-[#e9dfff] bg-[linear-gradient(180deg,#ffffff_0%,#faf7ff_100%)] p-6 shadow-[0_24px_64px_rgba(96,69,183,0.08)] sm:p-8">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-center">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#e7ddff] bg-white px-4 py-2 text-sm font-semibold text-[#6148c3]">
                  <ScanText className="h-4 w-4" />
                  Snap-to-page workflow
                </div>
                <h3
                  className="mt-5 text-[2rem] font-semibold leading-tight tracking-[-0.05em] text-[#17132b] sm:text-[2.5rem]"
                  style={{
                    fontFamily:
                      'var(--font-montserrat), var(--font-sans), sans-serif',
                  }}
                >
                  Start from the image. End with a usable event page.
                </h3>
                <p className="mt-5 text-lg leading-8 text-[#58536e]">
                  Snap matters because the input is usually imperfect. The value
                  is not just OCR. It is getting from the messy original to a
                  page that is structured, clean, and easy to share.
                </p>

                <div className="mt-6 space-y-3">
                  {snapModules.map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-[#efe8ff] bg-white px-4 py-3 text-sm font-semibold text-[#2f2550] shadow-sm"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <SnapEventPreview />
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
