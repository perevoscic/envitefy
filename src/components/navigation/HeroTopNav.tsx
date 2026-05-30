"use client";

import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { type MouseEventHandler, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import LoginForm from "@/components/auth/LoginForm";
import EnvitefyWordmark from "@/components/branding/EnvitefyWordmark";
import AnimatedButtonLabel from "@/components/ui/AnimatedButtonLabel";

export type HeroTopNavLink = {
  label: string;
  href: string;
};

type HeroTopNavProps = {
  navLinks: HeroTopNavLink[];
  primaryCtaLabel?: string;
  authenticatedPrimaryHref: string;
  brandHref?: string;
  dashboardHref?: string;
  loginSuccessRedirectUrl?: string;
  onGuestLoginAction: () => void;
  onGuestPrimaryAction: () => void;
  variant?: "default" | "glass-dark" | "transparent-dark";
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function getHashLinkId(href: string) {
  if (!href.startsWith("#") || href.length <= 1) return null;

  try {
    return decodeURIComponent(href.slice(1));
  } catch {
    return href.slice(1);
  }
}

const glassGhostLoginClass =
  "cta-shell nav-chrome-motion h-11 shrink-0 rounded-full border border-white/18 bg-white/[0.12] px-6 text-sm font-bold text-white transition-all hover:bg-white/[0.18]";
const lightNavPillClass = "hero-top-nav-pill-light";

function NavLinkItem({
  href,
  label,
  className,
  onClick,
  ariaCurrent,
}: {
  href: string;
  label: string;
  className: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  ariaCurrent?: "location";
}) {
  if (href.startsWith("#")) {
    return (
      <a
        href={href}
        className={className}
        draggable={false}
        onClick={onClick}
        aria-current={ariaCurrent}
      >
        {label}
      </a>
    );
  }

  return (
    <Link
      href={href}
      className={className}
      draggable={false}
      onClick={onClick}
      aria-current={ariaCurrent}
    >
      {label}
    </Link>
  );
}

export default function HeroTopNav({
  navLinks,
  primaryCtaLabel = "Get Started",
  authenticatedPrimaryHref,
  brandHref = "/landing",
  dashboardHref = "/",
  loginSuccessRedirectUrl = dashboardHref,
  onGuestLoginAction,
  onGuestPrimaryAction,
  variant = "default",
}: HeroTopNavProps) {
  const { status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileLoginExpanded, setMobileLoginExpanded] = useState(false);
  const [mobileMenuPortalReady, setMobileMenuPortalReady] = useState(false);
  const [hasScrolledPastHero, setHasScrolledPastHero] = useState(false);
  const [activeNavHref, setActiveNavHref] = useState<string | null>(null);
  const mobileMenuCardRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuToggleRef = useRef<HTMLButtonElement | null>(null);
  const mobileMenuDragStartX = useRef<number | null>(null);
  const mobileMenuSwipeStartX = useRef<number | null>(null);
  const isTransparentDark = variant === "transparent-dark";
  const isDarkGlass = variant === "glass-dark" || isTransparentDark;
  const isTransparentOverHero = isTransparentDark && !hasScrolledPastHero;
  const useDarkMobileMenu = isDarkGlass;
  const showMobileGuestActions = status !== "authenticated" && !mobileLoginExpanded;

  useEffect(() => {
    setMobileMenuPortalReady(true);
  }, []);

  useEffect(() => {
    if (!isTransparentDark) {
      setHasScrolledPastHero(false);
      return;
    }

    const syncScrolledState = () => {
      setHasScrolledPastHero(window.scrollY > Math.max(120, window.innerHeight * 0.82));
    };

    syncScrolledState();
    window.addEventListener("scroll", syncScrolledState, { passive: true });
    window.addEventListener("resize", syncScrolledState);

    return () => {
      window.removeEventListener("scroll", syncScrolledState);
      window.removeEventListener("resize", syncScrolledState);
    };
  }, [isTransparentDark]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const hashHrefs = navLinks
      .map((link) => link.href)
      .filter((href) => href.startsWith("#") && href.length > 1);
    if (hashHrefs.length === 0) {
      setActiveNavHref(null);
      return;
    }

    let frameId: number | null = null;

    const getActiveHref = () => {
      const markerY = Math.max(160, window.innerHeight * 0.5);
      const heroSection = document.getElementById("landing-hero");
      const heroRect = heroSection?.getBoundingClientRect();
      if (heroRect && heroRect.top <= markerY && heroRect.bottom > markerY) {
        return null;
      }

      let nextActiveHref: string | null = null;

      for (const href of hashHrefs) {
        const targetId = getHashLinkId(href);
        if (!targetId) continue;

        const target = document.getElementById(targetId);
        if (!target) continue;

        const rect = target.getBoundingClientRect();
        if (rect.top <= markerY && rect.bottom > markerY) {
          return href;
        }
        if (rect.top <= markerY) {
          nextActiveHref = href;
        }
      }

      return nextActiveHref;
    };

    const syncActiveNavHref = () => {
      frameId = null;
      const nextActiveHref = getActiveHref();
      setActiveNavHref((currentHref) =>
        currentHref === nextActiveHref ? currentHref : nextActiveHref,
      );
    };

    const requestSyncActiveNavHref = () => {
      if (frameId !== null) return;
      frameId = window.requestAnimationFrame(syncActiveNavHref);
    };

    syncActiveNavHref();
    window.addEventListener("scroll", requestSyncActiveNavHref, { passive: true });
    window.addEventListener("resize", requestSyncActiveNavHref);
    window.addEventListener("hashchange", requestSyncActiveNavHref);

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener("scroll", requestSyncActiveNavHref);
      window.removeEventListener("resize", requestSyncActiveNavHref);
      window.removeEventListener("hashchange", requestSyncActiveNavHref);
    };
  }, [navLinks]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (mobileMenuCardRef.current?.contains(target)) return;
      if (mobileMenuToggleRef.current?.contains(target)) return;
      setMobileMenuOpen(false);
      setMobileLoginExpanded(false);
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen || typeof document === "undefined" || typeof window === "undefined") {
      return;
    }

    const scrollY = window.scrollY;
    const { body, documentElement } = document;
    const previousHtmlOverflow = documentElement.style.overflow;
    const previousHtmlOverscrollBehavior = documentElement.style.overscrollBehavior;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyOverscrollBehavior = body.style.overscrollBehavior;
    const previousBodyPosition = body.style.position;
    const previousBodyTop = body.style.top;
    const previousBodyLeft = body.style.left;
    const previousBodyRight = body.style.right;
    const previousBodyWidth = body.style.width;

    documentElement.style.overflow = "hidden";
    documentElement.style.overscrollBehavior = "none";
    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";

    return () => {
      documentElement.style.overflow = previousHtmlOverflow;
      documentElement.style.overscrollBehavior = previousHtmlOverscrollBehavior;
      body.style.overflow = previousBodyOverflow;
      body.style.overscrollBehavior = previousBodyOverscrollBehavior;
      body.style.position = previousBodyPosition;
      body.style.top = previousBodyTop;
      body.style.left = previousBodyLeft;
      body.style.right = previousBodyRight;
      body.style.width = previousBodyWidth;
      window.scrollTo(0, scrollY);
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) {
      setMobileLoginExpanded(false);
    }
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (status === "authenticated") {
      setMobileLoginExpanded(false);
    }
  }, [status]);

  useEffect(() => {
    if (!mobileLoginExpanded || typeof window === "undefined") return;

    const frame = window.requestAnimationFrame(() => {
      document
        .getElementById("hero-top-nav-mobile-login")
        ?.querySelector<HTMLInputElement>("#login-email-input")
        ?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [mobileLoginExpanded]);

  const handleHashLinkClick =
    (href: string, closeMobileMenu = false): MouseEventHandler<HTMLAnchorElement> =>
    (event) => {
      setActiveNavHref(href);
      if (closeMobileMenu) {
        setMobileMenuOpen(false);
      }

      const targetId = getHashLinkId(href);
      if (!targetId || typeof window === "undefined") return;

      const target = document.getElementById(targetId);
      if (!target) return;

      event.preventDefault();
      window.history.pushState(null, "", href);
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      });
    };

  return (
    <motion.header
      initial={isTransparentDark ? { y: -96, opacity: 0 } : false}
      animate={isTransparentDark ? { y: 0, opacity: 1 } : undefined}
      transition={isTransparentDark ? { duration: 0.8, ease: "easeOut" } : undefined}
      data-scrolled-past-hero={hasScrolledPastHero ? "true" : "false"}
      className={cx(
        "fixed inset-x-0 top-0 z-50 px-4 pt-[max(0.9rem,env(safe-area-inset-top))] sm:px-6 lg:px-8",
      )}
    >
      <div
        className={cx("relative mx-auto", isTransparentOverHero ? "max-w-none" : "max-w-[1400px]")}
      >
        <div
          className={cx(
            isTransparentOverHero
              ? "px-1 py-2 text-white sm:px-3"
              : cx(
                  "nav-chrome-glass-header px-4 py-3 sm:px-6",
                  isDarkGlass
                    ? "theme-glass-nav rounded-[2rem] border-white/14 shadow-[0_18px_40px_rgba(3,1,10,0.24)]"
                    : "hero-top-nav-shell-light rounded-[2rem]",
                ),
          )}
        >
          <div
            className={cx(
              isTransparentOverHero
                ? "flex items-center justify-between gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]"
                : "flex items-center justify-between gap-4",
            )}
          >
            <Link
              href={brandHref}
              className={cx(
                "group flex min-w-0 items-center overflow-hidden",
                isTransparentOverHero ? "justify-self-start" : "flex-1 lg:flex-none",
              )}
              aria-label="Envitefy"
            >
              <EnvitefyWordmark
                scaled={false}
                tone={isDarkGlass ? "light" : "gradient"}
                className={cx(
                  "max-w-full text-[2.05rem] leading-none transition-transform duration-300 group-hover:scale-[1.02] sm:text-[2.28rem] md:text-[2.52rem]",
                  !isDarkGlass && "hero-top-nav-brand-light",
                )}
              />
            </Link>

            <nav
              className={cx(
                "hidden items-center lg:flex",
                isTransparentOverHero ? "justify-self-center gap-6" : "gap-1",
              )}
              aria-label="Hero navigation"
            >
              {navLinks.map((link) => {
                const isActive = activeNavHref === link.href;
                return (
                  <NavLinkItem
                    key={`${link.label}:${link.href}`}
                    href={link.href}
                    label={link.label}
                    ariaCurrent={isActive ? "location" : undefined}
                    onClick={link.href.startsWith("#") ? handleHashLinkClick(link.href) : undefined}
                    className={cx(
                      "nav-chrome-motion text-sm font-semibold transition",
                      isTransparentOverHero
                        ? isActive
                          ? "rounded-full bg-white/18 px-3 py-2 text-white shadow-[0_12px_24px_rgba(0,0,0,0.18)]"
                          : "px-1 py-2 text-white/82 hover:text-white"
                        : isActive
                          ? isDarkGlass
                            ? "rounded-full border border-white/22 bg-white/[0.18] px-4 py-2 text-white shadow-[0_14px_28px_rgba(0,0,0,0.18)]"
                            : "nav-chrome-pill-active rounded-full px-4 py-2"
                          : cx(
                              "rounded-full px-4 py-2",
                              isDarkGlass ? "text-white hover:bg-white/[0.12]" : lightNavPillClass,
                            ),
                    )}
                  />
                );
              })}
            </nav>

            <div
              className={cx(
                "hidden items-center gap-3 lg:flex",
                isTransparentOverHero && "justify-self-end",
              )}
            >
              {status === "authenticated" ? (
                <Link
                  href={dashboardHref}
                  className={cx(
                    "nav-chrome-motion rounded-full px-3 py-2 text-sm font-semibold transition",
                    isDarkGlass ? "text-white" : lightNavPillClass,
                  )}
                >
                  Dashboard
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={onGuestLoginAction}
                  className={cx(
                    isDarkGlass
                      ? glassGhostLoginClass
                      : "cta-shell nav-chrome-motion rounded-full px-3 py-2 text-sm font-semibold transition",
                    !isDarkGlass && lightNavPillClass,
                  )}
                >
                  <AnimatedButtonLabel label="Login" />
                </button>
              )}

              {status === "authenticated" ? (
                <Link
                  href={authenticatedPrimaryHref}
                  className={cx(
                    "cta-shell nav-chrome-motion h-11 rounded-full px-6 text-sm font-semibold transition hover:-translate-y-0.5",
                    isDarkGlass
                      ? "bg-white text-[#140a27] shadow-[0_14px_34px_rgba(0,0,0,0.24)] hover:bg-[#f3ecff]"
                      : "nav-chrome-pill-primary text-white hover:shadow-[0_22px_44px_rgba(123,77,255,0.28)]",
                  )}
                >
                  <AnimatedButtonLabel label={primaryCtaLabel} />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={onGuestPrimaryAction}
                  className={cx(
                    "cta-shell nav-chrome-motion h-11 rounded-full px-6 text-sm font-semibold transition hover:-translate-y-0.5",
                    isDarkGlass
                      ? "bg-white text-[#140a27] shadow-[0_14px_34px_rgba(0,0,0,0.24)] hover:bg-[#f3ecff]"
                      : "nav-chrome-pill-primary text-white hover:shadow-[0_22px_44px_rgba(123,77,255,0.28)]",
                  )}
                >
                  <AnimatedButtonLabel label={primaryCtaLabel} />
                </button>
              )}
            </div>

            <button
              ref={mobileMenuToggleRef}
              type="button"
              className={cx(
                "nav-chrome-motion inline-flex h-11 w-11 items-center justify-center shadow-sm lg:hidden",
                isDarkGlass
                  ? "rounded-full border border-white/14 bg-white/[0.08] text-white"
                  : "nav-chrome-pill-secondary rounded-full text-[#31264f]",
                isTransparentOverHero && "justify-self-end",
              )}
              onClick={() => setMobileMenuOpen((value) => !value)}
              aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={mobileMenuOpen}
              aria-controls="hero-top-nav-mobile"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileMenuPortalReady && typeof document !== "undefined"
          ? createPortal(
              <motion.div
                id="hero-top-nav-mobile"
                aria-hidden={!mobileMenuOpen}
                initial={false}
                animate={{
                  x: mobileMenuOpen ? 0 : "100%",
                  opacity: mobileMenuOpen ? 1 : 0,
                }}
                transition={{
                  type: "spring",
                  stiffness: 360,
                  damping: 36,
                  mass: 0.9,
                }}
                drag={mobileMenuOpen ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.1}
                onPointerDownCapture={(event) => {
                  mobileMenuSwipeStartX.current = event.clientX;
                }}
                onPointerUpCapture={(event) => {
                  const swipeStartX = mobileMenuSwipeStartX.current;
                  mobileMenuSwipeStartX.current = null;

                  if (swipeStartX != null && event.clientX - swipeStartX > 100) {
                    setMobileMenuOpen(false);
                    setMobileLoginExpanded(false);
                  }
                }}
                onDragStart={(_event, info) => {
                  mobileMenuDragStartX.current = info.point.x;
                }}
                onDragEnd={(_event, info) => {
                  const dragStartX = mobileMenuDragStartX.current;
                  mobileMenuDragStartX.current = null;
                  const dragDistanceX =
                    dragStartX == null ? info.offset.x : info.point.x - dragStartX;

                  if (dragDistanceX > 100) {
                    setMobileMenuOpen(false);
                    setMobileLoginExpanded(false);
                  }
                }}
                className={cx(
                  "!fixed inset-0 z-[1000] h-dvh w-screen touch-pan-y !overflow-y-auto overscroll-y-contain px-4 pb-6 pt-[max(0.9rem,env(safe-area-inset-top))] will-change-transform [-webkit-overflow-scrolling:touch] lg:hidden",
                  mobileMenuOpen ? "pointer-events-auto" : "pointer-events-none",
                  useDarkMobileMenu
                    ? "theme-glass-menu bg-[#150c29] text-white shadow-[0_30px_80px_rgba(4,1,14,0.5)]"
                    : "bg-[linear-gradient(180deg,#faf7ff_0%,#f4efff_100%)] text-[#31264f] shadow-[0_30px_80px_rgba(80,61,150,0.2)]",
                )}
              >
                <div
                  ref={mobileMenuCardRef}
                  role="dialog"
                  aria-modal="true"
                  aria-label="Hero navigation"
                  className="relative mx-auto flex min-h-full w-full max-w-[1400px] flex-col"
                >
                  <div className="flex items-center justify-between gap-4">
                    <Link
                      href={brandHref}
                      className="group flex min-w-0 flex-1 items-center overflow-hidden"
                      aria-label="Envitefy"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <EnvitefyWordmark
                        scaled={false}
                        tone={useDarkMobileMenu ? "light" : "gradient"}
                        className={cx(
                          "max-w-full text-[2.05rem] leading-none transition-transform duration-300 group-hover:scale-[1.02]",
                          !useDarkMobileMenu && "hero-top-nav-brand-light",
                        )}
                      />
                    </Link>

                    <button
                      type="button"
                      className={cx(
                        "nav-chrome-motion inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full shadow-sm",
                        useDarkMobileMenu
                          ? "border border-white/16 bg-white/[0.08] text-white hover:bg-white/[0.12]"
                          : "nav-chrome-pill-secondary text-[#31264f]",
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                      aria-label="Close navigation"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <nav
                    className="mt-8 flex flex-1 flex-col items-end justify-start gap-1 pb-8 text-right"
                    aria-label="Hero navigation"
                  >
                    {navLinks.map((link) => {
                      const isActive = activeNavHref === link.href;
                      return (
                        <NavLinkItem
                          key={`${link.label}:${link.href}:mobile`}
                          href={link.href}
                          label={link.label}
                          ariaCurrent={isActive ? "location" : undefined}
                          className={cx(
                            "nav-chrome-motion w-full rounded-2xl px-4 py-3 text-right text-base font-semibold transition",
                            useDarkMobileMenu
                              ? isActive
                                ? "border border-white/22 bg-white/[0.16] text-white shadow-[0_14px_28px_rgba(0,0,0,0.18)]"
                                : "text-white/74 hover:bg-white/[0.08] hover:text-white"
                              : isActive
                                ? "nav-chrome-pill-active"
                                : lightNavPillClass,
                          )}
                          onClick={
                            link.href.startsWith("#")
                              ? handleHashLinkClick(link.href, true)
                              : () => setMobileMenuOpen(false)
                          }
                        />
                      );
                    })}

                    {status === "authenticated" ? (
                      <Link
                        href={dashboardHref}
                        className={cx(
                          "nav-chrome-motion mt-1.5 w-full rounded-2xl px-4 py-3 text-right text-base font-semibold transition",
                          useDarkMobileMenu
                            ? "text-white/74 hover:bg-white/[0.08] hover:text-white"
                            : lightNavPillClass,
                        )}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                    ) : (
                      <>
                        {showMobileGuestActions ? (
                          <button
                            type="button"
                            aria-expanded={mobileLoginExpanded}
                            aria-controls="hero-top-nav-mobile-login"
                            onClick={() => setMobileLoginExpanded((value) => !value)}
                            className={cx(
                              "cta-shell mt-1.5 self-end nav-chrome-motion rounded-2xl px-6 py-3 text-center text-base font-semibold transition",
                              useDarkMobileMenu
                                ? "border border-white/16 bg-white/[0.08] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:bg-white/[0.12]"
                                : lightNavPillClass,
                            )}
                          >
                            <AnimatedButtonLabel label="Login" />
                          </button>
                        ) : null}

                        <div
                          id="hero-top-nav-mobile-login"
                          className={cx(
                            "grid w-full transition-[grid-template-rows,opacity,margin] duration-300 ease-out",
                            mobileLoginExpanded
                              ? "mt-3 grid-rows-[1fr] opacity-100"
                              : "mt-0 grid-rows-[0fr] opacity-0",
                          )}
                        >
                          <div className="overflow-hidden">
                            <div
                              className={cx(
                                "rounded-[2rem] px-4 py-4",
                                useDarkMobileMenu
                                  ? "border border-white/16 bg-white/[0.08] shadow-[0_18px_44px_rgba(4,1,14,0.28)]"
                                  : "border border-[#e7dcff] bg-white/92 shadow-[0_18px_44px_rgba(89,70,171,0.12)]",
                              )}
                            >
                              <LoginForm
                                variant="inline"
                                inlineTone={useDarkMobileMenu ? "dark" : "light"}
                                successRedirectUrl={loginSuccessRedirectUrl}
                                onInlineCancel={() => setMobileLoginExpanded(false)}
                                onSwitchMode={() => {
                                  setMobileLoginExpanded(false);
                                  setMobileMenuOpen(false);
                                  onGuestPrimaryAction();
                                }}
                                onSuccess={() => {
                                  setMobileLoginExpanded(false);
                                  setMobileMenuOpen(false);
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {status === "authenticated" ? (
                      <Link
                        href={authenticatedPrimaryHref}
                        className={cx(
                          "mt-1.5 cta-shell nav-chrome-motion h-11 rounded-full px-5 text-sm font-semibold",
                          useDarkMobileMenu
                            ? "bg-white text-[#140a27] shadow-[0_14px_30px_rgba(0,0,0,0.18)]"
                            : "nav-chrome-pill-primary text-white",
                        )}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <AnimatedButtonLabel label={primaryCtaLabel} />
                      </Link>
                    ) : showMobileGuestActions ? (
                      <button
                        type="button"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setMobileLoginExpanded(false);
                          onGuestPrimaryAction();
                        }}
                        className={cx(
                          "mt-2 cta-shell nav-chrome-motion h-11 rounded-full px-5 text-sm font-semibold",
                          useDarkMobileMenu
                            ? "bg-white text-[#140a27] shadow-[0_14px_30px_rgba(0,0,0,0.18)]"
                            : "nav-chrome-pill-primary text-white",
                        )}
                      >
                        <AnimatedButtonLabel label={primaryCtaLabel} />
                      </button>
                    ) : null}
                  </nav>
                </div>
              </motion.div>,
              document.body,
            )
          : null}
      </div>
    </motion.header>
  );
}
