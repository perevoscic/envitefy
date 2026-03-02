"use client";

import { useCallback, useEffect } from "react";

type Props = {
  eventId: string;
  children: React.ReactNode;
};

export default function DiscoveryEventEditLayout({ eventId, children }: Props) {
  const customizeUrl = `/event/gymnastics/customize?edit=${encodeURIComponent(
    eventId
  )}&embed=1`;

  const handleMessage = useCallback((e: MessageEvent) => {
    if (e.data?.type === "envitefy:discovery-edit-saved" && e.data?.eventId === eventId) {
      const redirectUrl =
        typeof e.data?.redirectUrl === "string" ? e.data.redirectUrl : "";
      if (redirectUrl) {
        window.location.assign(redirectUrl);
        return;
      }
      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.delete("edit");
      nextUrl.searchParams.set("updated", "true");
      nextUrl.searchParams.set("t", Date.now().toString());
      window.location.assign(nextUrl.toString());
    }
  }, [eventId]);

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full">
      <div className="min-w-0 flex-1">{children}</div>
      <aside
        className="w-full border-t border-slate-200 bg-white md:border-t-0 md:border-l md:max-w-[420px] md:flex-shrink-0 md:relative md:z-[60]"
        aria-label="Edit sidebar"
      >
        <iframe
          src={customizeUrl}
          title="Edit event"
          className="block w-full h-[80vh] min-h-[480px] md:h-full md:min-h-[100vh]"
        />
      </aside>
    </div>
  );
}
