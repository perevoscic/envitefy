import {
  CheckCheck,
  LayoutDashboard,
  PencilLine,
  Smartphone,
} from "lucide-react";

const features = [
  {
    icon: PencilLine,
    title: "No manual entry",
    desc: "Start from the schedule, flyer, invite, or PDF you already have instead of rebuilding the event by hand.",
  },
  {
    icon: CheckCheck,
    title: "Faster sharing",
    desc: "Send one clean link instead of passing around screenshots, attachments, and scattered message threads.",
  },
  {
    icon: LayoutDashboard,
    title: "Cleaner communication",
    desc: "Schedule changes, venue notes, maps, documents, and new links stay in one place instead of scattered across texts and attachments.",
  },
  {
    icon: Smartphone,
    title: "App-free mobile access",
    desc: "Families, coaches, and guests open the page in the browser without installing anything first.",
  },
] as const;

export default function FeatureGrid() {
  return (
    <section id="features" className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-[#856ed1]">
            Core benefits
          </p>
          <h2
            className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[#17132b] sm:text-5xl"
            style={{
              fontFamily:
                'var(--font-montserrat), var(--font-sans), sans-serif',
            }}
          >
            Four practical reasons the workflow lands quickly.
          </h2>
          <p className="mt-5 text-lg leading-8 text-[#58536e]">
            Envitefy works best when the outcome is practical: less typing,
            fewer questions, cleaner sharing, and a page that works on mobile.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {features.map(({ icon: Icon, title, desc }, index) => (
            <article
              key={title}
              className={`rounded-[2rem] border border-[#ece4ff] bg-white p-7 shadow-[0_20px_55px_rgba(102,76,189,0.08)] transition-transform duration-200 hover:-translate-y-1 ${
                index % 2 === 1 ? "md:translate-y-6" : ""
              }`}
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
              <p className="mt-3 text-base leading-7 text-[#59546c]">{desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
