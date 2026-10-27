"use client";

import { useEffect, useRef } from "react";
import ArrowFillLink from "@/components/ui/ArrowFillLink";
import styles from "./LandingGuestBenefits.module.css";

const benefits = [
  {
    initial: "R",
    label: "RSVPs",
    title: "Know who’s coming.",
    description: "Track guest responses and keep your guest list together.",
  },
  {
    initial: "S",
    label: "Sign-up forms",
    title: "Everyone brings something.",
    description: "Organize supplies, potluck dishes, and volunteers with easy sign-ups.",
  },
  {
    initial: "V",
    label: "Venue & details",
    title: "Get everyone there.",
    description: "Keep directions, arrival notes, and event details in one place.",
  },
  {
    initial: "P",
    label: "Planning together",
    title: "Share the planning.",
    description: "Add co-hosts to help organize and manage your event.",
  },
] as const;

export default function LandingGuestBenefits() {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cards = [...canvas.querySelectorAll<HTMLElement>("[data-benefit-card]")];

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const mode = () => (reducedMotion.matches ? null : finePointer.matches ? "pointer" : "scroll");
    let pointer: { x: number; y: number } | null = null;
    let inView = false;
    let frame = 0;

    const reset = () => {
      window.cancelAnimationFrame(frame);
      frame = 0;
      pointer = null;
      canvas.removeAttribute("data-glow-active");
      canvas.style.removeProperty("--glow-x");
      canvas.style.removeProperty("--glow-y");
      for (const card of cards) {
        card.style.removeProperty("--glow-offset-x");
        card.style.removeProperty("--glow-offset-y");
      }
    };
    const paint = () => {
      frame = 0;
      const currentMode = mode();
      if (!currentMode) {
        reset();
        canvas.removeAttribute("data-glow-mode");
        return;
      }
      if (document.hidden) return;
      const bounds = canvas.getBoundingClientRect();
      let x: number;
      let y: number;
      if (currentMode === "scroll") {
        if (!inView || bounds.bottom <= 0 || bounds.top >= window.innerHeight) {
          reset();
          return;
        }
        // A shared reading light drifts across the stack as the visitor scrolls.
        // It stops with the page and retraces the same path on upward scrolling.
        y = window.innerHeight * 0.58;
        const progress = Math.max(0, Math.min(1, (y - bounds.top) / bounds.height));
        x = bounds.left + bounds.width * (0.18 + progress * 0.64);
      } else {
        if (!pointer) return;
        ({ x, y } = pointer);
        if (x < bounds.left || x > bounds.right || y < bounds.top || y > bounds.bottom) {
          reset();
          return;
        }
      }

      // Desktop tilts must settle; touch cards keep a simple lift that we can track.
      const settling = cards.some((card) =>
        [...card.getAnimations(), ...(card.parentElement?.getAnimations() ?? [])].some(
          (animation) =>
            animation instanceof CSSTransition &&
            ["rotate", "scale", "translate"].includes(animation.transitionProperty) &&
            animation.playState === "running",
        ),
      );
      if (settling && currentMode === "pointer") {
        canvas.removeAttribute("data-glow-active");
        frame = window.requestAnimationFrame(paint);
        return;
      }

      // Each card reveals the same light field at its position in this canvas.
      // Read all geometry before writing styles so pointer updates do not thrash layout.
      const offsets = cards.map((card) => {
        const rect = card.getBoundingClientRect();
        return { card, x: rect.left - bounds.left, y: rect.top - bounds.top };
      });
      canvas.style.setProperty("--glow-x", `${(x - bounds.left).toFixed(2)}px`);
      canvas.style.setProperty("--glow-y", `${(y - bounds.top).toFixed(2)}px`);
      for (const offset of offsets) {
        offset.card.style.setProperty("--glow-offset-x", `${offset.x.toFixed(2)}px`);
        offset.card.style.setProperty("--glow-offset-y", `${offset.y.toFixed(2)}px`);
      }
      canvas.setAttribute("data-glow-mode", currentMode);
      canvas.setAttribute("data-glow-active", "true");
      if (settling && currentMode === "scroll") frame = window.requestAnimationFrame(paint);
    };
    const schedule = () => {
      const currentMode = mode();
      if (!currentMode) {
        reset();
        canvas.removeAttribute("data-glow-mode");
        return;
      }
      if (
        !document.hidden &&
        !frame &&
        ((currentMode === "pointer" && pointer) || (currentMode === "scroll" && inView))
      ) {
        frame = window.requestAnimationFrame(paint);
      }
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType === "touch") {
        reset();
        return;
      }
      pointer = { x: event.clientX, y: event.clientY };
      schedule();
    };
    const sync = () => {
      reset();
      canvas.removeEventListener("pointermove", move);
      const currentMode = mode();
      if (currentMode) canvas.setAttribute("data-glow-mode", currentMode);
      else canvas.removeAttribute("data-glow-mode");
      if (currentMode === "pointer")
        canvas.addEventListener("pointermove", move, { passive: true });
      else schedule();
    };
    const endPointer = () => {
      if (mode() === "pointer") reset();
    };
    const visibility = () => {
      if (document.hidden) reset();
      else schedule();
    };

    const resizeObserver = new ResizeObserver(schedule);
    resizeObserver.observe(canvas);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (!inView && mode() === "scroll") reset();
      else schedule();
    });
    intersectionObserver.observe(canvas);
    canvas.addEventListener("pointerleave", endPointer);
    canvas.addEventListener("pointercancel", endPointer);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("blur", reset);
    window.addEventListener("focus", schedule);
    document.addEventListener("visibilitychange", visibility);
    reducedMotion.addEventListener("change", sync);
    finePointer.addEventListener("change", sync);
    sync();
    return () => {
      reset();
      canvas.removeAttribute("data-glow-mode");
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerleave", endPointer);
      canvas.removeEventListener("pointercancel", endPointer);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("blur", reset);
      window.removeEventListener("focus", schedule);
      document.removeEventListener("visibilitychange", visibility);
      reducedMotion.removeEventListener("change", sync);
      finePointer.removeEventListener("change", sync);
    };
  }, []);

  return (
    <section id="guest-flow" className={styles.section} aria-labelledby="benefits-heading">
      <div className={styles.header}>
        <div className={styles.heading} data-motion-reveal>
          <p className={styles.eyebrow}>Thoughtful for guests. Easier for you.</p>
          <h2 id="benefits-heading">
            Less chasing. <strong>More celebrating.</strong>
          </h2>
        </div>
        <div className={styles.intro} data-motion-reveal>
          <p>
            A lovely invitation is just the beginning. Give everyone a place to return to for the
            plan, the little details and the latest updates.
          </p>
          <ArrowFillLink href="#showcase" label="Explore the guest experience" />
        </div>
      </div>
      <div ref={canvasRef} className={styles.cards} data-benefit-canvas>
        {benefits.map(({ initial, label, title, description }) => (
          <article key={label} className={styles.reveal} data-motion-reveal data-guest-benefit>
            <div className={styles.card} data-benefit-card>
              <div className={styles.identity}>
                <span className={styles.initial} aria-hidden="true">
                  {initial}
                </span>
                <p className={styles.label}>{label}</p>
              </div>
              <div className={styles.copy}>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
