import type { ComponentType } from "react";

type AnimatedButtonLabelProps = {
  label: string;
  icon?: ComponentType<{ className?: string }>;
  iconClassName?: string;
  className?: string;
  fullHeight?: boolean;
};

export default function AnimatedButtonLabel({
  label,
  icon: Icon,
  iconClassName = "h-4 w-4",
  className = "",
  fullHeight = false,
}: AnimatedButtonLabelProps) {
  const labelTrackClass = fullHeight
    ? "relative block h-full min-h-[1em] overflow-hidden"
    : "relative block h-[1.1em] overflow-hidden";
  const iconTrackClass = fullHeight
    ? "relative block h-full w-4 min-h-4 overflow-hidden"
    : "relative block h-4 w-4 overflow-hidden";
  const rollerClass =
    "absolute inset-0 flex items-center whitespace-nowrap transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform";

  return (
    <>
      <span className="sr-only">{label}</span>
      <span
        aria-hidden="true"
        className={`relative flex items-center gap-2 leading-none ${
          fullHeight ? "self-stretch" : ""
        } ${className}`}
      >
        <span className={labelTrackClass}>
          <span className="invisible whitespace-nowrap">{label}</span>
          <span className={`${rollerClass} translate-y-0 group-hover:-translate-y-full`}>
            {label}
          </span>
          <span className={`${rollerClass} translate-y-full group-hover:translate-y-0`}>
            {label}
          </span>
        </span>

        {Icon ? (
          <span className={iconTrackClass}>
            <span className={`${rollerClass} translate-y-0 justify-center group-hover:-translate-y-full`}>
              <span className="flex h-4 w-4 items-center justify-center">
                <Icon className={iconClassName} />
              </span>
            </span>
            <span className={`${rollerClass} translate-y-full justify-center group-hover:translate-y-0`}>
              <span className="flex h-4 w-4 items-center justify-center">
                <Icon className={iconClassName} />
              </span>
            </span>
          </span>
        ) : null}
      </span>
    </>
  );
}
