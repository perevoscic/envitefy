"use client";
import Link from "next/link";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";

export default function TopNav() {
  const { data: session, status } = useSession();

  if (status !== "authenticated") return null;

  return (
    <header className="fixed top-0 inset-x-0 z-[300] h-16 border-b border-border bg-surface/60 backdrop-blur supports-[backdrop-filter]:bg-surface/60">
      <div className="mx-auto max-w-7xl h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="min-w-0">
            <span className="inline-flex items-center gap-1.5">
              <Image
                src="/E.png"
                alt="E"
                width={24}
                height={24}
                className="h-5 w-5 md:h-6 md:w-6"
                quality={100}
                unoptimized
              />
              <span
                className="text-base md:text-lg leading-tight"
                style={{
                  fontFamily: '"Venturis ADF", "Venturis ADF Fallback", serif',
                  background:
                    "linear-gradient(180deg, #d4ae51 0%, #9a7b2f 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  lineHeight: "1.2",
                  display: "inline-block",
                  paddingBottom: "0.05em",
                }}
              >
                nvitefy
              </span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
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
