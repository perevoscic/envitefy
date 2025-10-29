import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — Envitefy",
  description:
    "Envitefy turns school flyers, invites, and schedules into calendar events in seconds — built for busy parents.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen w-full bg-background text-foreground landing-dark-gradient flex items-center justify-center p-6">
      <section className="w-full max-w-5xl grid grid-cols-1 items-center">
        <div className="text-center">
          <div className="bg-gradient-to-tr from-fuchsia-500/15 via-sky-400/15 to-violet-500/15 rounded-3xl p-1">
            <div className="rounded-3xl bg-surface/80 backdrop-blur-sm p-10 pb-16 border border-border">
              <h1 className="text-5xl sm:text-6xl font-extrabold leading-[1.18] tracking-tight pb-1 overflow-visible">
                <span className="bg-clip-text pb-10 text-transparent bg-gradient-to-r from-cyan-600 via-sky-500 to-fuchsia-600 dark:from-cyan-300 dark:via-sky-200 dark:to-fuchsia-300">
                  About
                  <span> </span>
                  <span className="font-pacifico inline-block pb-1"> Envitefy</span>
                  <span> </span>
                  <span className="font-montserrat"></span>
                </span>
              </h1>
              <p className="mt-4 text-base sm:text-lg uppercase tracking-[0.2em] text-foreground/60">
                Snap it. Save it.
              </p>
              <p className="mt-5 text-lg sm:text-xl text-foreground/80 max-w-3xl mx-auto">
                Envitefy was built by parents who were tired of digging through
                backpacks and group chats. Snap a picture of any flyer, invite,
                practice chart, or appointment card and we turn it into a clean
                calendar event with the right title, place, and reminders — no
                typing and no guesswork.
              </p>
              <p className="mt-6 text-lg sm:text-xl text-foreground/80 max-w-3xl mx-auto">
                From kindergarten concerts to travel tournaments and birthday
                parties, Envitefy understands the details that matter. It
                recognizes names written in script, catches spelled-out times
                like "four in the afternoon," and knows the difference between a
                home game and an away meet so your calendar always tells the
                full story.
              </p>
              <div className="mt-8 grid gap-5 sm:grid-cols-3 text-left">
                <div className="rounded-2xl bg-surface/60 border border-border p-5">
                  <h3 className="text-xl font-semibold text-center">
                    Built by busy parents
                  </h3>
                  <p className="mt-2 text-foreground/70">
                    Made to cut down the chaos — snap, save, and move on with
                    the rest of your day.
                  </p>
                </div>
                <div className="rounded-2xl bg-surface/60 border border-border p-5">
                  <h3 className="text-xl font-semibold text-center">
                    Zero typing. Real details.
                  </h3>
                  <p className="mt-2 text-foreground/70">
                    Names in cursive, spelled-out times, home vs away — we pull
                    the parts you would type anyway, so you do not have to.
                  </p>
                </div>
                <div className="rounded-2xl bg-surface/60 border border-border p-5">
                  <h3 className="text-xl font-semibold text-center">
                    Works with your calendar
                  </h3>
                  <p className="mt-2 text-foreground/70">
                    Save to Google or Outlook in a tap, or export an ICS for
                    Apple Calendar. Share full seasons in one file.
                  </p>
                </div>
              </div>
              <div className="mt-8 grid gap-5 sm:grid-cols-3 text-left">
                <div className="rounded-2xl bg-surface/60 border border-border p-5">
                  <h3 className="text-xl font-semibold text-center">
                    Snap to Event
                  </h3>
                  <p className="mt-2 text-foreground/70">
                    Title, time, location, and notes in one step — whether it is
                    a school recital, doctor visit, church gathering, or
                    birthday.
                  </p>
                </div>
                <div className="rounded-2xl bg-surface/60 border border-border p-5">
                  <h3 className="text-xl font-semibold text-center">
                    Repeat-aware
                  </h3>
                  <p className="mt-2 text-foreground/70">
                    Weekly practice tables become recurring events. Season
                    flyers import as a single clean file ready to share.
                  </p>
                </div>
                <div className="rounded-2xl bg-surface/60 border border-border p-5">
                  <h3 className="text-xl font-semibold text-center">
                    Built for real life
                  </h3>
                  <p className="mt-2 text-foreground/70">
                    Keep a tidy history of every flyer, gift paid months to a
                    friend, and stay in sync across devices.
                  </p>
                </div>
              </div>

              <div className="mt-10 grid gap-6 text-left">
                <div className="rounded-2xl bg-surface/60 border border-border p-6 sm:p-8">
                  <h2 className="text-2xl sm:text-3xl font-bold text-center">
                    What families love
                  </h2>
                  <ul className="mt-5 space-y-4 text-foreground/75">
                    <li>
                      <span className="font-semibold text-foreground">
                        Calm mornings:
                      </span>{" "}
                      events land on your calendar before the bells ring, so the
                      whole household knows where to be.
                    </li>
                    <li>
                      <span className="font-semibold text-foreground">
                        Ready for every invitation:
                      </span>{" "}
                      Envitefy handles weddings, showers, and milestone
                      birthdays without adding generic filler, keeping the
                      wording true to the card.
                    </li>
                    <li>
                      <span className="font-semibold text-foreground">
                        Team and club friendly:
                      </span>{" "}
                      save one clean file with every meet or match, then text or
                      email it to the other parents in seconds.
                    </li>
                    <li>
                      <span className="font-semibold text-foreground">
                        Works with your calendar:
                      </span>{" "}
                      save to Google or Outlook, or download an ICS for Apple —
                      no retyping required.
                    </li>
                    <li>
                      <span className="font-semibold text-foreground">
                        Thoughtful gifts:
                      </span>{" "}
                      send a friend or coach a bundle of paid months and we will
                      deliver a ready-to-use gift message when their payment
                      clears.
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 grid gap-6 text-left">
                <div className="rounded-2xl bg-surface/60 border border-border p-6 sm:p-8">
                  <h2 className="text-2xl sm:text-3xl font-bold text-center">
                    Our story
                  </h2>
                  <ul className="mt-5 space-y-4 text-foreground/75">
                    <li>
                      We started Envitefy as parents juggling concerts,
                      practices, appointments, and invites across group chats
                      and crumpled flyers.
                    </li>
                    <li>
                      We obsessed over accuracy — script names, spelled-out
                      times, home vs. away — so the saved event feels like the
                      original.
                    </li>
                    <li>
                      Today, families, coaches, and club organizers use Envitefy
                      to stay in sync without extra typing.
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-2xl px-7 py-3.5 text-lg font-semibold bg-teal-500 hover:bg-teal-400 active:bg-teal-600 text-neutral-900 shadow-lg shadow-teal-500/25"
                >
                  Start snapping
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-2xl px-7 py-3.5 text-lg font-semibold border border-border text-foreground/80 hover:text-foreground hover:border-foreground/60"
                >
                  Talk with us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
