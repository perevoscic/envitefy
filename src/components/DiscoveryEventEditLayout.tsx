"use client";

import { useCallback, useEffect } from "react";

type Props = {
  eventId: string;
  children: React.ReactNode;
};

export default function DiscoveryEventEditLayout({ eventId, children }: Props) {
  const customizeUrl = `/event/gymnastics/customize?edit=${encodeURIComponent(eventId)}&embed=1`;

  const handleMessage = useCallback((e: MessageEvent) => {
    if (e.data?.type === "envitefy:discovery-edit-saved" && e.data?.eventId === eventId) {
      window.location.reload();
    }
  }, [eventId]);

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  return (
    <div className="flex min-h-screen w-full">
      <div className="min-w-0 flex-1">{children}</div>
      <aside
        className="hidden w-full border-l border-slate-200 bg-white md:block md:max-w-[420px] md:flex-shrink-0 md:relative md:z-[60]"
        aria-label="Edit sidebar"
      >
        <iframe
          src={customizeUrl}
          title="Edit event"
          className="h-full min-h-[100vh] w-full"
          style={{ display: "block" }}
        />
      </aside>
    </div>
  );
}
