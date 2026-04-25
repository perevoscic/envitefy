"use client";
import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-[#f6f2ff] via-white to-[#f7f3ff] text-foreground flex items-center justify-center p-6">
      <section className="w-full max-w-5xl grid grid-cols-1 items-center">
        <div className="text-center">
          <h1 className="sr-only">Envitefy — Create. Share. Enjoy.</h1>
          <div className="bg-gradient-to-tr from-[#efe8ff] via-white to-[#f4edff] rounded-3xl p-1">
            <div className="rounded-3xl bg-white/95 backdrop-blur-sm p-10 pb-16 border border-[#e5dcff] shadow-[0_20px_60px_rgba(127,140,255,0.12)]">
              <h1 className="text-5xl sm:text-6xl font-extrabold leading-[1.18] tracking-tight pb-1 overflow-visible">
                <span className="bg-clip-text pb-10 text-transparent bg-gradient-to-r from-[#5a56d6] via-[#7F8CFF] to-[#9a84ff]">
                  Terms of Use
                </span>
              </h1>
              <p className="mt-5 text-lg sm:text-xl text-foreground/80 max-w-3xl mx-auto">
                By using Envitefy, you agree to these terms.
              </p>

              <div className="mt-8 text-left max-w-3xl mx-auto space-y-6 text-foreground/80">
                <section>
                  <h2 className="text-xl font-semibold text-foreground">Services</h2>
                  <p className="mt-2">
                    Envitefy provides event creation, public event pages, RSVP/sign-up workflows,
                    and calendar-related coordination tools.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground">
                    New participation features
                  </h2>
                  <p className="mt-2">
                    Our platform includes participation workflows that allow hosts to collect RSVP
                    and sign-up responses. You are responsible for reviewing information before
                    publishing or sharing any event details.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground">
                    Eligibility and account responsibility
                  </h2>
                  <p className="mt-2">
                    You must be at least 13 years old to use the service. You are responsible for
                    maintaining account security and for all activity under your account.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground">Acceptable use</h2>
                  <ul className="mt-2 list-disc pl-6 space-y-1">
                    <li>No illegal activity, harassment, or infringement.</li>
                    <li>No attempts to disrupt, overload, or reverse engineer the service.</li>
                    <li>No unauthorized automation or scraping outside documented interfaces.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground">Content and rights</h2>
                  <p className="mt-2">
                    You retain ownership of your content and grant us a limited license to process
                    it to operate, secure, and improve the service.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground">Service changes</h2>
                  <p className="mt-2">
                    We may modify, suspend, or discontinue features at any time, including newly
                    introduced functionality.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground">
                    Disclaimers and limitation of liability
                  </h2>
                  <p className="mt-2">
                    The service is provided as-is, without warranties to the extent permitted by
                    law. To the maximum extent permitted by law, we are not liable for indirect or
                    consequential damages.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground">Updates to these terms</h2>
                  <p className="mt-2">
                    We may revise these terms by publishing an updated version on this page.
                    Continued use means acceptance of the revised terms.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground">Contact</h2>
                  <p className="mt-2">
                    Questions? Visit our{" "}
                    <Link href="/contact" className="underline underline-offset-4">
                      contact page
                    </Link>
                    .
                  </p>
                </section>
              </div>

              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-2xl px-7 py-3.5 text-lg font-semibold bg-[#7F8CFF] hover:bg-[#6d7af5] active:bg-[#5e69d9] text-white shadow-lg shadow-[#7F8CFF]/25"
                >
                  Back home
                </Link>
                <Link
                  href="/privacy"
                  className="inline-flex items-center justify-center rounded-2xl px-7 py-3.5 text-lg font-semibold border border-[#d9ceff] text-[#433b66] hover:text-[#2f2850] hover:border-[#c6b8ff] bg-white"
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
