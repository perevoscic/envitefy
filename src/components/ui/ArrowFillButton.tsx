import { ArrowRight } from "lucide-react";
import type { ButtonHTMLAttributes, CSSProperties } from "react";
import AnimatedBorderButton from "./AnimatedBorderButton";
import styles from "./ArrowFillButton.module.css";
import LiquidMetalButton from "./LiquidMetalButton";

type ArrowFillButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  label: string;
  animatedBorder?: boolean;
  liquidBorder?: boolean;
};

export const arrowFillClassName = styles.button;
export const arrowFillPaddingStyle: CSSProperties = {
  paddingInlineEnd:
    "calc(var(--arrow-fill-circle, 28px) + var(--arrow-fill-right, 6px) + var(--arrow-fill-label-gap, 10px))",
};

export function ArrowFillContent({ label }: { label: string }) {
  return (
    <>
      <span className={styles.label} data-arrow-fill-label="">
        {label}
      </span>
      <span className={styles.surface} data-arrow-fill-surface="" aria-hidden="true" />
      <span className={styles.overlay} data-arrow-fill-label-overlay="" aria-hidden="true">
        {label}
      </span>
      <span className={styles.icon} data-arrow-fill-icon="" aria-hidden="true">
        <ArrowRight className={styles.nextArrow} data-arrow-fill-arrow-next="" strokeWidth={1.8} />
        <ArrowRight
          className={styles.currentArrow}
          data-arrow-fill-arrow-current=""
          strokeWidth={1.8}
        />
      </span>
    </>
  );
}

/** Native button with a theme-colored arrow circle that expands on interaction. */
export default function ArrowFillButton({
  label,
  animatedBorder = false,
  liquidBorder = false,
  className,
  style,
  type = "button",
  ...props
}: ArrowFillButtonProps) {
  const Button = liquidBorder
    ? LiquidMetalButton
    : animatedBorder
      ? AnimatedBorderButton
      : "button";
  return (
    <Button
      {...props}
      {...(liquidBorder ? { label } : {})}
      type={type}
      className={[styles.button, className].filter(Boolean).join(" ")}
      style={{
        ...arrowFillPaddingStyle,
        ...style,
      }}
      data-arrow-fill-button=""
    >
      <ArrowFillContent label={label} />
    </Button>
  );
}
