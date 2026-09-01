import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type ShowroomItem = {
  alt: string;
  audience: string;
  href: string;
  label: string;
  src: string;
};

export default function TemplateShowroom({
  ariaLabel,
  items,
}: {
  ariaLabel: string;
  items: readonly ShowroomItem[];
}) {
  return (
    <figure aria-label={ariaLabel} className="relative isolate">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            aria-label={`View the ${item.label} complete event-page design: ${item.alt}`}
            className="group relative isolate aspect-[8/5] min-w-0 overflow-hidden rounded-[0.9rem] border border-white/20 bg-[#2d1726] shadow-[0_16px_38px_rgba(20,8,16,0.34)] outline-none transition duration-300 ease-out hover:z-10 hover:-translate-y-1 focus-visible:z-10 focus-visible:-translate-y-1 focus-visible:ring-2 focus-visible:ring-[#ffd18f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#2d1726] motion-reduce:transition-none sm:rounded-[1.1rem]"
          >
            <Image
              src={item.src}
              alt=""
              fill
              sizes="(min-width: 1536px) 345px, (min-width: 640px) 24vw, 48vw"
              className="object-cover transition duration-500 ease-out group-hover:scale-[1.045] group-focus-visible:scale-[1.045] motion-reduce:transition-none"
            />
            <span
              className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent"
              aria-hidden="true"
            />
            <span className="absolute inset-x-3 bottom-2.5 text-white sm:inset-x-4 sm:bottom-3.5">
              <span className="block truncate text-[9px] font-black uppercase tracking-[0.16em] sm:text-xs">
                {item.label}
              </span>
              <span className="mt-0.5 flex min-w-0 items-center justify-between gap-2 text-[9px] font-medium text-white/78 sm:text-sm">
                <span className="truncate">{item.audience}</span>
                <ArrowUpRight
                  className="h-3.5 w-3.5 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-focus-visible:translate-x-0.5 group-focus-visible:-translate-y-0.5 sm:h-4 sm:w-4"
                  aria-hidden="true"
                />
              </span>
            </span>
          </Link>
        ))}
      </div>
    </figure>
  );
}
