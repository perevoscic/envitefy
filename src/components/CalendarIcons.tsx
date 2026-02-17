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
      fill="currentColor"
      className={className}
    >
      <path d="M15.5 2.2c-.8 0-1.8.5-2.3 1.1-.5.6-.9 1.5-.8 2.3.9.1 1.8-.4 2.4-1 .5-.6.9-1.5.7-2.4z" />
      <path d="M20.3 17.1c-.4 1-1 1.9-1.7 2.8-.9 1.2-1.8 2.4-3.3 2.4-1.5 0-2-.9-3.7-.9-1.7 0-2.3.9-3.7.9-1.4 0-2.4-1.1-3.3-2.3-1.8-2.5-3.2-7-1.3-10.3 1-1.6 2.6-2.7 4.4-2.7 1.4 0 2.8 1 3.7 1 1 0 2.7-1.2 4.6-1 .8 0 3 .3 4.4 2.3-.1.1-2.6 1.5-2.6 4.5 0 3.6 3.2 4.8 3.3 4.8-.1.3-.4 1.1-.8 1.9z" />
    </svg>
  );
}
