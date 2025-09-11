import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-[80dvh] flex items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-bold tracking-tight">404</h1>
        <p className="text-lg text-foreground/70">
          This page could not be found.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border bg-surface hover:bg-surface/80"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M3 12l9-9 9 9" />
              <path d="M9 21V9h6v12" />
            </svg>
            <span>Go home</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border bg-surface hover:bg-surface/80"
          >
            <span>Home</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
