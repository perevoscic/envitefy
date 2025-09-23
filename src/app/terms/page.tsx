"use client";
import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen w-full bg-background text-foreground landing-dark-gradient flex items-center justify-center p-6">
      <section className="w-full max-w-5xl grid grid-cols-1 items-center">
        <div className="text-center">
          <h1 className="sr-only">Snap My Date</h1>
          <div className="bg-gradient-to-tr from-fuchsia-500/15 via-sky-400/15 to-violet-500/15 rounded-3xl p-1">
            <div className="rounded-3xl bg-surface/80 backdrop-blur-sm p-10 pb-16 border border-border">
              <h1 className="text-5xl sm:text-6xl font-extrabold leading-[1.18] tracking-tight pb-1 overflow-visible">
                <span className="bg-clip-text pb-10 text-transparent bg-gradient-to-r from-cyan-600 via-sky-500 to-fuchsia-600 dark:from-cyan-300 dark:via-sky-200 dark:to-fuchsia-300">
                  Terms of Use
                </span>
              </h1>
              <p className="mt-5 text-lg sm:text-xl text-foreground/80 max-w-3xl mx-auto">
                These terms govern your use of Snap My Date. Please read them
                carefully.
              </p>

              <div className="mt-8 text-left max-w-3xl mx-auto space-y-6 text-foreground/80">
                <section>
                  <h2 className="text-xl font-semibold text-foreground">
                    Use of the service
                  </h2>
                  <p className="mt-2">
                    You agree to use the app lawfully and not to misuse OCR or
                    calendar integrations.
                  </p>
                </section>
                <section>
                  <h2 className="text-xl font-semibold text-foreground">
                    Accounts
                  </h2>
                  <p className="mt-2">
                    You are responsible for maintaining the confidentiality of
                    your account and credentials.
                  </p>
                </section>
                <section>
                  <h2 className="text-xl font-semibold text-foreground">
                    Limitation of liability
                  </h2>
                  <p className="mt-2">
                    The service is provided “as is” without warranties;
                    liability is limited to the maximum extent permitted by law.
                  </p>
                </section>
              </div>

              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-2xl px-7 py-3.5 text-lg font-semibold bg-teal-500 hover:bg-teal-400 active:bg-teal-600 text-neutral-900 shadow-lg shadow-teal-500/25"
                >
                  Back home
                </Link>
                <Link
                  href="/privacy"
                  className="inline-flex items-center justify-center rounded-2xl px-7 py-3.5 text-lg font-semibold border border-border text-foreground/80 hover:text-foreground hover:border-foreground/60"
                >
                  Privacy policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
