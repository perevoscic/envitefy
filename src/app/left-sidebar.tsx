"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "./providers";
import Image from "next/image";
import { useState } from "react";
import Logo from "@/assets/logo.png";

function SunIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M22 12h-2M4 12H2M17.657 6.343l-1.414 1.414M7.757 16.243l-1.414 1.414M17.657 17.657l-1.414-1.414M7.757 7.757L6.343 6.343" />
    </svg>
  );
}

function UserIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function BookIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 19.5V6a2 2 0 0 1 2-2h11a1 1 0 0 1 1 1v14" />
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H18" />
    </svg>
  );
}

function LogoutIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function MoonIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

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
      } flex-col border-r border-border bg-surface/60 h-full overflow-y-auto transition-[width] duration-200`}
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
          <div className="relative">
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
                className="absolute bottom-full left-0 mb-1 w-full rounded-lg border border-border bg-surface/90 shadow-lg overflow-hidden z-50"
                role="menu"
              >
                <Link
                  href="/settings"
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface/70"
                  role="menuitem"
                >
                  <UserIcon className="h-4 w-4" />
                  <span>Profile settings</span>
                </Link>

                <Link
                  href="/resources"
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface/70"
                  role="menuitem"
                >
                  <BookIcon className="h-4 w-4" />
                  <span>Resources</span>
                </Link>

                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-surface/70"
                  role="menuitem"
                  aria-label="Toggle theme"
                  title="Toggle theme"
                >
                  <span className="inline-flex items-center gap-2 text-foreground">
                    <SunIcon className="h-4 w-4" />
                    <span>Theme</span>
                  </span>
                  <span
                    role="switch"
                    aria-checked={theme === "dark"}
                    className={`relative inline-flex h-6 w-12 items-center rounded-full border border-border transition-colors ${
                      theme === "dark" ? "bg-primary/60" : "bg-surface/70"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-surface shadow-sm transition-transform flex items-center justify-center ${
                        theme === "dark" ? "translate-x-6" : "translate-x-0"
                      }`}
                    >
                      {theme === "light" ? (
                        <SunIcon className="h-3.5 w-3.5" />
                      ) : (
                        <MoonIcon className="h-3.5 w-3.5" />
                      )}
                    </span>
                  </span>
                </button>

                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full text-left px-3 py-2 text-sm text-error hover:bg-error/10 flex items-center gap-2"
                  role="menuitem"
                >
                  <LogoutIcon className="h-4 w-4" />
                  <span>Log out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
