import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export default function TemplateGalleryBackLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="mb-5 inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-full border border-[#e4cdb6] bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#725744] shadow-sm transition hover:border-[#d87338] hover:text-[#a74920] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d87338]/40"
    >
      <ChevronLeft size={15} aria-hidden="true" />
      {children}
    </Link>
  );
}
