import type { SVGProps } from "react";

export function EditSquareIcon({
  className,
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M4 20l3.5-0.5L19 8 16 5 4.5 16.5 4 20z" />
      <path d="M14.5 3.5l3 3" />
    </svg>
  );
}
