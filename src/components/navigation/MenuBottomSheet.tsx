"use client";

import type { PanInfo } from "framer-motion";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { ArrowRight, ChevronLeft, LogIn, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { type PointerEvent as ReactPointerEvent, useEffect, useState } from "react";
import LoginForm from "@/components/auth/LoginForm";
import SignupForm from "@/components/auth/SignupForm";
import { signedOutMobileMenuLinks } from "@/config/navigation";
import type { SignupIntent } from "@/lib/signup-intent";

type AuthMode = "login" | "signup";

type MenuBottomSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  successRedirectUrl?: string;
  signupSuccessRedirectUrl?: string;
  signupSource?: "snap" | "gymnastics";
  signupIntent?: SignupIntent;
};

const closeDragOffset = 84;
const closeDragVelocity = 650;
const sheetHeight = "calc(100svh - 0.75rem)";

export default function MenuBottomSheet({
  open,
  onOpenChange,
  successRedirectUrl = "/",
  signupSuccessRedirectUrl = successRedirectUrl,
  signupSource,
  signupIntent,
}: MenuBottomSheetProps) {
  const dragControls = useDragControls();
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const authActive = authMode !== null;

  useEffect(() => {
    if (!open) {
      setAuthMode(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open || typeof document === "undefined" || typeof window === "undefined") {
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
  }, [open]);

  const closeSheet = () => {
    onOpenChange(false);
  };

  const startSheetDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (authActive) return;
    dragControls.start(event);
  };

  const handleSheetDragEnd = (
    _event: MouseEvent | TouchEvent | globalThis.PointerEvent,
    info: PanInfo,
  ) => {
    if (info.offset.y > closeDragOffset || info.velocity.y > closeDragVelocity) {
      closeSheet();
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[90] md:hidden" role="presentation">
          <motion.button
            type="button"
            className="absolute inset-0 cursor-default bg-[#120b1d]/30 backdrop-blur-[2px]"
            aria-label="Close menu"
            onClick={closeSheet}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          />

          <motion.section
            role="dialog"
            aria-modal="true"
            aria-label={authActive ? (authMode === "signup" ? "Sign up" : "Sign in") : "Menu"}
            className="absolute inset-x-0 bottom-0 mx-auto flex w-full max-w-md flex-col overflow-hidden rounded-t-[1.75rem] border border-white/12 bg-[#150c29] px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 text-white shadow-[0_-28px_90px_rgba(20,11,34,0.38)]"
            style={{
              height: authActive ? "auto" : sheetHeight,
              maxHeight: sheetHeight,
            }}
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            dragMomentum={false}
            onDragEnd={handleSheetDragEnd}
          >
            <div
              className="mx-auto mb-1 flex h-8 w-full touch-none cursor-grab items-center justify-center active:cursor-grabbing"
              onPointerDown={startSheetDrag}
              aria-hidden="true"
            >
              <div className="h-1.5 w-10 rounded-full bg-white/18" />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Link
                href="/"
                className="group flex min-w-0 flex-1 items-center overflow-hidden"
                aria-label="Envitefy"
                onClick={closeSheet}
              >
                <Image
                  src="/brand/envitefy-wordmark.png"
                  alt="Envitefy"
                  width={1103}
                  height={354}
                  className="h-auto w-[118px] brightness-0 invert transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </Link>

              <button
                type="button"
                className="nav-chrome-motion inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/16 bg-white/[0.08] text-white shadow-sm transition hover:bg-white/[0.12] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f0d58f]"
                onClick={closeSheet}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div
              className={
                authActive
                  ? "relative mt-5 overflow-visible pb-1"
                  : "relative mt-5 min-h-0 flex-1 overflow-hidden"
              }
            >
              <AnimatePresence initial={false} mode="sync">
                {!authActive ? (
                  <motion.nav
                    key="menu"
                    className="absolute inset-0 overflow-hidden pb-1 text-right"
                    aria-label="Signed-out mobile menu"
                    initial={{ x: 0, opacity: 1 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: "-105%", opacity: 0 }}
                    transition={{ duration: 0.28, ease: "easeOut" }}
                  >
                    <div className="grid gap-1">
                      <button
                        type="button"
                        className="nav-chrome-motion flex w-full items-center justify-end gap-2 rounded-2xl px-4 py-3 text-right text-base font-semibold text-white transition hover:bg-white/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f0d58f]"
                        onClick={() => setAuthMode("signup")}
                      >
                        Start Creating
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </button>

                      <button
                        type="button"
                        className="nav-chrome-motion flex w-full items-center justify-end gap-2 rounded-2xl px-4 py-3 text-right text-base font-semibold text-white/74 transition hover:bg-white/[0.08] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f0d58f]"
                        onClick={() => setAuthMode("login")}
                      >
                        Sign In
                        <LogIn className="h-4 w-4" aria-hidden="true" />
                      </button>

                      {signedOutMobileMenuLinks.map((link) => (
                        <Link
                          key={`${link.label}:${link.href}`}
                          href={link.href}
                          className="nav-chrome-motion w-full rounded-2xl px-4 py-3 text-right text-base font-semibold text-white/74 transition hover:bg-white/[0.08] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f0d58f]"
                          onClick={closeSheet}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </motion.nav>
                ) : null}

                {authMode ? (
                  <motion.div
                    key={authMode}
                    className="relative flex min-h-0 flex-col overflow-y-auto pb-1"
                    initial={{ x: "105%", opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: "-105%", opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        className="nav-chrome-motion inline-flex h-10 items-center gap-1.5 rounded-full border border-white/16 bg-white/[0.08] px-3 text-sm font-semibold text-white/84 transition hover:bg-white/[0.12] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f0d58f]"
                        onClick={() => setAuthMode(null)}
                      >
                        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                        Menu
                      </button>
                    </div>

                    <div
                      className="min-h-0 shrink-0 overflow-hidden rounded-[1.5rem] border border-white/12 bg-[#1b1030]/96 px-4 py-4 text-white shadow-[0_18px_52px_rgba(3,1,12,0.34),inset_0_1px_0_rgba(255,255,255,0.08)]"
                      aria-live="polite"
                    >
                      <div className="mb-4 text-center">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#f0d58f]">
                          {authMode === "signup" ? "Start creating" : "Welcome back"}
                        </p>
                      </div>

                      {authMode === "login" ? (
                        <LoginForm
                          variant="inline"
                          inlineTone="dark"
                          successRedirectUrl={successRedirectUrl}
                          onInlineCancel={() => setAuthMode(null)}
                          onSwitchMode={setAuthMode}
                          onSuccess={closeSheet}
                        />
                      ) : (
                        <SignupForm
                          variant="inline"
                          inlineTone="dark"
                          successRedirectUrl={signupSuccessRedirectUrl}
                          signupSource={signupSource}
                          signupIntent={signupIntent}
                          onSwitchMode={setAuthMode}
                          onSuccess={closeSheet}
                        />
                      )}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </motion.section>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
