import type { SVGProps } from "react";

type LiveCardIconProps = SVGProps<SVGSVGElement> & {
  size?: number | string;
};

export function LiveCardIcon({ size = 24, ...props }: LiveCardIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect x="5" y="2" width="14" height="20" rx="3" />
      <path d="M10 5h4" />
      <g fill="currentColor" stroke="none">
        <circle cx="9" cy="18" r="1" />
        <circle cx="12" cy="18" r="1" />
        <circle cx="15" cy="18" r="1" />
      </g>
    </svg>
  );
}
