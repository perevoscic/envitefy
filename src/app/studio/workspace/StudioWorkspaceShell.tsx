"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Tabs, type ITab } from "@/components/ui/tabs-1";
import type { StudioWorkspaceView } from "../studio-types";

type StudioWorkspaceShellProps = {
  activeView: StudioWorkspaceView;
  onViewChange: (view: StudioWorkspaceView) => void;
  librarySyncError: string | null;
  showLibrarySyncError: boolean;
  onRetryLibrarySync: () => void;
  children: ReactNode;
};

export function StudioWorkspaceShell({
  activeView,
  onViewChange,
  librarySyncError,
  showLibrarySyncError,
  onRetryLibrarySync,
  children,
}: StudioWorkspaceShellProps) {
  const [selected, setSelected] = useState<string>(activeView);

  useEffect(() => {
    setSelected(activeView);
  }, [activeView]);

  useEffect(() => {
    if (selected === activeView) return;
    if (selected === "create" || selected === "library") {
      onViewChange(selected);
    }
  }, [activeView, onViewChange, selected]);

  const tabs: ITab[] = [
    { title: "Create", value: "create" },
    { title: "Library", value: "library" },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F5F2EF] text-[#1A1A1A] selection:bg-[#e7d9c8]">
      <div className="pointer-events-none absolute -left-[180px] -top-[180px] h-[430px] w-[430px] rounded-full border border-[#8C7B65]/10" />

      {showLibrarySyncError && librarySyncError ? (
        <div
          role="status"
          className="border-b border-[#d9c7ab] bg-[#f5eadc] px-5 py-3 text-center text-sm text-[#5F5345] sm:px-6"
        >
          <span>{librarySyncError}</span>
          <button
            type="button"
            onClick={onRetryLibrarySync}
            className="ml-2 font-semibold text-[#1A1A1A] underline decoration-[#8C7B65]/60 underline-offset-2 hover:text-[#4A4036]"
          >
            Retry sync
          </button>
        </div>
      ) : null}

      <main className="relative mx-auto w-full max-w-[1600px] px-6 py-10 sm:px-8 lg:px-12 lg:py-14">
        <div className="mx-auto mb-10 max-w-[1400px]">
          <div className="w-fit">
            <Tabs selected={selected} setSelected={setSelected} tabs={tabs} variant="primary" />
          </div>
        </div>

        {children}
      </main>

      <div className="pointer-events-none fixed left-1/2 top-0 -z-10 h-[600px] w-[1000px] -translate-x-1/2 bg-[#8C7B65]/6 blur-[120px]" />
    </div>
  );
}
