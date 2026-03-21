"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";
import { openAppleCalendarIcs } from "@/utils/calendar-open";

type Props = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "href" | "onClick"
> & {
  href: string;
  children: ReactNode;
};

/**
 * Apple Calendar: webcal:// handoff via calendar-open (see calendar-open.ts).
 */
export default function AppleCalendarLink({ href, children, ...rest }: Props) {
  return (
    <a
      {...rest}
      href={href}
      onClick={(e) => {
        e.preventDefault();
        openAppleCalendarIcs(href);
      }}
    >
      {children}
    </a>
  );
}
