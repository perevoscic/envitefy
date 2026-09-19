"use client";

import { Eye, MessageCircle } from "lucide-react";
import { type ReactNode, useEffect, useRef, useSyncExternalStore } from "react";
import styles from "./ChatWorkspace.module.css";

type ChatView = "chat" | "preview";

function subscribeToDesktop(onChange: () => void) {
  const query = window.matchMedia("(min-width: 1024px)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const getIsDesktop = () => window.matchMedia("(min-width: 1024px)").matches;
const getServerIsDesktop = () => false;

export default function ChatWorkspace({
  view,
  onViewChange,
  chat,
  preview,
}: {
  view: ChatView;
  onViewChange: (view: ChatView) => void;
  chat: ReactNode;
  preview: ReactNode;
}) {
  const isDesktop = useSyncExternalStore(subscribeToDesktop, getIsDesktop, getServerIsDesktop);
  const hasPreview = Boolean(preview);
  const activeView = hasPreview ? view : "chat";
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (isDesktop || activeView !== "preview") return;
    const focused = document.activeElement;
    if (focused instanceof HTMLElement && document.getElementById("create-chat-panel")?.contains(focused)) focused.blur();
  }, [activeView, isDesktop]);

  return (
    <section className={styles.workspace}>
      <div className={styles.header}>
        {hasPreview ? (
          <div className={styles.tabs} role="tablist" aria-label="Create view">
            <span className={styles.indicator} data-view={activeView} aria-hidden="true" />
            {(["chat", "preview"] as const).map((tab) => {
              const Icon = tab === "chat" ? MessageCircle : Eye;
              return (
                <button
                  key={tab}
                  id={`create-${tab}-tab`}
                  type="button"
                  role="tab"
                  aria-selected={activeView === tab}
                  aria-controls={`create-${tab}-panel`}
                  tabIndex={activeView === tab ? 0 : -1}
                  className={styles.tab}
                  onClick={() => onViewChange(tab)}
                  onKeyDown={(event) => {
                    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
                    event.preventDefault();
                    const next = event.key === "Home" ? "chat" : event.key === "End" ? "preview" : tab === "chat" ? "preview" : "chat";
                    onViewChange(next);
                    document.getElementById(`create-${next}-tab`)?.focus({ preventScroll: true });
                  }}
                >
                  <Icon className="size-4 shrink-0" strokeWidth={2} aria-hidden="true" />
                  {tab === "chat" ? "Chat" : "Preview"}
                </button>
              );
            })}
          </div>
        ) : (
          <div className={styles.title}>Create</div>
        )}
      </div>
      <div className={styles.viewport}>
        <div
          className={styles.track}
          data-view={activeView}
          data-has-preview={hasPreview}
          onTouchStart={(event) => {
            touchStart.current = null;
            if (isDesktop || !hasPreview || event.touches.length !== 1) return;
            if (event.target instanceof Element && event.target.closest("button, a, input, textarea, select, [role='dialog'], [data-live-card-panel]")) return;
            touchStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
          }}
          onTouchCancel={() => { touchStart.current = null; }}
          onTouchEnd={(event) => {
            const start = touchStart.current;
            touchStart.current = null;
            if (!start || event.changedTouches.length !== 1 || event.touches.length) return;
            const dx = event.changedTouches[0].clientX - start.x;
            const dy = event.changedTouches[0].clientY - start.y;
            if (Math.abs(dx) < 64 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
            if (activeView === "chat" && dx < 0) onViewChange("preview");
            if (activeView === "preview" && dx > 0) onViewChange("chat");
          }}
        >
          <div
            id="create-chat-panel"
            role="tabpanel"
            aria-label="Chat"
            aria-labelledby={!isDesktop && hasPreview ? "create-chat-tab" : undefined}
            inert={!isDesktop && activeView !== "chat"}
            className={styles.pane}
            data-active={activeView === "chat"}
          >
            {chat}
          </div>
          <div
            id="create-preview-panel"
            role="tabpanel"
            aria-label="Preview"
            aria-labelledby={!isDesktop && hasPreview ? "create-preview-tab" : undefined}
            inert={!hasPreview || (!isDesktop && activeView !== "preview")}
            className={styles.pane}
            data-active={activeView === "preview"}
          >
            {preview}
          </div>
        </div>
      </div>
    </section>
  );
}
