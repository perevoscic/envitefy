import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ClientHeroCtas from "../ClientHeroCtas";

export default async function Hero() {
  const session = await getServerSession(authOptions);
  const isAuthed = Boolean(session);
  return (
    <section className="w-full">
      <div className="max-w-7xl mx-auto px-6 pt-16 sm:pt-24 pb-10 grid grid-cols-1 lg:grid-cols-2 gap-75 items-center">
        <div className="text-center lg:text-left">
          <h1 className="sr-only">Snap My Date - Snap it. Save it. Done.</h1>
          <h1 className="text-4xl sm:text-6xl font-extrabold leading-[1.08] tracking-tight">
            <div className="inline-block w-fit bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-sky-200 to-fuchsia-300 drop-shadow-fore-subtle text-stroke-subtle whitespace-nowrap">
              Snap it. Save it. Done.
            </div>
          </h1>
          <p className="mt-5 text-lg sm:text-xl text-foreground/80 max-w-2xl mx-auto lg:mx-0">
            Turn flyers and invites into calendar events in seconds.
          </p>
          <p className="mt-3 text-base sm:text-lg text-foreground/70 max-w-2xl mx-auto lg:mx-0">
            Now you can create and share your own events, too — no app installs
            needed.
          </p>
          <p>Impact-Site-Verification: 4423e484-94c7-440d-9dba-4fd92408244a</p>
          <ClientHeroCtas isAuthed={isAuthed} />
          <div className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-foreground/70">
            <span className="text-sm uppercase tracking-wide">Works with</span>
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
