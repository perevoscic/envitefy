"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Baby,
  Bell,
  CalendarDays,
  Camera,
  ClipboardList,
  Clock,
  Gift,
  Heart,
  Home,
  Hotel,
  LayoutGrid,
  MapPin,
  Megaphone,
  Plane,
  Shirt,
  Ticket,
  Trophy,
  Users,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import styles from "./responsive-event-navigation.module.css";

export type EventNavigationItem = {
  id: string;
  label: string;
  href?: string;
  icon?: LucideIcon;
  panelId?: string;
  count?: number;
};

const LABEL_HINT_INTERVAL_MS = 1100;

function sectionIcon(id: string): LucideIcon {
  if (/rsvp|attend|response|confirm/.test(id)) return Ticket;
  if (/registry|gift/.test(id)) return Gift;
  if (/photo|gallery|cast/.test(id)) return Camera;
  if (/parent|baby/.test(id)) return Baby;
  if (/story|couple|manifesto|vibe/.test(id)) return Heart;
  if (/hotel|stay|accommodation|digs/.test(id)) return Hotel;
  if (/travel/.test(id)) return Plane;
  if (/venue|location|parking|traffic|logistic|visit|direction|set$/.test(id)) return MapPin;
  if (/schedule|event|match|game|session|day|weekend|scoop/.test(id)) return CalendarDays;
  if (/practice|warmup|rotation/.test(id)) return Clock;
  if (/team|club|roster|lineup|coach|host|volunteer|support/.test(id)) return Users;
  if (/admission|ticket/.test(id)) return Ticket;
  if (/snack|food|meal|reception/.test(id)) return Utensils;
  if (/gear|uniform/.test(id)) return Shirt;
  if (/award|result|score/.test(id)) return Trophy;
  if (/news|announce|update/.test(id)) return Megaphone;
  if (/remind|notice/.test(id)) return Bell;
  if (/source|document|resource/.test(id)) return ClipboardList;
  if (/overview|detail|home|meet|ceremony/.test(id)) return Home;
  return LayoutGrid;
}

