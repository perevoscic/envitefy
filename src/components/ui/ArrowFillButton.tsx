import { ArrowRight } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";
import AnimatedBorderButton from "./AnimatedBorderButton";
import styles from "./ArrowFillButton.module.css";

type ArrowFillButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  label: string;
  animatedBorder?: boolean;
};

/** Native button with a theme-colored arrow circle that expands on interaction. */
export default function ArrowFillButton({
  label,
  animatedBorder = false,
  className,
  style,
  type = "button",
  ...props
}: ArrowFillButtonProps) {
  const Button = animatedBorder ? AnimatedBorderButton : "button";
  return (
    <Button
      {...props}
      type={type}
      className={[styles.button, className].filter(Boolean).join(" ")}
      style={{
        paddingInlineEnd:
          "calc(var(--arrow-fill-circle, 28px) + var(--arrow-fill-right, 6px) + var(--arrow-fill-label-gap, 10px))",
        ...style,
      }}
      data-arrow-fill-button=""
    >
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
    </Button>
  );
}
