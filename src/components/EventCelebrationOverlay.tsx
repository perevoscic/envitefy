"use client";

import { balloons } from "balloons-js";
import confetti from "canvas-confetti";
import { useEffect } from "react";
import type { EventCelebrationKind } from "../utils/event-celebration";

type EventCelebrationOverlayProps = {
  kind: EventCelebrationKind;
};

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
  );
}

function launchGraduationHats() {
  const scalar = 5;
  const graduationCap = confetti.shapeFromText({ text: "🎓", scalar });

  const defaults = {
    spread: 360,
    ticks: 120,
    gravity: 0.5,
    decay: 0.96,
    startVelocity: 30,
    shapes: [graduationCap],
    scalar,
    origin: { x: 0.5, y: 1 },
  };

  const shoot = () => {
    confetti({
      ...defaults,
      particleCount: 30,
    });

    confetti({
      ...defaults,
      particleCount: 5,
      flat: true,
    });

    confetti({
      ...defaults,
      particleCount: 15,
      scalar: scalar / 2,
      shapes: ["circle"],
    });
  };

  window.setTimeout(shoot, 0);
  window.setTimeout(shoot, 100);
  window.setTimeout(shoot, 200);
}

export default function EventCelebrationOverlay({ kind }: EventCelebrationOverlayProps) {
  useEffect(() => {
    if (prefersReducedMotion()) return;

    if (kind === "birthday-balloons") {
      void balloons();
      return;
    }

    launchGraduationHats();
  }, [kind]);

  return null;
}
