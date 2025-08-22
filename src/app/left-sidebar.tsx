"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "./providers";

function NavItem({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      className={
        "flex items-center gap-3 rounded px-3 py-2 text-sm " +
        (isActive
          ? "bg-primary/10 text-primary"
          : "text-foreground/80 hover:text-foreground hover:bg-surface/70 border-border")
      }
      aria-current={isActive ? "page" : undefined}
    >
      {label}
    </Link>
  );
}

export default function LeftSidebar() {
  const { data: session, status } = useSession();
  const { theme, toggleTheme } = useTheme();

  // Hide the sidebar entirely when not authenticated (or while loading)
  if (status !== "authenticated") {
    return null;
  }

  const userName = (session?.user?.name as string | undefined) || "Guest";
  const userEmail = (session?.user?.email as string | undefined) || "";
  const initials = userName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside className="hidden md:flex md:w-64 lg:w-72 flex-col border-r border-border bg-surface/60 min-h-[100dvh]">
      <div className="px-4 py-4 border-b border-border">
        <Link href="/" className="text-lg font-semibold text-foreground">
          Snap My Date
        </Link>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        <NavItem href="/" label="Home" />
        {/* Add more items as routes are added */}
      </nav>

      <div className="px-3 py-4 border-t border-border space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 flex items-center justify-center rounded-full bg-primary/15 text-primary text-sm font-medium">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-sm text-foreground truncate">{userName}</div>
            {userEmail && (
              <div className="text-xs text-muted-foreground truncate">
                {userEmail}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">Theme</span>
          <button
            onClick={toggleTheme}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1 text-sm text-foreground hover:opacity-90"
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {theme === "light" ? "Light" : "Dark"}
          </button>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full justify-center inline-flex items-center rounded border border-border bg-surface px-3 py-2 text-sm text-error hover:bg-error/10"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}
