"use client";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen w-full bg-background text-foreground landing-dark-gradient flex items-center justify-center p-6">
      <section className="w-full max-w-5xl grid grid-cols-1 items-center">
        <div className="text-center">
          <h1 className="sr-only">Snap My Date</h1>
          <div className="bg-gradient-to-tr from-fuchsia-500/15 via-sky-400/15 to-violet-500/15 rounded-3xl p-1">
            <div className="rounded-3xl bg-surface/80 backdrop-blur-sm p-10 pb-16 border border-border">
              <h1 className="text-5xl sm:text-6xl font-extrabold leading-[1.18] tracking-tight pb-1 overflow-visible">
                <span className="bg-clip-text pb-10 text-transparent bg-gradient-to-r from-cyan-600 via-sky-500 to-fuchsia-600 dark:from-cyan-300 dark:via-sky-200 dark:to-fuchsia-300">
                  Privacy Policy
                </span>
              </h1>
              <p className="mt-5 text-lg sm:text-xl text-foreground/80 max-w-3xl mx-auto">
                This page explains the information we collect, how we use and
                share it, and the choices you have.
              </p>

              <div className="mt-8 text-left max-w-3xl mx-auto space-y-6 text-foreground/80">
                <section>
                  <h2 className="text-xl font-semibold text-foreground">
                    Information we collect
                  </h2>
                  <ul className="mt-2 list-disc pl-6 space-y-1">
                    <li>
                      Account info: email and optional name details to create
                      and manage your account.
                    </li>
                    <li>
                      Content you upload: images/PDFs for OCR, extracted text,
                      and events/history you save in the app.
                    </li>
                    <li>
                      Connected accounts: if you link Google or Microsoft, we
                      store the tokens needed to create calendar events on your
                      behalf.
                    </li>
                    <li>
                      Payments: subscriptions are handled by Stripe; we
                      don&apos;t store full card numbers.
                    </li>
                    <li>
                      Usage data: basic logs and device info to keep the service
                      secure and reliable.
                    </li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground">
                    How we use information
                  </h2>
                  <ul className="mt-2 list-disc pl-6 space-y-1">
                    <li>
                      Provide OCR and event extraction and generate `.ics`
                      files.
                    </li>
                    <li>
                      Create calendar events in Google/Outlook when you ask us
                      to.
                    </li>
                    <li>
                      Operate, secure, troubleshoot, and improve the product.
                    </li>
                    <li>Process payments and manage subscriptions.</li>
                    <li>
                      Communicate about your account, features, and support.
                    </li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground">
                    OCR &amp; optional AI
                  </h2>
                  <p className="mt-2">
                    We use Google Cloud Vision to extract text from images. If
                    you opt in (for example by enabling an LLM option), we may
                    send the image/text to an LLM provider to improve parsing.
                    We only use providers you choose or enable, and solely to
                    provide the requested feature.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground">
                    When we share information
                  </h2>
                  <ul className="mt-2 list-disc pl-6 space-y-1">
                    <li>
                      Calendar providers: Google/Microsoft when you connect and
                      ask us to create events.
                    </li>
                    <li>
                      Payments: Stripe for checkout, billing, and receipts.
                    </li>
                    <li>
                      Email: our email provider for password resets and gift
                      emails.
                    </li>
                    <li>
                      Service providers: hosting and infrastructure to run the
                      app.
                    </li>
                    <li>
                      Legal/safety: if required by law or to protect users and
                      the service.
                    </li>
                  </ul>
                  <p className="mt-2">
                    We don&apos;t sell your personal information.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground">
                    Cookies
                  </h2>
                  <p className="mt-2">
                    We use necessary cookies to keep you signed in and operate
                    the site. You can clear cookies in your browser; doing so
                    may sign you out.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground">
                    Data retention &amp; deletion
                  </h2>
                  <p className="mt-2">
                    We keep data for as long as needed to provide the service
                    and comply with legal obligations. You can request deletion
                    of your account data and disconnect Google/Microsoft at any
                    time. Events created in your calendars via providers remain
                    in your calendars unless you remove them there.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground">
                    Security
                  </h2>
                  <p className="mt-2">
                    We use industry-standard measures to protect data in transit
                    and at rest where applicable, limit access to authorized
                    personnel, and rely on vetted providers for sensitive
                    operations like payments and email.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground">
                    Children&apos;s privacy
                  </h2>
                  <p className="mt-2">
                    The service isn&apos;t intended for children under 13, and
                    we don&apos;t knowingly collect their personal information.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground">
                    International transfers
                  </h2>
                  <p className="mt-2">
                    We may process and store information in the United States
                    and other countries where we or our providers operate, which
                    may have different data-protection laws than your country.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground">
                    Your choices &amp; rights
                  </h2>
                  <ul className="mt-2 list-disc pl-6 space-y-1">
                    <li>
                      Access, correct, or delete your data where applicable.
                    </li>
                    <li>
                      Disconnect Google/Microsoft and revoke provider access.
                    </li>
                    <li>Manage emails via in-message links or settings.</li>
                    <li>Contact us to make a request or ask a question.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground">
                    Changes to this policy
                  </h2>
                  <p className="mt-2">
                    We may update this policy by posting a new version here. If
                    changes are material, we&apos;ll take reasonable steps to
                    notify you.
                  </p>
                  <p className="mt-2 text-sm text-foreground/60">
                    Last updated: 2025-09-23
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
                  href="/terms"
                  className="inline-flex items-center justify-center rounded-2xl px-7 py-3.5 text-lg font-semibold border border-border text-foreground/80 hover:text-foreground hover:border-foreground/60"
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
