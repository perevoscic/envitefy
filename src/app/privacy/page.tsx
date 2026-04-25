"use client";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-[#f6f2ff] via-white to-[#f7f3ff] text-foreground flex items-center justify-center p-6">
      <section className="w-full max-w-5xl grid grid-cols-1 items-center">
        <div className="text-center">
          <h1 className="sr-only">Envitefy — Create. Share. Enjoy.</h1>
          <div className="bg-gradient-to-tr from-[#efe8ff] via-white to-[#f4edff] rounded-3xl p-1">
            <div className="rounded-3xl bg-white/95 backdrop-blur-sm p-10 pb-16 border border-[#e5dcff] shadow-[0_20px_60px_rgba(127,140,255,0.12)]">
              <h1 className="text-5xl sm:text-6xl font-extrabold leading-[1.18] tracking-tight pb-1 overflow-visible">
                <span className="bg-clip-text pb-10 text-transparent bg-gradient-to-r from-[#5a56d6] via-[#7F8CFF] to-[#9a84ff]">
                  Privacy Policy
                </span>
              </h1>
              <p className="mt-5 text-lg sm:text-xl text-foreground/80 max-w-3xl mx-auto">
                This policy summarizes what we collect, how we use it, and the choices available to
                you.
              </p>

              <div className="mt-8 text-left max-w-3xl mx-auto space-y-6 text-foreground/80">
                <section>
                  <h2 className="text-xl font-semibold text-foreground">Information we collect</h2>
                  <ul className="mt-2 list-disc pl-6 space-y-1">
                    <li>Account and profile details you provide.</li>
                    <li>
                      Event content, uploads, RSVP responses, and sign-up submissions processed
                      through the platform.
                    </li>
                    <li>Integration data required to connect third-party calendar services.</li>
                    <li>Operational and security-related usage data.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground">How we use information</h2>
                  <ul className="mt-2 list-disc pl-6 space-y-1">
                    <li>Provide and improve Envitefy services.</li>
                    <li>
                      Power event pages, RSVP flows, and sign-up workflows, including our newer
                      participation features.
                    </li>
                    <li>Support integrations, account management, and support.</li>
                    <li>Maintain security, integrity, and reliability.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground">Information sharing</h2>
                  <p className="mt-2">
                    We share information only as needed to provide the service, comply with legal
                    obligations, and work with trusted infrastructure providers. We do not sell
                    personal information.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground">Data management</h2>
                  <p className="mt-2">
                    You may request access, correction, or deletion of eligible account data. You
                    may also disconnect integrations at any time.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground">Policy updates</h2>
                  <p className="mt-2">
                    We may update this policy from time to time by publishing a revised version on
                    this page.
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
                  href="/terms"
                  className="inline-flex items-center justify-center rounded-2xl px-7 py-3.5 text-lg font-semibold border border-[#d9ceff] text-[#433b66] hover:text-[#2f2850] hover:border-[#c6b8ff] bg-white"
                >
                  Terms of use
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
