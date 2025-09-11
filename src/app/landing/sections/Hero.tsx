import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ClientHeroCtas from "../ClientHeroCtas";

export default async function Hero() {
  const session = await getServerSession(authOptions);
  const isAuthed = Boolean(session);
  return (
    <section className="w-full">
      <div className="max-w-7xl mx-auto px-6 pt-16 sm:pt-24 pb-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="text-center lg:text-left">
          <h1 className="text-4xl sm:text-6xl font-extrabold leading-[1.08] tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-sky-200 to-fuchsia-300 drop-shadow-fore-subtle text-stroke-subtle">
              Snap it.
            </span>
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-sky-200 to-fuchsia-300 drop-shadow-fore-subtle text-stroke-subtle">
              We calendar it.
            </span>
          </h1>
          <p className="mt-5 text-lg sm:text-xl text-foreground/80 max-w-2xl mx-auto lg:mx-0">
            Turn flyers, team schedules, invites, and appointment cards into
            ready‑to‑save calendar events. No typing.
          </p>
          <ClientHeroCtas isAuthed={isAuthed} />
          <div className="mt-4 text-center lg:text-left">
            <Link
              href="#demo"
              className="text-sm text-foreground/70 hover:text-foreground underline underline-offset-4"
            >
              Try a live demo ↓
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-3 text-foreground/70">
            <span className="text-sm">Works with</span>
            <span
              className="inline-flex items-center justify-center rounded-full border border-border p-1.5 bg-surface/60"
              aria-label="Google"
            >
              <Image
                src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg"
                alt="Google logo"
                width={20}
                height={20}
              />
            </span>
            <span
              className="inline-flex items-center justify-center rounded-full border border-border p-1.5 bg-surface/60"
              aria-label="Apple"
            >
              <Image
                src="/brands/apple-black.svg"
                alt="Apple logo"
                width={20}
                height={20}
                className="show-light"
              />
              <Image
                src="/brands/apple-white.svg"
                alt="Apple logo"
                width={20}
                height={20}
                className="show-dark"
              />
            </span>
            <span
              className="inline-flex items-center justify-center rounded-full border border-border p-1.5 bg-surface/60"
              aria-label="Microsoft"
            >
              <Image
                src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg"
                alt="Microsoft logo"
                width={20}
                height={20}
              />
            </span>
          </div>
        </div>

        <div className="hidden lg:block relative mx-auto lg:mx-0 w-[300px] sm:w-[360px] aspect-[9/19.5] rounded-[38px] bg-neutral-800 shadow-2xl ring-1 ring-white/10 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 mt-2 h-6 w-40 rounded-full bg-black/70" />
          <div className="absolute inset-[14px] rounded-[28px] overflow-hidden">
            <Image
              src="/invite.jpg"
              alt="Invitation being scanned"
              fill
              sizes="(max-width: 1024px) 360px, 400px"
              className="object-cover"
              priority
            />
            <div className="scanwrap absolute inset-0" aria-hidden="true">
              <div className="scanline"></div>
              <div className="scanglow"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
