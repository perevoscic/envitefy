"use client";

import { useCallback, useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

type Props = {
  eventId: string;
  children: React.ReactNode;
};

export default function DiscoveryEventEditLayout({ eventId, children }: Props) {
  const [mobileEditorOpen, setMobileEditorOpen] = useState(false);
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

  useEffect(() => {
    if (!mobileEditorOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [mobileEditorOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileEditorOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="relative flex min-h-screen w-full flex-col md:flex-row">
      <div className="min-w-0 flex-1">{children}</div>

      <button
        type="button"
        onClick={() => setMobileEditorOpen(true)}
        className="fixed right-[calc(1rem+env(safe-area-inset-right))] top-[calc(0.9rem+env(safe-area-inset-top))] z-[70] inline-flex items-center gap-2 rounded-full border border-[#d8d1f3] bg-white/96 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-[#2f2550] shadow-[0_12px_26px_rgba(76,55,134,0.22)] backdrop-blur-sm md:hidden"
        aria-label="Customize your meet"
      >
        <Menu size={16} />
        Customize
      </button>

      {mobileEditorOpen && (
        <div className="fixed inset-0 z-[75] md:hidden" aria-hidden="true">
          <button
            type="button"
            className="absolute inset-0 h-full w-full bg-slate-900/55 backdrop-blur-[1px]"
            onClick={() => setMobileEditorOpen(false)}
            aria-label="Close edit panel"
          />
        </div>
      )}

      <aside
        className={`fixed inset-y-0 right-0 z-[80] w-[min(92vw,420px)] border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 md:hidden ${
          mobileEditorOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Edit sidebar mobile"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3">
          <span className="text-sm font-semibold text-slate-800">
            Customize your meet
          </span>
          <button
            type="button"
            onClick={() => setMobileEditorOpen(false)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-700"
            aria-label="Close edit panel"
          >
            <X size={16} />
          </button>
        </div>
        <iframe
          src={customizeUrl}
          title="Edit event"
          className="block h-[calc(100dvh-58px)] w-full"
        />
      </aside>

      <aside
        className="hidden w-full border-t border-slate-200 bg-white md:block md:border-t-0 md:border-l md:max-w-[420px] md:flex-shrink-0 md:relative md:z-[60]"
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
