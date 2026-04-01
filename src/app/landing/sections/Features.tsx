import { Calendar, Camera, Globe, Trophy } from "lucide-react";

const featureCards = [
  {
    icon: Camera,
    title: "Snap-first capture",
    description:
      "Snap reads flyers, screenshots, and invites so you can review event details instead of typing them from scratch.",
    accent: "bg-blue-100 text-blue-600",
  },
  {
    icon: Calendar,
    title: "Calendar-ready details",
    description:
      "Dates, times, venues, and reminders stay clean and ready for Google, Apple, and Outlook.",
    accent: "bg-violet-100 text-violet-600",
  },
  {
    icon: Trophy,
    title: "Gymnastics meet pages",
    description:
      "Gymnastics accounts get session schedules, venue logistics, and polished meet pages built for parents and coaches.",
    accent: "bg-amber-100 text-amber-600",
  },
  {
    icon: Globe,
    title: "One link to share",
    description:
      "Share a polished page with the latest details instead of chasing screenshots, PDFs, and message threads.",
    accent: "bg-emerald-100 text-emerald-600",
  },
] as const;

export default function Features() {
  return (
    <section id="features" className="border-t border-gray-100 bg-gray-50 py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-100 bg-violet-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-violet-600">
            <span>Features</span>
          </div>
          <h2 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 md:text-6xl">
            Built for
            <span className="bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
              {" "}
              Snap and Gymnastics
            </span>
          </h2>
          <p className="text-xl text-gray-600">
            Two focused product surfaces: quick capture for everyone, plus meet
            workflows for gymnastics families and coaches.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {featureCards.map(({ icon: Icon, title, description, accent }) => (
            <div
              key={title}
              className="rounded-[2rem] border border-gray-100 bg-white p-8 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] transition-transform duration-300 hover:-translate-y-1"
            >
              <div className={`mb-6 flex h-12 w-12 items-center justify-center rounded-2xl ${accent}`}>
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-gray-900">{title}</h3>
              <p className="leading-relaxed text-gray-600">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
