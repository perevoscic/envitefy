"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";

type Props = {
  eventId: string;
  customizeUrl?: string;
  children: React.ReactNode;
};

export default function DiscoveryEventEditLayout({
  eventId,
  customizeUrl,
  children,
}: Props) {
  const [mobileEditorOpen, setMobileEditorOpen] = useState(false);
  const resolvedCustomizeUrl =
    customizeUrl ||
    `/event/gymnastics/customize?edit=${encodeURIComponent(eventId)}&embed=1`;

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

  useEffect(() => {
    if (!mobileEditorOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [mobileEditorOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const html = document.documentElement;
    const body = document.body;
    const originalHtmlOverflow = html.style.overflow;
    const originalBodyOverflow = body.style.overflow;

    const syncDesktopOverflow = () => {
      const isDesktop = window.innerWidth >= 768;
      html.style.overflow = isDesktop ? "hidden" : originalHtmlOverflow;
      body.style.overflow = isDesktop ? "hidden" : originalBodyOverflow;
    };

    syncDesktopOverflow();
    window.addEventListener("resize", syncDesktopOverflow);

    return () => {
      window.removeEventListener("resize", syncDesktopOverflow);
      html.style.overflow = originalHtmlOverflow;
      body.style.overflow = originalBodyOverflow;
    };
  }, []);

  useEffect(() => {
    if (window.innerWidth < 768) {
      setMobileEditorOpen(true);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileEditorOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const openFromTopBar = () => setMobileEditorOpen(true);
    window.addEventListener("envitefy:open-discovery-editor", openFromTopBar);
    return () =>
      window.removeEventListener(
        "envitefy:open-discovery-editor",
        openFromTopBar
      );
  }, []);

  return (
    <div className="relative flex min-h-screen w-full flex-col md:h-[100dvh] md:min-h-0 md:flex-row md:overflow-hidden">
      <div className="min-w-0 flex-1 md:min-h-0 md:overflow-y-auto">{children}</div>

      {mobileEditorOpen && (
        <div className="fixed inset-0 z-[7600] md:hidden" aria-hidden="true">
          <button
            type="button"
            className="absolute inset-0 h-full w-full bg-slate-900/55 backdrop-blur-[1px]"
            onClick={() => setMobileEditorOpen(false)}
            aria-label="Close edit panel"
          />
        </div>
      )}

      <aside
        className={`fixed inset-y-0 right-0 z-[7700] h-dvh w-screen border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 md:hidden ${
          mobileEditorOpen ? "translate-x-0" : "translate-x-full"
        } flex flex-col`}
        aria-label="Edit sidebar mobile"
      >
        <div className="border-b border-slate-100 bg-white px-3 pb-3 pt-[max(0.5rem,env(safe-area-inset-top))]">
          <button
            type="button"
            onClick={() => setMobileEditorOpen(false)}
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
            aria-label="Back to event"
          >
            <ChevronLeft size={16} />
            Back to event
          </button>
        </div>
        <iframe
          src={resolvedCustomizeUrl}
          title="Edit event"
          className="block min-h-0 flex-1 w-full"
        />
      </aside>

      <aside
        className="hidden w-full overflow-hidden border-t border-slate-200 bg-white md:sticky md:top-0 md:z-[60] md:flex md:h-[100dvh] md:max-w-[420px] md:flex-shrink-0 md:self-start md:flex-col md:border-t-0 md:border-l"
        aria-label="Edit sidebar"
      >
        <iframe
          src={resolvedCustomizeUrl}
          title="Edit event"
          className="block h-full min-h-0 w-full flex-1"
        />
      </aside>
    </div>
  );
}
