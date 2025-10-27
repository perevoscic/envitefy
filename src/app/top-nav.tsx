"use client";
import Link from "next/link";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "./providers";
import Logo from "@/assets/logo.png";

export default function TopNav() {
  const { data: session, status } = useSession();
  const { theme, toggleTheme } = useTheme();

  if (status !== "authenticated") return null;

  return (
    <header className="fixed top-0 inset-x-0 z-[300] h-16 border-b border-border bg-surface/60 backdrop-blur supports-[backdrop-filter]:bg-surface/60">
      <div className="mx-auto max-w-7xl h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="flex items-center gap-2 min-w-0">
            <Image src={Logo} alt="Envitefy" className="h-9 w-9" />
            <span className="text-base text-foreground truncate leading-tight">
              <span className="block truncate font-montserrat font-semibold">
                Envitefy
              </span>
              <span className="block text-xs text-foreground/60 truncate">
                Create. Share. Enjoy.
              </span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="inline-flex items-center justify-center h-9 w-9 rounded border border-border text-foreground/80 hover:text-foreground hover:bg-surface/70"
            title="Toggle theme"
          >
            {theme === "dark" ? (
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
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
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
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M22 12h-2M4 12H2M17.657 6.343l-1.414 1.414M7.757 16.243l-1.414 1.414M17.657 17.657l-1.414-1.414M7.757 7.757L6.343 6.343" />
              </svg>
            )}
          </button>

          {status !== "authenticated" ? (
            <div className="flex items-center gap-2" />
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="inline-flex items-center gap-2 h-9 px-3 text-sm rounded border border-border bg-transparent text-foreground/80 hover:text-foreground hover:bg-surface/70 outline-none focus:outline-none ring-0 focus:ring-0 shadow-none hover:shadow-none active:shadow-none transition-none"
                aria-label="Log out"
                title="Log out"
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
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
