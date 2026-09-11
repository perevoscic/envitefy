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
  fitEventPreview,
  initialEventPreviewDevice,
} from "@/lib/event-preview-viewport";
import OwnerPreviewMobileTopbarSuppressor from "./OwnerPreviewMobileTopbarSuppressor";

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
}: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const initializedDevice = useRef(false);
  const [device, setDevice] = useState<EventPreviewDevice>("desktop");
  const [available, setAvailable] = useState({ width: 0, height: 0 });
  const [frameDocument, setFrameDocument] = useState<Document | null>(null);
  const [background, setBackground] = useState(DEFAULT_PREVIEW_BACKGROUND);
  const viewport = EVENT_PREVIEW_DEVICES[device];
  const fit = fitEventPreview(device, available.width, available.height);
  const closePreview = useCallback(() => {
    if (onClose) onClose();
    else if (returnHref) window.location.assign(returnHref);
  }, [onClose, returnHref]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setAvailable({ width, height });
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

  // Connect as soon as the streamed page exists. The iframe load event can wait
  // on unrelated fonts or third-party assets after the event is already visible.
  useEffect(() => {
    let timer: number | undefined;
    const connectDocument = () => {
      const doc = frameRef.current?.contentDocument;
      if (doc?.querySelector("#event-preview-content, [data-app-main-content]")) {
        setFrameDocument(doc);
        return;
      }
      timer = window.setTimeout(connectDocument, 100);
    };
    connectDocument();
    return () => window.clearTimeout(timer);
  }, [src]);

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
    const backgroundController = createEventPreviewBackgroundController(frameDocument);
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
  }, [frameDocument]);

  useEffect(() => {
    if (!frameDocument) return;
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
  }, [frameDocument, closePreview]);

  const closeClassName =
    "inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-current/15 bg-transparent text-inherit transition hover:bg-current/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current";
  const mount = !src ? frameDocument?.getElementById("event-preview-content") : null;

  return (
    <section
      aria-label={`${title} preview`}
      className={`${fullscreen ? "fixed inset-0 z-[7001] h-[100dvh]" : "h-full min-h-0"} flex w-full flex-col`}
      style={background}
    >
      {!preserveNavigation && (fullscreen || onClose) ? <OwnerPreviewMobileTopbarSuppressor /> : null}
      <header
        className={`relative z-10 grid shrink-0 ${actions ? "grid-cols-[1fr_auto] sm:grid-cols-[1fr_auto_1fr]" : "grid-cols-[1fr_auto_1fr]"} items-center gap-2 px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-5`}
      >
        {actions || <div aria-hidden="true" />}
        <div
          role="group"
          aria-label="Preview device"
          className={`flex gap-1 rounded-full border border-current/15 p-1 ${actions ? "col-span-2 row-start-2 justify-self-center sm:col-span-1 sm:col-start-2 sm:row-start-1" : ""}`}
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
        <div
          className={`flex justify-end ${actions ? "col-start-2 row-start-1 sm:col-start-3" : ""}`}
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
      </header>
      <div className="flex min-h-0 flex-1 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:p-5">
        <div
          ref={stageRef}
          className="flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden"
        >
          <div
            className={`relative shrink-0 ${device === "desktop" ? "" : "rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.12)]"}`}
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
                transform: `scale(${fit.scale})`,
                borderRadius: device === "desktop" ? 0 : 24,
              }}
              onLoad={(event) => {
                try {
                  setFrameDocument(event.currentTarget.contentDocument);
                } catch {
                  setFrameDocument(null);
                }
              }}
            />
            {mount ? createPortal(children, mount) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
