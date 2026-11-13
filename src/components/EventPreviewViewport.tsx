"use client";

import { Maximize2, Monitor, Smartphone, Tablet, X } from "lucide-react";
import Link from "next/link";
import { type CSSProperties, type ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import {
  DEFAULT_PREVIEW_BACKGROUND,
  createEventPreviewBackgroundController,
} from "@/lib/event-preview-background";
import {
  EVENT_PREVIEW_DEVICES,
  type EventPreviewDevice,
  type EventPreviewOrientation,
  EVENT_PREVIEW_FRAMES,
  getEventPreviewLayout,
  getEventPreviewFrameLayout,
  getEventPreviewPairLayout,
  initialEventPreviewDevice,
} from "@/lib/event-preview-viewport";
import OwnerPreviewMobileTopbarSuppressor from "./OwnerPreviewMobileTopbarSuppressor";
import EventCanvas from "./EventCanvas";
import EventPreviewActions from "./EventPreviewActions";
import { useEventPageColor } from "@/hooks/useEventPageChrome";
import type { EventPreviewBackground } from "@/lib/event-preview-background";
import { resolveThemeCssVariables } from "@/themes/registry";
import toolbarStyles from "./event-preview-toolbar.module.css";

const deviceIcons = { desktop: Monitor, tablet: Tablet, mobile: Smartphone };
const deviceOrder: (EventPreviewDevice | "combined")[] = ["desktop", "tablet", "mobile", "combined"];
let frameArtworkPromise: Promise<void[]> | null = null;
let tabletRotationSequence = 0;

function animateTabletPreview(frame: HTMLElement, angle: number, update: () => void, finish: () => void) {
  const duration = 500;
  const easing = "cubic-bezier(0.22,1,0.36,1)";
  const doc = frame.ownerDocument;
  if (typeof doc.startViewTransition !== "function") {
    // The fallback also moves the entire frame, including its live iframe.
    update();
    const transform = frame.style.transform;
    const animation = frame.animate([
      { transform: `${transform} rotate(${-angle}deg)`, opacity: 0.2 },
      { transform: `${transform} rotate(0deg)`, opacity: 1 },
    ], { duration, easing });
    animation.finished.then(finish, finish);
    return () => animation.cancel();
  }

  const name = `envitefy-ipad-${++tabletRotationSequence}`;
  const previousName = frame.style.viewTransitionName;
  const style = doc.createElement("style");
  style.textContent = `
    ::view-transition-group(${name}) { animation-duration: ${duration}ms; animation-timing-function: ${easing}; }
    ::view-transition-old(${name}), ::view-transition-new(${name}) {
      animation: none; width: 100%; height: 100%; object-fit: contain;
      transform-origin: center; mix-blend-mode: normal;
    }
    ::view-transition-old(root) { animation: none; opacity: 0; }
    ::view-transition-new(root) { animation: none; opacity: 1; }
  `;
  doc.head.append(style);
  frame.style.viewTransitionName = name;
  // Snapshot the bezel and the rendered event together, so text, artwork and
  // device follow the same angle, duration and easing while the iframe reflows.
  const transition = doc.startViewTransition(update);
  const animations: Animation[] = [];
  transition.ready.then(() => {
    animations.push(doc.documentElement.animate([
      { transform: "rotate(0deg)", opacity: 1 },
      { transform: `rotate(${angle}deg)`, opacity: 0 },
    ], { duration, easing, fill: "both", pseudoElement: `::view-transition-old(${name})` }));
    animations.push(doc.documentElement.animate([
      { transform: `rotate(${-angle}deg)`, opacity: 0 },
      { transform: "rotate(0deg)", opacity: 1 },
    ], { duration, easing, fill: "both", pseudoElement: `::view-transition-new(${name})` }));
  }).catch(() => { /* A hidden document may skip its visual transition. */ });
  transition.finished.catch(() => {}).then(() => {
    animations.forEach(animation => animation.cancel());
    frame.style.viewTransitionName = previousName;
    style.remove();
    finish();
  });
  return () => transition.skipTransition();
}

function prepareFrameArtwork() {
  // Both previews share these downloads, even while an event document is slow.
  return frameArtworkPromise ||= Promise.all(Object.values(EVENT_PREVIEW_FRAMES).map(({ image }) => new Promise<void>((resolve, reject) => {
    const artwork = new Image();
    artwork.fetchPriority = "high";
    artwork.onload = () => artwork.decode().then(resolve, reject);
    artwork.onerror = () => reject(new Error("Device frame could not load"));
    artwork.src = image;
  })));
}
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
  roleLabel?: string;
  closeLabel?: string;
  onBackgroundChange?: (background: EventPreviewBackground) => void;
  initialBackground?: EventPreviewBackground;
  /** Internal: render a second device in the shared desktop preview stage. */
  deviceOnly?: boolean;
  tabletOrientation?: EventPreviewOrientation;
  tabletRotationInProgress?: boolean;
  frameLayout?: ReturnType<typeof getEventPreviewFrameLayout>;
  inheritedArtworkState?: "loading" | "ready" | "error";
  onRetryFrameArtwork?: () => void;
  onRotateTablet?: () => void;
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
  roleLabel,
  closeLabel = "Close preview",
  onBackgroundChange,
  initialBackground,
  deviceOnly = false,
  tabletOrientation = "portrait",
  tabletRotationInProgress = false,
  frameLayout,
  inheritedArtworkState,
  onRetryFrameArtwork,
  onRotateTablet,
}: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const initializedDevice = useRef(false);
  const [device, setDevice] = useState<EventPreviewDevice>(initialDevice || "mobile");
  const [orientation, setOrientation] = useState<EventPreviewOrientation>("portrait");
  const [rotationInProgress, setRotationInProgress] = useState(false);
  const cancelRotation = useRef<(() => void) | null>(null);
  const effectiveOrientation = deviceOnly ? tabletOrientation : orientation;
  const [artworkState, setArtworkState] = useState<"loading" | "ready" | "error">("loading");
  const artworkStatus = inheritedArtworkState ?? artworkState;
  const [artworkAttempt, setArtworkAttempt] = useState(0);
  const [available, setAvailable] = useState({ width: 0, height: 0, browserWidth: 0 });
  const [frameDocument, setFrameDocument] = useState<Document | null>(null);
  const [background, setBackground] = useState(() => initialBackground?.backgroundColor ? { ...DEFAULT_PREVIEW_BACKGROUND, ...initialBackground } : DEFAULT_PREVIEW_BACKGROUND);
  const screenBackground = deviceOnly && !frameDocument ? initialBackground || background : background;
  useEventPageColor(String(background.backgroundColor || ""), preserveNavigation && !deviceOnly);
  const desktopControls = available.browserWidth >= 1024 && !deviceOnly;
  const tabletLayout = desktopControls
    ? getEventPreviewPairLayout(available.width, available.height, effectiveOrientation).tablet
    : null;
  const pairedDevices = desktopControls && device !== "desktop"
    ? getEventPreviewPairLayout(available.width, available.height, effectiveOrientation)
    : null;
  const renderedDevice = pairedDevices ? "mobile" : device;
  const nativeMobile = device === "mobile" && available.browserWidth > 0 && available.browserWidth < 768;
  const floatingToolbar = preserveNavigation || nativeMobile;
  const deviceFrame = frameLayout || pairedDevices?.mobile || (renderedDevice !== "desktop" && !nativeMobile
    ? getEventPreviewFrameLayout(renderedDevice, available.width, available.height, effectiveOrientation)
    : null);
  const { viewport, fit } = deviceFrame || getEventPreviewLayout(
    device,
    available.width,
    available.height,
    nativeMobile,
  );
  const controlScale = fit.scale > 0 ? fit.scale : 1;
  const tabletControlsHeight = renderedDevice === "tablet" && deviceFrame
    ? Math.min(viewport.height, 56 / controlScale)
    : 0;
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

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = ({ width, height }: { width: number; height: number }) => {
      const browserWidth = window.innerWidth;
      setAvailable(previous => previous.width === width && previous.height === height && previous.browserWidth === browserWidth
        ? previous : { width, height, browserWidth });
      if (!initializedDevice.current && width > 0) {
        initializedDevice.current = true;
        setDevice(initialDevice || initialEventPreviewDevice(window.innerWidth));
      }
    };
    // Resolve the frame layout before the first event paint, without a second
    // effect/ResizeObserver round trip before mounting the tablet document.
    measure(stage.getBoundingClientRect());
    const observer = new ResizeObserver(([entry]) => measure(entry.contentRect));
    observer.observe(stage);
    return () => observer.disconnect();
  }, [initialDevice]);

  const prepareArtwork = available.browserWidth >= 768 || deviceOnly;
  useEffect(() => {
    if (!prepareArtwork || inheritedArtworkState !== undefined) return;
    let active = true;
    setArtworkState("loading");
    prepareFrameArtwork().then(
      () => { if (active) setArtworkState("ready"); },
      () => { if (active) setArtworkState("error"); },
    );
    return () => { active = false; };
  }, [prepareArtwork, artworkAttempt, inheritedArtworkState]);

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
  useEffect(() => () => cancelRotation.current?.(), []);

  useEffect(() => {
    if (!frameDocument || !preserveNavigation) return;
    // Hide the saved owner view's document scrollbar without disabling scrolling
    // or changing scrollbars inside event controls and dialogs.
    const style = frameDocument.createElement("style");
    const desktop = window.matchMedia("(min-width: 1024px)");
    // Device-sized previews must not duplicate the outer desktop Edit action.
    const syncStyle = () => {
      style.textContent = `
      html, body, [data-app-main-content] {
        scrollbar-width: none;
      }
      html::-webkit-scrollbar, body::-webkit-scrollbar,
      [data-app-main-content]::-webkit-scrollbar {
        display: none;
      }
      ${desktop.matches ? "[data-event-mobile-edit] { display: none !important; }" : ""}
      `;
    };
    syncStyle();
    frameDocument.head.append(style);
    desktop.addEventListener("change", syncStyle);
    return () => {
      desktop.removeEventListener("change", syncStyle);
      style.remove();
    };
  }, [frameDocument, preserveNavigation]);

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
    const syncAppearance = () => {
      const source = document.documentElement;
      const target = frameDocument.documentElement;
      if (target.className !== source.className) target.className = source.className;
      for (const attribute of ["data-theme", "data-theme-key", "data-appearance-preference"]) {
        const value = source.getAttribute(attribute);
        if (value === null) target.removeAttribute(attribute);
        else if (target.getAttribute(attribute) !== value) target.setAttribute(attribute, value);
      }
      const variant = source.classList.contains("dark") ? "dark" : "light";
      const computed = getComputedStyle(source);
      const properties = new Set([
        ...Object.keys(resolveThemeCssVariables("general", "light")),
        ...Object.keys(resolveThemeCssVariables("general", "dark")),
      ]);
      for (const property of properties) {
        const value = computed.getPropertyValue(property);
        if (!value) target.style.removeProperty(property);
        else if (target.style.getPropertyValue(property) !== value) target.style.setProperty(property, value);
      }
      if (target.style.colorScheme !== variant) target.style.colorScheme = variant;
    };
    const copyStyles = () => {
      syncAppearance();
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
    const appearanceObserver = new MutationObserver(syncAppearance);
    appearanceObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style", "data-theme", "data-theme-key", "data-appearance-preference"],
    });
    return () => {
      observer.disconnect();
      appearanceObserver.disconnect();
    };
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
  // Preview controls belong to the application, including when their mobile
  // disclosure is portalled into an authored event with its own palette.
  const toolbarColor = "var(--app-foreground, var(--foreground, #2b1b16))";
  const floatingSurfaceStyle = {
    backgroundColor: "var(--app-surface, var(--surface, #fbf7f2))",
    color: toolbarColor,
    borderColor: "var(--app-border, var(--border, #d9c5b8))",
  };
  const retryFrameArtwork = onRetryFrameArtwork || (() => {
    frameArtworkPromise = null;
    setArtworkAttempt(value => value + 1);
  });
  const rotateTablet = onRotateTablet || (() => {
    if (rotationInProgress) return;
    const update = () => flushSync(() => setOrientation(value => value === "portrait" ? "landscape" : "portrait"));
    const frame = stageRef.current?.querySelector<HTMLElement>('[data-event-preview-frame="tablet"]');
    if (!frame || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      update();
      return;
    }
    setRotationInProgress(true);
    cancelRotation.current = animateTabletPreview(frame, orientation === "portrait" ? -90 : 90, update, () => {
      setRotationInProgress(false);
      cancelRotation.current = null;
    });
  });

  return (
    <section
      aria-label={`${title} preview`}
      className={`@container ${fullscreen ? "fixed inset-0 z-[7001] h-[100dvh]" : "relative h-full min-h-0"} flex w-full flex-col ${preserveNavigation && !deviceOnly ? "pt-[var(--app-mobile-topbar-offset,6rem)] lg:pt-0" : ""}`}
      style={deviceOnly ? { color: screenBackground.color } : background}
    >
      {!deviceOnly ? Object.values(EVENT_PREVIEW_FRAMES).map(({ image }) => (
        <link key={image} rel="preload" as="image" href={image} media="(min-width: 768px)" fetchPriority="high" />
      )) : null}
      {!deviceOnly && !preserveNavigation && (fullscreen || onClose) ? <OwnerPreviewMobileTopbarSuppressor /> : null}
      {!deviceOnly ? <header
        data-floating-event-toolbar={floatingToolbar || undefined}
        style={{ color: toolbarColor }}
        className={`${toolbarStyles.toolbar} z-10 ${preserveNavigation ? `pointer-events-none ${deviceFrame ? "relative shrink-0 py-2" : "absolute inset-x-0 top-[calc(var(--app-mobile-topbar-offset,6rem)+0.5rem)] lg:top-[max(0.5rem,env(safe-area-inset-top))]"} grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:flex lg:justify-center` : `${nativeMobile ? "pointer-events-none absolute inset-x-0 top-0" : "relative shrink-0"} grid pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] ${actions ? "grid-cols-[1fr_auto] sm:grid-cols-[1fr_auto_1fr]" : "grid-cols-[1fr_auto_1fr]"}`} items-center gap-2 px-3 sm:px-5`}
      >
        {preserveNavigation ? null : actions ? <div className="pointer-events-auto">{actions}</div> : <div aria-hidden="true" />}
        <div
          role="group"
          aria-label="Preview device"
          className={`hidden md:flex gap-2 rounded-full border border-current/15 p-1 ${floatingToolbar ? "pointer-events-auto shadow-sm backdrop-blur-xl" : ""} ${preserveNavigation ? "col-start-2 row-start-1 justify-self-center" : actions ? "col-span-2 row-start-2 justify-self-center sm:col-span-1 sm:col-start-2 sm:row-start-1" : ""}`}
          style={floatingSurfaceStyle}
        >
          {deviceOrder.map((id) => {
            // CSS selects the right controls in server HTML, before viewport
            // measurement or hydration can expose the retired desktop layout.
            const combined = id === "combined";
            const selectedDevice = combined ? "mobile" : id;
            const Icon = deviceIcons[selectedDevice];
            const label = combined ? "Tablet and mobile view" : EVENT_PREVIEW_DEVICES[selectedDevice].label;
            const active = combined ? device !== "desktop" : device === selectedDevice;
            const display = combined ? "hidden lg:inline-flex" : id === "desktop" ? "inline-flex" : "inline-flex lg:hidden";
            return (
              <button
                key={id}
                type="button"
                title={label}
                aria-label={label}
                aria-pressed={active}
                onClick={() => setDevice(selectedDevice)}
                className={`${toolbarStyles.control} ${display} size-11 items-center justify-center rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current ${active ? "bg-[#6b46ce] text-white shadow-sm" : "text-inherit opacity-70 hover:bg-current/10 hover:opacity-100"}`}
              >
                {combined ? (
                  <svg data-device-pair-icon width={21} height={21} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 21H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" />
                    <rect x="14" y="9" width="7" height="13" rx="1" />
                    <path d="M9 18h1m7 1h1" />
                  </svg>
                ) : <Icon size={21} strokeWidth={1.8} aria-hidden="true" />}
                <span className={toolbarStyles.controlLabel} aria-hidden="true">{combined ? "Tablet + phone" : label}</span>
              </button>
            );
          })}
        </div>
        {preserveNavigation && actions ? (
          <EventPreviewActions surfaceStyle={floatingSurfaceStyle} previewDocument={frameDocument} roleLabel={roleLabel}>
            {actions}
          </EventPreviewActions>
        ) : null}
        {onClose || returnHref || onExpand ? (
          <div
            className={`pointer-events-auto flex justify-end ${nativeMobile ? "justify-self-end rounded-full shadow-sm backdrop-blur-xl" : ""} ${actions ? "col-start-2 row-start-1 md:col-start-3" : "col-start-3 row-start-1"}`}
            style={nativeMobile ? floatingSurfaceStyle : undefined}
          >
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                aria-label={closeLabel}
                title={closeLabel}
                className={closeClassName}
                style={floatingSurfaceStyle}
              >
                <X size={21} aria-hidden="true" />
              </button>
            ) : returnHref ? (
              <Link
                href={returnHref}
                aria-label={closeLabel}
                title={closeLabel}
                className={closeClassName}
                style={floatingSurfaceStyle}
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
                style={floatingSurfaceStyle}
              >
                <Maximize2 size={19} aria-hidden="true" />
              </button>
            ) : null}
          </div>
        ) : null}
      </header> : null}
      <div className={`flex min-h-0 flex-1 ${deviceOnly ? "" : deviceFrame ? "p-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]" : preserveNavigation || nativeMobile ? "" : "p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:p-5"}`}>
        <div
          ref={stageRef}
          data-event-preview-stage
          data-event-preview-pair={pairedDevices ? "true" : undefined}
          className={`flex min-h-0 w-full flex-1 items-center justify-center ${pairedDevices ? "gap-8" : ""} ${deviceFrame ? "overflow-visible" : "overflow-hidden"}`}
        >
          {tabletLayout ? <div key="tablet" data-tablet-preview-slot className="shrink-0" style={{ display: pairedDevices ? undefined : "none", width: tabletLayout.fit.width, height: tabletLayout.fit.height }}>
            <EventPreviewViewport
              title={`${title} — tablet`}
              src={src}
              preserveNavigation={preserveNavigation}
              initialDevice="tablet"
              initialBackground={background}
              onClose={onClose}
              returnHref={returnHref}
              deviceOnly
              tabletOrientation={orientation}
              tabletRotationInProgress={rotationInProgress}
              frameLayout={tabletLayout}
              inheritedArtworkState={artworkStatus}
              onRetryFrameArtwork={retryFrameArtwork}
              onRotateTablet={rotateTablet}
            >{children}</EventPreviewViewport>
          </div> : null}
          <div
            key="primary"
            className="relative shrink-0"
            style={{
              width: fit.width,
              height: fit.height,
              visibility: fit.scale > 0 ? "visible" : "hidden",
            }}
          >
            <div
              data-event-preview-frame={deviceFrame ? renderedDevice : undefined}
              data-preview-orientation={deviceFrame?.orientation}
              data-frame-artwork-ready={artworkStatus === "ready"}
              className="absolute left-0 top-0 origin-top-left"
              style={deviceFrame ? {
                width: deviceFrame.shell.width,
                height: deviceFrame.shell.height,
                transform: `scale(${fit.scale})`,
              } : { width: viewport.width, height: viewport.height, transform: nativeMobile ? "none" : `scale(${fit.scale})` }}
            >
              <div
                data-event-preview-screen
                className="absolute overflow-hidden"
                style={{
                  ...screenBackground,
                  left: deviceFrame?.screen.left || 0,
                  top: deviceFrame?.screen.top || 0,
                  width: viewport.width,
                  height: viewport.height,
                  borderRadius: deviceFrame?.screen.radius || 0,
                }}
              >
                {tabletControlsHeight > 0 ? (
                  <div data-tablet-orientation-bar className="absolute left-0 top-0 z-20 flex w-full items-center justify-center" style={{ height: tabletControlsHeight }}>
                    <button
                      type="button"
                      aria-label={effectiveOrientation === "portrait" ? "View in landscape" : "View in portrait"}
                      aria-disabled={deviceOnly ? tabletRotationInProgress : rotationInProgress}
                      onClick={rotateTablet}
                      className={`${toolbarStyles.control} ${toolbarStyles.rotationControl} inline-flex shrink-0 items-center justify-center rounded-full border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current`}
                      style={{
                        "--preview-control-size": `${44 / controlScale}px`,
                        "--preview-expanded-size": `${190 / controlScale}px`,
                        "--preview-icon-size": `${24 / controlScale}px`,
                        "--preview-label-size": `${12 / controlScale}px`,
                      } as CSSProperties}
                    >
                      <svg data-device-orientation-icon={effectiveOrientation === "portrait" ? "landscape" : "portrait"} width={24 / controlScale} height={24 / controlScale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect data-orientation-device x={effectiveOrientation === "portrait" ? 2 : 4} y={effectiveOrientation === "portrait" ? 4 : 2} width={effectiveOrientation === "portrait" ? 20 : 16} height={effectiveOrientation === "portrait" ? 16 : 20} rx="2.5" />
                        <circle cx="12" cy={effectiveOrientation === "portrait" ? 6.5 : 4.5} r="0.65" fill="currentColor" stroke="none" />
                      </svg>
                      <span className={toolbarStyles.controlLabel} aria-hidden="true">{effectiveOrientation === "portrait" ? "View in landscape" : "View in portrait"}</span>
                    </button>
                  </div>
                ) : null}
                <iframe
                  ref={frameRef}
                  src={src}
                  srcDoc={src ? undefined : previewDocumentHtml}
                  title={`${title} — event content`}
                  data-preview-device={renderedDevice}
                  className="absolute left-0 top-0 origin-top-left border-0 bg-transparent"
                  // Keep transparent event canvases visible across app/event color schemes.
                  style={{ width: viewport.width, height: Math.max(1, viewport.height - tabletControlsHeight), top: tabletControlsHeight, colorScheme: "normal", visibility: deviceFrame && artworkStatus !== "ready" ? "hidden" : undefined }}
                  onLoad={(event) => {
                    try {
                      const doc = event.currentTarget.contentDocument;
                      if (canConnectDocument(doc)) setFrameDocument(doc);
                    } catch {
                      setFrameDocument(null);
                    }
                  }}
                />
                {deviceFrame && (artworkStatus !== "ready" || !frameDocument) ? (
                  <div className="absolute inset-0 flex items-center justify-center p-6" style={{ pointerEvents: artworkStatus === "error" ? "auto" : "none" }}>
                    <div role={artworkStatus === "error" ? "alert" : "status"} className="rounded-2xl border px-4 py-3 text-center text-sm shadow-sm" style={floatingSurfaceStyle}>
                      {artworkStatus === "error" ? <>
                        <p>Device frame could not load.</p>
                        <button type="button" className="min-h-11 px-3 font-semibold underline" onClick={retryFrameArtwork}>Retry</button>
                      </> : artworkStatus === "ready" ? "Loading event…" : "Loading devices…"}
                    </div>
                  </div>
                ) : null}
              </div>
              {deviceFrame ? (
                <svg
                  aria-hidden="true"
                  data-device-frame-artwork
                  viewBox={`${deviceFrame.frame.bounds.x} ${deviceFrame.frame.bounds.y} ${deviceFrame.frame.bounds.width} ${deviceFrame.frame.bounds.height}`}
                  style={{ position: "absolute", left: 0, top: 0, width: deviceFrame.artwork.width, height: deviceFrame.artwork.height, transform: deviceFrame.artwork.transform, transformOrigin: "top left", pointerEvents: "none" }}
                >
                  <image href={deviceFrame.frame.image} width={deviceFrame.frame.imageWidth} height={deviceFrame.frame.imageHeight} />
                </svg>
              ) : null}
            </div>
            {mount
              ? createPortal(<EventCanvas className="min-h-full">{children}</EventCanvas>, mount)
              : null}
          </div>
        </div>
      </div>
    </section>
  );
}
