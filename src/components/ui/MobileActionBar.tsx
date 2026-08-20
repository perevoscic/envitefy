import type { ReactNode } from "react";

export function MobileActionBar({
  children,
  className = "",
  label = "Page actions",
}: {
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <div
      role="region"
      aria-label={label}
      data-mobile-action-bar
      className={`mobile-safe-action-bar ${className}`}
    >
      {children}
    </div>
  );
}
