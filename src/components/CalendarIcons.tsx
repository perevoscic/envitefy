export function CalendarIconGoogle({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 48 48"
      className={className}
    >
      <path
        fill="currentColor"
        d="M43.611 20.083H24v8h11.303C33.654 32.74 29.223 36.083 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C32.651 6.053 28.478 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

export function CalendarIconOutlook({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 23 23"
      className={className}
    >
      <rect width="10" height="10" x="1" y="1" fill="currentColor" />
      <rect width="10" height="10" x="12" y="1" fill="currentColor" />
      <rect width="10" height="10" x="1" y="12" fill="currentColor" />
      <rect width="10" height="10" x="12" y="12" fill="currentColor" />
    </svg>
  );
}

export function CalendarIconApple({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <circle cx="12" cy="15" r="1.5" fill="#ef4444" />
    </svg>
  );
}
