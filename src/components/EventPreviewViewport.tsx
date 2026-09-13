"use client";

import { Maximize2, Monitor, Smartphone, Tablet, X } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  DEFAULT_PREVIEW_BACKGROUND,
  createEventPreviewBackgroundController,
} from "@/lib/event-preview-background";
import {
  EVENT_PREVIEW_DEVICES,
  type EventPreviewDevice,
  getEventPreviewLayout,
  initialEventPreviewDevice,
} from "@/lib/event-preview-viewport";
import OwnerPreviewMobileTopbarSuppressor from "./OwnerPreviewMobileTopbarSuppressor";
import EventCanvas from "./EventCanvas";
import { useEventPageColor } from "@/hooks/useEventPageChrome";
import type { EventPreviewBackground } from "@/lib/event-preview-background";
import { isDarkEventPageColor } from "@/lib/event-page-chrome";

const deviceIcons = { desktop: Monitor, tablet: Tablet, mobile: Smartphone };
const deviceOrder: EventPreviewDevice[] = ["desktop", "tablet", "mobile"];
const previewDocumentHtml =
  '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0"><div id="event-preview-content"></div></body></html>';

type Props = {
  title: string;
  src?: string;
  children?: ReactNode;
  onClose?: () => void;
  returnHref?: string;
  fullscreen?: boolean;
  preserveNavigation?: boolean;
  initialDevice?: EventPreviewDevice;
  onExpand?: () => void;
  actions?: ReactNode;
  closeLabel?: string;
  onBackgroundChange?: (background: EventPreviewBackground) => void;
  initialBackground?: EventPreviewBackground;
};

