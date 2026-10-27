import type { ButtonHTMLAttributes } from "react";
import styles from "./AnimatedBorderButton.module.css";

/** Adds a decorative border lap while leaving the caller's button styling intact. */
export default function AnimatedBorderButton({
  children,
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} type={type} className={[styles.button, className].filter(Boolean).join(" ")}>
      <span className={styles.border} data-animated-button-border="" aria-hidden="true">
        <span className={styles.runner} data-animated-button-border-runner="" />
      </span>
      {children}
    </button>
  );
}
