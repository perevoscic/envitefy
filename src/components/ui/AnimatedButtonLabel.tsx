import type { ComponentType } from "react";

type AnimatedButtonLabelProps = {
  label: string;
  icon?: ComponentType<{ className?: string }>;
  iconClassName?: string;
  iconPosition?: "leading" | "trailing";
  className?: string;
};

export default function AnimatedButtonLabel({
  label,
  icon: Icon,
  iconClassName = "h-4 w-4",
  iconPosition = "trailing",
  className = "",
}: AnimatedButtonLabelProps) {
  const iconTrack = Icon ? (
    <span className="cta-roller-icon-track">
      <span className="cta-roller-icon-measure">
        <span className="cta-roller-icon-slot">
          <Icon className={iconClassName} />
        </span>
      </span>
      <span className="cta-roller-item cta-roller-item--current cta-roller-icon-slot">
        <Icon className={iconClassName} />
      </span>
      <span className="cta-roller-item cta-roller-item--next cta-roller-icon-slot">
        <Icon className={iconClassName} />
      </span>
    </span>
  ) : null;

  return (
    <>
      <span className="sr-only">{label}</span>
      <span aria-hidden="true" className={`cta-roller-content ${className}`.trim()}>
        {iconPosition === "leading" ? iconTrack : null}
        <span className="cta-roller-track">
          <span className="cta-roller-measure">{label}</span>
          <span className="cta-roller-item cta-roller-item--current">{label}</span>
          <span className="cta-roller-item cta-roller-item--next">{label}</span>
        </span>
        {iconPosition === "trailing" ? iconTrack : null}
      </span>
    </>
  );
}
