"use client";

import Link from "next/link";
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";
import {
  trackEventInteraction,
  type ClientTrackingEventName,
} from "@/utils/event-tracking-client";

type EventTrackedLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "onClick"> & {
  href: string;
  eventId: string;
  eventName: ClientTrackingEventName;
  targetLabel?: string | null;
  sourceSurface?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
  children: ReactNode;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
};

export default function EventTrackedLink({
  href,
  eventId,
  eventName,
  targetLabel,
  sourceSurface,
  metadata,
  children,
  onClick,
  ...props
}: EventTrackedLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    trackEventInteraction({
      eventId,
      eventName,
      targetUrl: href,
      targetLabel,
      sourceSurface,
      metadata,
    });
    onClick?.(event);
  };

  if (href.startsWith("/")) {
    return (
      <Link href={href} {...props} onClick={handleClick}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} {...props} onClick={handleClick}>
      {children}
    </a>
  );
}
