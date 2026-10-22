"use client";

import { Fragment } from "react";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";

export type FlipClockUnit = {
  label: string;
  value: string;
};

type FlipClockProps = {
  units: FlipClockUnit[];
  className?: string;
};

function FlipClockDigit({
  digit,
  digitKey,
}: {
  digit: string;
  digitKey: string;
}) {
  return (
    <div className="flip-clock-perspective relative h-12 w-8 select-none sm:h-14 sm:w-10 md:h-[4.5rem] md:w-[3.25rem]">
      <div className="flip-clock-tile absolute inset-0 overflow-hidden rounded-[10px] border md:rounded-xl">
        <div className="flip-clock-upper absolute inset-x-0 top-0 h-1/2 border-b" />
        <div className="flip-clock-lower absolute inset-x-0 bottom-0 h-1/2" />
        <div className="flip-clock-seam absolute inset-x-0 top-1/2 h-px -translate-y-1/2" />
      </div>

      <div className="flip-clock-hinge absolute left-0 top-1/2 z-20 h-2.5 w-1 -translate-y-1/2 rounded-r-full sm:h-3 sm:w-1.5 md:h-4" />
      <div className="flip-clock-hinge absolute right-0 top-1/2 z-20 h-2.5 w-1 -translate-y-1/2 rounded-l-full sm:h-3 sm:w-1.5 md:h-4" />

      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={`${digitKey}-${digit}`}
          initial={{ opacity: 0, rotateX: 90, y: -10 }}
          animate={{ opacity: 1, rotateX: 0, y: 0 }}
          exit={{ opacity: 0, rotateX: -90, y: 10 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="flip-clock-face absolute inset-0 z-10 flex items-center justify-center font-mono text-[1.9rem] font-black tracking-[-0.08em] sm:text-[2.35rem] md:text-[3rem]"
        >
          {digit}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

function FlipClockUnitDisplay({ label, value }: FlipClockUnit) {
  const digits = value.padStart(2, "0").split("");

  return (
    <div className="flex w-full flex-col items-center gap-1.5 sm:gap-2 md:gap-3">
      <div
        role="img"
        className="inline-grid grid-flow-col auto-cols-max gap-1 sm:gap-1.5 md:gap-2"
        aria-label={`${label}: ${value}`}
      >
        {digits.map((digit, index) => (
          <FlipClockDigit key={`${label}-${index}`} digit={digit} digitKey={`${label}-${index}`} />
        ))}
      </div>
      <p className="flip-clock-label font-mono text-[8px] font-bold uppercase tracking-[0.22em] sm:text-[9px] sm:tracking-[0.28em] md:text-[11px] md:tracking-[0.35em]">
        {label}
      </p>
    </div>
  );
}

function FlipClockSeparator() {
  return (
    <div className="flex h-12 shrink-0 items-center justify-center sm:h-14 md:h-[4.5rem]">
      <div className="flex flex-col gap-1 sm:gap-1.5 md:gap-2">
        <div className="flip-clock-dot h-1 w-1 rounded-full sm:h-1.5 sm:w-1.5" />
        <div className="flip-clock-dot h-1 w-1 rounded-full sm:h-1.5 sm:w-1.5" />
      </div>
    </div>
  );
}

export function FlipClock({ units, className }: FlipClockProps) {
  return (
    <div
      className={clsx(
        "flex w-full max-w-full items-start gap-1.5 pb-1 sm:gap-2.5 md:gap-4",
        className,
      )}
    >
      {units.map((unit, index) => (
        <Fragment key={unit.label}>
          <div
            className="flex min-w-0 flex-1 items-start justify-center"
            style={{ flex: Math.max(unit.value.length, 2) }}
          >
            <FlipClockUnitDisplay {...unit} />
          </div>
          {index < units.length - 1 ? <FlipClockSeparator /> : null}
        </Fragment>
      ))}
    </div>
  );
}
