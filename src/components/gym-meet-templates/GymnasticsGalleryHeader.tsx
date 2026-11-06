import { Check, Sparkles } from "lucide-react";
import GymnasticsLauncher from "@/components/event-create/GymnasticsLauncher";
import CategoryGalleryBackdrop from "@/components/events/CategoryGalleryBackdrop";

const IMPORTED_DETAILS = ["Sessions & schedule", "Venue, parking & hotels", "Admission & results"];

export default function GymnasticsGalleryHeader({
  count,
  forwardQueryString,
}: {
  count: number;
  forwardQueryString?: string;
}) {
  return (
    <header className="relative isolate overflow-hidden border-b border-[#e4ddea] bg-transparent px-5 py-8 text-foreground sm:px-8 lg:px-12 lg:py-10">
      <CategoryGalleryBackdrop category="gymnastics" />
      <div className="relative z-10 mx-auto grid max-w-[1500px] gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(360px,440px)] lg:items-center lg:gap-12">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#e1d6e9] bg-white/90 px-4 py-2 text-xs font-semibold text-[#796189]">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {count} meet designs
          </p>
          <h1 className="mt-5 text-4xl font-normal tracking-tight [font-family:var(--font-playfair),Georgia,serif] sm:text-5xl lg:text-6xl">
            Gymnastics
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-7 text-[#6a5b78] sm:text-base">
            Bring in your meet packet or the organizer’s link and we’ll fill a page for you, or
            pick a design below and add the details yourself.
          </p>
          <ul className="mt-4 hidden flex-wrap gap-x-5 gap-y-2 sm:flex text-[13px] font-medium text-[#5d4f6b]">
            {IMPORTED_DETAILS.map((item) => (
              <li key={item} className="inline-flex items-center gap-1.5">
                <Check className="h-4 w-4 text-[#7b5fb8]" strokeWidth={2.5} aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <GymnasticsLauncher
          variant="panel"
          forwardQueryString={forwardQueryString}
          panelTitle="Start from your meet details"
          panelDescription="Upload the meet packet or paste the organizer’s link. We’ll build an editable draft you can review before publishing."
        />
      </div>
    </header>
  );
}
