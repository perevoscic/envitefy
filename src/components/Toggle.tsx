"use client";

import React from "react";

type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
};

/**
 * A highly visible toggle switch component optimized for both light and dark themes.
 * Features improved contrast, clear visual states, and smooth animations.
 */
export default function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
  size = "md",
  className = "",
}: ToggleProps) {
  const sizeClasses = {
    sm: {
      track: "h-5 w-9",
      thumb: "h-4 w-4",
      thumbTranslate: "translate-x-[1.25rem]", // w-9 - w-4 - 0.5rem padding
    },
    md: {
      track: "h-6 w-11",
      thumb: "h-5 w-5",
      thumbTranslate: "translate-x-[1.5rem]", // w-11 - w-5 - 0.5rem padding
    },
    lg: {
      track: "h-7 w-14",
      thumb: "h-6 w-6",
      thumbTranslate: "translate-x-[2rem]", // w-14 - w-6 - 0.5rem padding
    },
  };

  const sizes = sizeClasses[size];

  return (
    <label
      className={`flex items-center gap-3 cursor-pointer select-none ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
    >
      {label && (
        <span className="text-sm font-medium text-foreground dark:text-foreground">
          {label}
        </span>
      )}
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={(e) => !disabled && onChange(e.target.checked)}
          disabled={disabled}
        />
        {/* Track - much more visible with border and better colors */}
        <div
          className={`
            ${sizes.track}
            rounded-full
            transition-all duration-200 ease-in-out
            border-2
            ${
              checked
                ? "bg-primary border-primary dark:bg-primary dark:border-primary"
                : "bg-surface border-border dark:bg-surface dark:border-border/60"
            }
            shadow-inner
            ${disabled ? "opacity-50" : ""}
          `}
        />
        {/* Thumb - clearly visible with shadow and better contrast */}
        <div
          className={`
            absolute
            top-1/2
            left-0.5
            -translate-y-1/2
            ${sizes.thumb}
            rounded-full
            transition-all duration-200 ease-in-out
            ${
              checked
                ? `${sizes.thumbTranslate} bg-white dark:bg-white`
                : "translate-x-0 bg-white dark:bg-foreground/20"
            }
            shadow-md
            flex items-center justify-center
            ${disabled ? "opacity-50" : ""}
          `}
        >
          {/* Inner indicator dot for checked state */}
          {checked && (
            <span className="h-2 w-2 rounded-full bg-primary dark:bg-primary" />
          )}
        </div>
      </div>
    </label>
  );
}
