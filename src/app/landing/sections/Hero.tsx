import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ClientHeroCtas from "../ClientHeroCtas";

export default async function Hero() {
  const session = await getServerSession(authOptions);
  const isAuthed = Boolean(session);
  return (
    <section className="w-full">
      <div className="max-w-7xl mx-auto px-6 pt-16 sm:pt-24 pb-10 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        <div className="text-center lg:text-left space-y-6">
          <h1 className="sr-only">Envitefy</h1>
          <div className="inline-flex flex-col items-center lg:items-start gap-3">
            <p className="wedding-kicker">Wedding-ready planning</p>
            <h1 className="text-4xl sm:text-6xl font-semibold leading-[1.08] tracking-tight text-foreground/90">
              <span
                className="block text-transparent bg-clip-text"
                style={{
                  backgroundImage:
                    "linear-gradient(120deg, #d1a67a 0%, #f5e0d0 40%, #9f6c4c 100%)",
                  fontFamily:
                    'var(--font-playfair), "Times New Roman", serif',
                }}
              >
                Create. Share. Enjoy.
              </span>
            </h1>
          </div>
          <p className="text-lg sm:text-xl text-foreground/80 max-w-2xl mx-auto lg:mx-0">
            Turn flyers, invites, and schedules into shareable plans in seconds,
            or craft your own event and smart sign-up form just as fast.
          </p>
          <p className="text-base sm:text-lg text-foreground/70 max-w-2xl mx-auto lg:mx-0">
            Build a shareable link, add smart sign-up forms, collect RSVPs by
            text or email, sync to Apple, Google or Outlook calendars, and let
            Envitefy auto-detect your events - no typing needed.
          </p>
          <ClientHeroCtas isAuthed={isAuthed} />
          <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-foreground/70">
            <span className="text-sm uppercase tracking-[0.35em] text-foreground/60">
              Works with
            </span>
            <div
              className="flex items-center gap-3"
              aria-label="Supported calendars"
            >
              <Image
                src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg"
                alt="Google Calendar logo"
                width={24}
                height={24}
              />
              <Image
                src="/brands/apple-black.svg"
                alt="Apple Calendar logo"
                width={24}
                height={24}
                className="show-light"
              />
              <Image
                src="/brands/apple-white.svg"
                alt=""
                width={24}
                height={24}
                className="show-dark"
                aria-hidden="true"
              />
              <Image
                src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg"
                alt="Outlook Calendar logo"
                width={24}
                height={24}
              />
            </div>
          </div>
        </div>

        <div className="hidden lg:block relative mx-auto lg:mx-0 lg:scale-[1.5] lg:origin-left lg:-translate-x-20">
          <Image
            src="/invite.png"
            alt="Invitation being scanned"
            width={900}
            height={700}
            priority
            className="show-light"
          />
          <Image
            src="/invite_dark.png"
            alt="Invitation being scanned (dark theme)"
            width={400}
            height={700}
            priority
            className="show-dark"
          />
        </div>
      </div>
    </section>
  );
}
