import {
  FileText,
  Hotel,
  MapPinned,
  Medal,
  Route,
  ScanSearch,
  Ticket,
  Users,
} from "lucide-react";
import styles from "./gymnastics-landing.module.css";

const modules = [
  {
    title: "Session schedule",
    copy: "Warm-up, march-in, competition, and awards timing in a format parents can actually scan on a phone.",
    icon: ScanSearch,
    span: "xl:col-span-5",
    tone: "dark",
  },
  {
    title: "Rotation details",
    copy: "Keep the moving pieces of a gymnastics meet organized instead of leaving them buried in a packet table.",
    icon: Route,
    span: "xl:col-span-4",
    tone: "light",
  },
  {
    title: "Spectator guide",
    copy: "Admission, seating, doors, and practical notes for guests who are not reading the coach packet.",
    icon: Ticket,
    span: "xl:col-span-3",
    tone: "gold",
  },
  {
    title: "Venue map",
    copy: "Entry points, parking flow, and where families should actually go when they arrive.",
    icon: MapPinned,
    span: "xl:col-span-4",
    tone: "light",
  },
  {
    title: "Hotels",
    copy: "Attach lodging and booking details directly to the published meet page.",
    icon: Hotel,
    span: "xl:col-span-2",
    tone: "light",
  },
  {
    title: "Athlete list",
    copy: "Helpful gym-facing context for coaches and traveling families following the meet.",
    icon: Users,
    span: "xl:col-span-3",
    tone: "light",
  },
  {
    title: "Live results",
    copy: "Results links sit beside the rest of the meet details instead of showing up later in a text thread.",
    icon: Medal,
    span: "xl:col-span-3",
    tone: "light",
  },
  {
    title: "Documents",
    copy: "Meet packets, schedules, forms, and PDFs stay connected to the clean published page.",
    icon: FileText,
    span: "xl:col-span-4",
    tone: "light",
  },
];

const toneClasses: Record<string, string> = {
  dark: "border-[#25285e] bg-[#171b46] text-white shadow-[0_24px_60px_rgba(23,27,70,0.18)]",
  gold: "border-[#e5d39a] bg-[#fff8e7] text-[#171b46]",
  light: "border-[#dde2ee] bg-white text-[#171b46]",
};

const iconToneClasses: Record<string, string> = {
  dark: "bg-white/10 text-[#f1d56e]",
  gold: "bg-[#efe0ab] text-[#775d17]",
  light: "bg-[#f2f2fb] text-[#4f46e5]",
};

export default function MeetModules() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
      <div className={`${styles.container} grid gap-10 xl:grid-cols-[minmax(300px,0.6fr)_minmax(0,1.4fr)] xl:items-start`}>
        <div className="max-w-[520px] xl:pt-6">
          <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[#4f46e5]">
            Meet modules
          </p>
          <h2 className="mt-4 text-4xl font-bold tracking-[-0.045em] text-[#17153f] sm:text-5xl">
            Everything a gymnastics meet page actually needs
          </h2>
          <p className="mt-6 text-lg leading-8 text-[#55627f]">
            This should feel like a meet operations page made for gymnastics,
            not a generic sports dashboard. The structure follows the way real
            gymnastics weekends unfold.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-12">
          {modules.map(({ title, copy, icon: Icon, span, tone }) => (
            <article
              key={title}
              className={`rounded-[1.9rem] border p-6 ${toneClasses[tone]} ${span}`}
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconToneClasses[tone]}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <h3 className={`mt-5 text-[1.45rem] font-semibold ${tone === "dark" ? "text-white" : "text-[#171b46]"}`}>
                {title}
              </h3>
              <p className={`mt-3 text-sm leading-7 ${tone === "dark" ? "text-[#dbe0fa]" : "text-[#586581]"}`}>
                {copy}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
