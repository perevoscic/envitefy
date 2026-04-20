"use client";

import type { ReactNode, SetStateAction } from "react";
import { Tabs, type ITab } from "@/components/ui/tabs-1";
import type { StudioWorkspaceView } from "../studio-types";

type StudioWorkspaceShellProps = {
  activeView: StudioWorkspaceView;
  onViewChange: (view: StudioWorkspaceView) => void;
  librarySyncError: string | null;
  showLibrarySyncError: boolean;
  onRetryLibrarySync: () => void;
  shellMode?: "full" | "immersive-mobile-preview";
  children: ReactNode;
};

export function StudioWorkspaceShell({
  activeView,
  onViewChange,
  librarySyncError,
  showLibrarySyncError,
  onRetryLibrarySync,
  shellMode = "full",
  children,
}: StudioWorkspaceShellProps) {
  const isImmersiveMobilePreview = shellMode === "immersive-mobile-preview";
  const tabs: ITab[] = [
    { title: "Create", value: "create" },
    { title: "Library", value: "library" },
  ];

  const handleSelectedChange = (nextValue: SetStateAction<string>) => {
    const resolved =
      typeof nextValue === "function" ? nextValue(activeView) : nextValue;
    if (resolved === activeView) return;
    if (resolved === "create" || resolved === "library") {
      onViewChange(resolved);
    }
  };

  return (
    <div className="studio-shell relative min-h-screen overflow-hidden bg-[#f4f1fb] text-[#1A1A1A] selection:bg-[#e3d7fb] lg:flex lg:h-screen lg:flex-col">
      <div className="pointer-events-none absolute -left-[180px] -top-[180px] h-[430px] w-[430px] rounded-full border border-[#bda8df]/14" />

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

      <main
        className={
          isImmersiveMobilePreview
            ? "relative min-h-[100dvh] w-full"
            : "relative mx-auto w-full max-w-[1600px] px-6 py-10 sm:px-8 lg:flex lg:h-full lg:min-h-0 lg:flex-1 lg:flex-col lg:pl-12 lg:pr-4 lg:pb-0 lg:pt-8"
        }
      >
        {!isImmersiveMobilePreview ? (
          <div className="mb-8 max-w-[1400px]">
            <div className="w-fit">
              <Tabs
                selected={activeView}
                setSelected={handleSelectedChange}
                tabs={tabs}
                variant="primary"
              />
            </div>
          </div>
        ) : null}

        <div className="lg:min-h-0 lg:flex-1">
          {children}
        </div>
      </main>

      <div className="pointer-events-none fixed left-1/2 top-0 -z-10 h-[600px] w-[1000px] -translate-x-1/2 bg-[#d9cdf6]/28 blur-[120px]" />
    </div>
  );
}