/** Keep each design's existing navigation at desktop sizes and for up to three items. */
export default function ResponsiveEventNavigation({
  items,
  activeId,
  onSelect,
  children,
  ariaLabel = "Event sections",
  tabbed = false,
  background,
  foreground,
  renderItem,
}: {
  items: EventNavigationItem[];
  activeId?: string;
  onSelect?: (id: string) => void;
  children: ReactNode;
  ariaLabel?: string;
  tabbed?: boolean;
  background?: string;
  foreground?: string;
  renderItem?: (item: EventNavigationItem, content: ReactNode) => ReactNode;
}) {
  const prefix = useId();
  const reducedMotion = useReducedMotion();
  const [selectedId, setSelectedId] = useState(items[0]?.id || "");
  const [hintId, setHintId] = useState<string | null>(null);
  const hintSeen = useRef(false);
  const cancelHint = useRef<() => void>(() => {});
  const buttons = useRef<Record<string, HTMLButtonElement | HTMLAnchorElement | null>>({});
  const rail = useRef<HTMLDivElement>(null);
  const selected = items.some((item) => item.id === (activeId ?? selectedId))
    ? (activeId ?? selectedId)
    : items[0]?.id;
  // Parent editors rebuild their items on wording changes; those edits must not restart the hint.
  const hintItems = JSON.stringify(items.map(({ id }) => id));
  const dismissHint = useCallback(() => {
    hintSeen.current = true;
    cancelHint.current();
    setHintId(null);
  }, []);

  useEffect(() => {
    const ids = JSON.parse(hintItems) as string[];
    const container = rail.current;
    if (ids.length <= 3 || reducedMotion !== false || !container || hintSeen.current) return;
    const mobile = window.matchMedia("(max-width: 639px)");
    let timer: number | undefined;
    let visible = false;
    const finish = () => {
      window.clearTimeout(timer);
      timer = undefined;
      setHintId(null);
    };
    cancelHint.current = finish;
    const show = (index: number) => {
      setHintId(ids[index]);
      timer = window.setTimeout(() => {
        if (index + 1 < ids.length) show(index + 1);
        else finish();
      }, LABEL_HINT_INTERVAL_MS);
    };
    const start = () => {
      if (hintSeen.current || !visible || !mobile.matches || document.hidden) return;
      hintSeen.current = true;
      timer = window.setTimeout(() => show(0), 250);
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting && entry.intersectionRatio >= 0.5;
        if (visible) start();
        else if (hintSeen.current) finish();
      },
      { threshold: 0.5 },
    );
    const onVisibilityChange = () => {
      if (document.hidden) finish();
      else start();
    };
    const onViewportChange = () => {
      if (!mobile.matches) finish();
      else start();
    };
    observer.observe(container);
    document.addEventListener("visibilitychange", onVisibilityChange);
    mobile.addEventListener("change", onViewportChange);
    return () => {
      finish();
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      mobile.removeEventListener("change", onViewportChange);
      cancelHint.current = () => {};
    };
  }, [hintItems, reducedMotion]);

  useEffect(() => {
    if (items.length <= 3 || activeId !== undefined || !items.some((item) => item.href)) return;
    const targets = items.flatMap((item) => {
      const target = item.href?.startsWith("#")
        ? document.getElementById(item.href.slice(1))
        : null;
      return target ? [{ item, target }] : [];
    });
    const readHash = () => {
      const item = items.find((item) => item.href === window.location.hash);
      if (item) setSelectedId(item.id);
    };
    readHash();
    window.addEventListener("hashchange", readHash);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        const item = targets.find(({ target }) => target === visible?.target)?.item;
        if (item) setSelectedId(item.id);
      },
      { rootMargin: "-15% 0px -55% 0px", threshold: 0 },
    );
    targets.forEach(({ target }) => {
      observer.observe(target);
    });
    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", readHash);
    };
  }, [items, activeId]);

  if (items.length <= 3) return <>{children}</>;

  const reveal = (id: string) => {
    const container = rail.current;
    const item = buttons.current[id];
    if (!container?.clientWidth || !item) return;
    const bounds = container.getBoundingClientRect();
    const target = item.getBoundingClientRect();
    // Reveal only within the rail; section links must not scroll the page back to navigation.
    if (target.left < bounds.left + 6) container.scrollLeft += target.left - bounds.left - 6;
    else if (target.right > bounds.right - 6)
      container.scrollLeft += target.right - bounds.right + 6;
  };
  const select = (item: EventNavigationItem) => {
    dismissHint();
    setSelectedId(item.id);
    onSelect?.(item.id);
    if (item.href?.startsWith("#")) {
      document
        .getElementById(item.href.slice(1))
        ?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
      window.history.replaceState(window.history.state, "", item.href);
    }
  };

  return (
    <>
      <nav
        className={styles.mobile}
        aria-label={ariaLabel}
        onPointerDownCapture={dismissHint}
        onFocusCapture={dismissHint}
        onKeyDownCapture={dismissHint}
        onWheelCapture={dismissHint}
        style={
          {
            "--event-nav-paper": background || "var(--gym-paper, var(--color-card-bg, #ffffff))",
            "--event-nav-ink": foreground || "var(--gym-ink, var(--color-text, #17212f))",
          } as CSSProperties
        }
      >
        <div
          ref={rail}
          className={styles.rail}
          {...(tabbed ? { role: "tablist", "aria-label": ariaLabel } : {})}
        >
          {items.map((item, index) => {
            const active = selected === item.id;
            const expanded = hintId === null ? active : hintId === item.id;
            const caption = item.count == null ? item.label : `${item.label} (${item.count})`;
            const Icon = item.icon || sectionIcon(item.id);
            const content = (
              <>
                <Icon size={22} strokeWidth={2} aria-hidden="true" />
                <motion.span
                  className={styles.label}
                  aria-hidden="true"
                  initial={false}
                  animate={{
                    width: expanded ? "auto" : 0,
                    marginLeft: expanded ? 8 : 0,
                    opacity: expanded ? 1 : 0,
                  }}
                  transition={
                    reducedMotion
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 350, damping: 32 }
                  }
                  onAnimationComplete={() => {
                    if (expanded) reveal(item.id);
                  }}
                >
                  <span>{caption}</span>
                </motion.span>
              </>
            );
            const common = {
              className: styles.item,
              "aria-label": caption,
              title: caption,
              "data-active": active,
              onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
                if (!tabbed) return;
                const next =
                  event.key === "ArrowRight"
                    ? (index + 1) % items.length
                    : event.key === "ArrowLeft"
                      ? (index + items.length - 1) % items.length
                      : event.key === "Home"
                        ? 0
                        : event.key === "End"
                          ? items.length - 1
                          : -1;
                if (next < 0) return;
                event.preventDefault();
                select(items[next]);
                buttons.current[items[next].id]?.focus({ preventScroll: true });
                reveal(items[next].id);
              },
            };
            const control = item.href ? (
              <a
                {...common}
                key={item.id}
                href={item.href}
                ref={(node) => {
                  buttons.current[item.id] = node;
                }}
                aria-current={active ? "location" : undefined}
                onClick={(event) => {
                  if (
                    item.href?.startsWith("#") &&
                    event.button === 0 &&
                    !event.metaKey &&
                    !event.ctrlKey &&
                    !event.shiftKey &&
                    !event.altKey
                  ) {
                    event.preventDefault();
                    select(item);
                  }
                }}
              >
                {content}
              </a>
            ) : (
              <button
                {...common}
                key={item.id}
                type="button"
                {...(tabbed
                  ? { role: "tab", "aria-selected": active }
                  : { "aria-pressed": active })}
                id={`${prefix}-mobile-tab-${item.id}`}
                aria-controls={item.panelId}
                tabIndex={tabbed && !active ? -1 : 0}
                ref={(node) => {
                  buttons.current[item.id] = node;
                }}
                onClick={() => select(item)}
              >
                {content}
              </button>
            );
            return renderItem ? (
              <span className={styles.editableItem} key={item.id}>
                {renderItem(item, control)}
              </span>
            ) : (
              control
            );
          })}
        </div>
      </nav>
      <div className={styles.desktop}>{children}</div>
    </>
  );
}
