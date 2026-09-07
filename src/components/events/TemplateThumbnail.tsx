import type { ComponentProps, ReactNode } from "react";

/** The shared wedding-style frame for template galleries and design pickers. */
export function TemplateThumbnailFrame({ children }: { children: ReactNode }) {
  return (
    <div
      data-template-thumbnail-frame
      className="relative w-full overflow-hidden rounded-[1.35rem] border border-[#ddd4ca] bg-white p-2 shadow-[0_18px_50px_rgba(59,45,33,0.08)] transition duration-500 group-hover:-translate-y-1 group-hover:shadow-[0_28px_70px_rgba(59,45,33,0.16)] motion-reduce:transform-none motion-reduce:transition-none"
    >
      {children}
    </div>
  );
}

/** Render a passive, square thumbnail; scale real event pages to one quarter size. */
export function TemplateThumbnailPreview({
  children,
  className = "",
  scaled = true,
  compact = false,
  ...props
}: ComponentProps<"div"> & {
  scaled?: boolean;
  /** Reserved for the decorative wedding hero runway, outside template lists. */
  compact?: boolean;
}) {
  return (
    <div
      {...props}
      aria-hidden="true"
      inert
      data-template-thumbnail-preview
      className={`relative isolate ${compact ? "aspect-[16/10]" : "aspect-square"} w-full overflow-hidden rounded-[1rem] bg-white ${className}`}
    >
      <div
        className={
          scaled
            ? "pointer-events-none absolute left-0 top-0 h-[400%] w-[400%] origin-top-left scale-[0.25] select-none"
            : "pointer-events-none absolute inset-0 select-none"
        }
      >
        {children}
      </div>
    </div>
  );
}