/** A real iframe viewport keeps media queries and fixed artwork tied to the selected device. */
export default function EventPreviewViewport({
  title,
  src,
  children,
  onClose,
  returnHref,
  fullscreen = false,
  preserveNavigation = false,
  initialDevice,
  onExpand,
  actions,
  closeLabel = "Close preview",
  onBackgroundChange,
  initialBackground,
}: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const initializedDevice = useRef(false);
  const [device, setDevice] = useState<EventPreviewDevice>("desktop");
  const [available, setAvailable] = useState({ width: 0, height: 0, browserWidth: 0 });
  const [frameDocument, setFrameDocument] = useState<Document | null>(null);
  const [background, setBackground] = useState(() => initialBackground?.backgroundColor ? { ...DEFAULT_PREVIEW_BACKGROUND, ...initialBackground } : DEFAULT_PREVIEW_BACKGROUND);
  useEventPageColor(String(background.backgroundColor || ""), preserveNavigation);
  const nativeMobile = device === "mobile" && available.browserWidth > 0 && available.browserWidth < 768;
  const floatingToolbar = preserveNavigation || nativeMobile;
  const { viewport, fit } = getEventPreviewLayout(
    device,
    available.width,
    available.height,
    nativeMobile,
  );
  const closePreview = useCallback(() => {
    if (onClose) onClose();
    else if (returnHref) window.location.assign(returnHref);
  }, [onClose, returnHref]);
  const canConnectDocument = useCallback(
    (doc: Document | null) =>
      Boolean(
        doc?.querySelector("#event-preview-content, [data-app-main-content]") &&
        (!preserveNavigation || !src || doc.documentElement.getAttribute("data-owner-preview-open") === "true"),
      ),
    [preserveNavigation, src],
  );

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setAvailable({ width, height, browserWidth: window.innerWidth });
      if (!initializedDevice.current && width > 0) {
        initializedDevice.current = true;
        setDevice(initialDevice || initialEventPreviewDevice(window.innerWidth));
      }
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, [initialDevice]);

  useEffect(() => {
    if (!fullscreen) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, [fullscreen]);

  useEffect(() => onBackgroundChange?.(background), [background, onBackgroundChange]);

  // Wait for the app shell's commit before connecting its preview document.
  // Nested event content may hydrate later; background styling leaves its
  // React-owned attributes untouched. Load can lag behind fonts and assets.
  useEffect(() => {
    let timer: number | undefined;
    const connectDocument = () => {
      const doc = frameRef.current?.contentDocument || null;
      if (canConnectDocument(doc)) {
        setFrameDocument(doc);
        return;
      }
      timer = window.setTimeout(connectDocument, 100);
    };
    connectDocument();
    return () => window.clearTimeout(timer);
  }, [canConnectDocument]);

  // In-memory artwork stays in React; only its rendering moves into a device-sized document.
  useEffect(() => {
    if (!frameDocument || src) return;
    const copyStyles = () => {
      frameDocument.documentElement.className = document.documentElement.className;
      frameDocument.body.className = document.body.className;
      frameDocument.querySelectorAll("[data-event-preview-style]").forEach((node) => {
        node.remove();
      });
      for (const node of document.head.querySelectorAll('style, link[rel="stylesheet"]')) {
        const copy = node.cloneNode(true) as HTMLElement;
        copy.setAttribute("data-event-preview-style", "");
        frameDocument.head.append(copy);
      }
    };
    copyStyles();
    const observer = new MutationObserver(copyStyles);
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [frameDocument, src]);

  useEffect(() => {
    if (!frameDocument) return;
    const backgroundController = createEventPreviewBackgroundController(frameDocument, preserveNavigation);
    let animationFrame = 0;
    const syncBackground = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() => {
        const next = backgroundController.read();
        setBackground((previous) =>
          JSON.stringify(previous) === JSON.stringify(next) ? previous : next,
        );
      });
    };
    syncBackground();
    const observer = new MutationObserver(syncBackground);
    observer.observe(frameDocument.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style", "data-scan-artwork"],
    });
    frameDocument.addEventListener("load", syncBackground, true);
    frameDocument.defaultView?.addEventListener("resize", syncBackground);
    return () => {
      cancelAnimationFrame(animationFrame);
      observer.disconnect();
      backgroundController.dispose();
      frameDocument.removeEventListener("load", syncBackground, true);
      frameDocument.defaultView?.removeEventListener("resize", syncBackground);
    };
  }, [frameDocument, preserveNavigation]);

  useEffect(() => {
    if (!frameDocument || (!onClose && !returnHref)) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      if (
        frameDocument.querySelector(
          '[data-live-card-panel], [role="dialog"][data-state="open"], dialog[open]',
        )
      )
        return;
      event.preventDefault();
      closePreview();
    };
    frameDocument.addEventListener("keydown", handleEscape);
    return () => frameDocument.removeEventListener("keydown", handleEscape);
  }, [frameDocument, closePreview, onClose, returnHref]);

  const closeClassName =
    "inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-current/15 bg-transparent text-inherit transition hover:bg-current/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current";
  const mount = !src ? frameDocument?.getElementById("event-preview-content") : null;
  const floatingSurfaceStyle = floatingToolbar
    ? preserveNavigation && isDarkEventPageColor(String(background.backgroundColor || ""))
      ? {
          backgroundColor: "rgba(250, 249, 255, 0.94)",
          color: "#38246b",
          borderColor: "rgba(107, 70, 206, 0.2)",
        }
      : { backgroundColor: `color-mix(in srgb, ${background.backgroundColor || "#f8f8f7"} 88%, transparent)` }
    : undefined;

  return (
    <section
      aria-label={`${title} preview`}
      className={`${fullscreen ? "fixed inset-0 z-[7001] h-[100dvh]" : "relative h-full min-h-0"} flex w-full flex-col ${preserveNavigation ? "pt-[var(--app-mobile-topbar-offset,6rem)] lg:pt-0" : ""}`}
      style={background}
    >
      {!preserveNavigation && (fullscreen || onClose) ? <OwnerPreviewMobileTopbarSuppressor /> : null}
      <header
        data-floating-event-toolbar={floatingToolbar || undefined}
        style={{ color: isDarkEventPageColor(String(background.backgroundColor || "")) ? "#ffffff" : background.color }}
        className={`z-10 ${preserveNavigation ? "pointer-events-none absolute inset-x-0 top-[calc(var(--app-mobile-topbar-offset,6rem)+0.5rem)] flex flex-wrap justify-center md:grid md:grid-cols-[1fr_auto_1fr] lg:flex lg:top-[max(0.5rem,env(safe-area-inset-top))]" : `${nativeMobile ? "pointer-events-none absolute inset-x-0 top-0" : "relative shrink-0"} grid pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] ${actions ? "grid-cols-[1fr_auto] sm:grid-cols-[1fr_auto_1fr]" : "grid-cols-[1fr_auto_1fr]"}`} items-center gap-2 px-3 sm:px-5`}
      >
        {preserveNavigation ? null : actions ? <div className="pointer-events-auto">{actions}</div> : <div aria-hidden="true" />}
        <div
          role="group"
          aria-label="Preview device"
          className={`flex gap-2 rounded-full border border-current/15 p-1 ${floatingToolbar ? "pointer-events-auto shadow-sm backdrop-blur-xl" : ""} ${preserveNavigation ? "md:col-start-2" : actions ? "col-span-2 row-start-2 justify-self-center sm:col-span-1 sm:col-start-2 sm:row-start-1" : ""}`}
          style={floatingSurfaceStyle}
        >
          {deviceOrder.map((id) => {
            const Icon = deviceIcons[id];
            const active = device === id;
            return (
              <button
                key={id}
                type="button"
                title={EVENT_PREVIEW_DEVICES[id].label}
                aria-label={EVENT_PREVIEW_DEVICES[id].label}
                aria-pressed={active}
                onClick={() => setDevice(id)}
                className={`inline-flex size-11 items-center justify-center rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current ${active ? "bg-[#6b46ce] text-white shadow-sm" : "text-inherit opacity-70 hover:bg-current/10 hover:opacity-100"}`}
              >
                <Icon size={21} strokeWidth={1.8} aria-hidden="true" />
              </button>
            );
          })}
        </div>
        {preserveNavigation && actions ? (
          <div className="pointer-events-auto justify-self-start rounded-full border border-current/15 p-1 shadow-sm backdrop-blur-xl md:col-start-3" style={floatingSurfaceStyle}>
            {actions}
          </div>
        ) : null}
        {onClose || returnHref || onExpand ? (
          <div
            className={`pointer-events-auto flex justify-end ${nativeMobile ? "justify-self-end rounded-full shadow-sm backdrop-blur-xl" : ""} ${actions ? "col-start-2 row-start-1 sm:col-start-3" : ""}`}
            style={nativeMobile ? floatingSurfaceStyle : undefined}
          >
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                aria-label={closeLabel}
                title={closeLabel}
                className={closeClassName}
              >
                <X size={21} aria-hidden="true" />
              </button>
            ) : returnHref ? (
              <Link
                href={returnHref}
                aria-label={closeLabel}
                title={closeLabel}
                className={closeClassName}
              >
                <X size={21} aria-hidden="true" />
              </Link>
            ) : onExpand ? (
              <button
                type="button"
                onClick={onExpand}
                aria-label="Expand event preview"
                title="Expand event preview"
                className={closeClassName}
              >
                <Maximize2 size={19} aria-hidden="true" />
              </button>
            ) : null}
          </div>
        ) : null}
      </header>
      <div className={`flex min-h-0 flex-1 ${preserveNavigation || nativeMobile ? "" : "p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:p-5"}`}>
        <div
          ref={stageRef}
          className="flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden"
        >
          <div
            className={`relative shrink-0 ${preserveNavigation || nativeMobile || device === "desktop" ? "" : "rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.12)]"}`}
            style={{
              width: fit.width,
              height: fit.height,
              visibility: fit.scale > 0 ? "visible" : "hidden",
            }}
          >
            <iframe
              ref={frameRef}
              src={src}
              srcDoc={src ? undefined : previewDocumentHtml}
              title={`${title} — event content`}
              data-preview-device={device}
              className="absolute left-0 top-0 origin-top-left border-0 bg-transparent"
              style={{
                width: viewport.width,
                height: viewport.height,
                transform: nativeMobile ? "none" : `scale(${fit.scale})`,
                borderRadius: preserveNavigation || nativeMobile || device === "desktop" ? 0 : 24,
              }}
              onLoad={(event) => {
                try {
                  const doc = event.currentTarget.contentDocument;
                  if (canConnectDocument(doc)) setFrameDocument(doc);
                } catch {
                  setFrameDocument(null);
                }
              }}
            />
            {mount
              ? createPortal(<EventCanvas className="min-h-full">{children}</EventCanvas>, mount)
              : null}
          </div>
        </div>
      </div>
    </section>
  );
}
