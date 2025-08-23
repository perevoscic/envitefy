"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "./providers";
import Image from "next/image";
import { useState } from "react";
import Logo from "@/assets/logo.png";

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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

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
    <aside
      className={`hidden md:flex ${
        isCollapsed ? "md:w-16" : "md:w-64 lg:w-72"
      } flex-col border-r border-border bg-surface/60 min-h-[100dvh] transition-[width] duration-200`}
    >
      <div className="px-3 py-4 border-b border-border flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 min-w-0">
          {!isCollapsed && (
            <>
              <Image src={Logo} alt="Snap My Date" className="h-10 w-10" />
              <span className="text-lg font-semibold text-foreground truncate">
                Snap My Date
              </span>
            </>
          )}
        </Link>
        <button
          onClick={() => setIsCollapsed((v) => !v)}
          className="inline-flex items-center justify-center h-8 w-8 text-foreground/80 hover:text-foreground focus:outline-none"
          aria-label={isCollapsed ? "Open menu" : "Close sidebar"}
          title={isCollapsed ? "Open menu" : "Close sidebar"}
        >
          {isCollapsed ? (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          ) : (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          )}
        </button>
      </div>

      {!isCollapsed && (
        <nav className="flex-1 px-2 py-4 space-y-1">
          <NavItem href="/" label="Home" />
          {/* Add more items as routes are added */}
        </nav>
      )}

      {!isCollapsed && (
        <div className="px-3 py-4 border-t border-border space-y-2">
          <button
            onClick={() => setIsUserMenuOpen((v) => !v)}
            className="w-full flex items-center justify-between gap-3 rounded px-2 py-2 hover:bg-surface/70 focus:outline-none"
            aria-expanded={isUserMenuOpen}
            aria-controls="user-menu"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 flex items-center justify-center rounded-full bg-primary/15 text-primary text-sm font-medium">
                {initials}
              </div>
              <div className="min-w-0 text-left">
                <div className="text-sm text-foreground truncate">
                  {userName}
                </div>
                {userEmail && (
                  <div className="text-xs text-muted-foreground truncate">
                    {userEmail}
                  </div>
                )}
              </div>
            </div>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`text-foreground/80 transition-transform ${
                isUserMenuOpen ? "rotate-180" : ""
              }`}
              aria-hidden="true"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>

          {isUserMenuOpen && (
            <div
              id="user-menu"
              className="mt-1 rounded border border-border bg-surface/80 shadow-sm overflow-hidden"
              role="menu"
            >
              <Link
                href="/settings"
                className="block px-3 py-2 text-sm hover:bg-surface/70"
                role="menuitem"
              >
                Profile settings
              </Link>

              <button
                onClick={toggleTheme}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-surface/70"
                role="menuitem"
                aria-label="Toggle theme"
                title="Toggle theme"
              >
                <span>Theme</span>
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1 text-foreground">
                  {theme === "light" ? "Light" : "Dark"}
                </span>
              </button>

              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full text-left px-3 py-2 text-sm text-error hover:bg-error/10"
                role="menuitem"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
