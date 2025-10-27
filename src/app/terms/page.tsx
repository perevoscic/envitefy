"use client";
import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen w-full bg-background text-foreground landing-dark-gradient flex items-center justify-center p-6">
      <section className="w-full max-w-5xl grid grid-cols-1 items-center">
        <div className="text-center">
          <h1 className="sr-only">Envitefy — Create. Share. Enjoy.</h1>
          <div className="bg-gradient-to-tr from-fuchsia-500/15 via-sky-400/15 to-violet-500/15 rounded-3xl p-1">
            <div className="rounded-3xl bg-surface/80 backdrop-blur-sm p-10 pb-16 border border-border">
              <h1 className="text-5xl sm:text-6xl font-extrabold leading-[1.18] tracking-tight pb-1 overflow-visible">
                <span className="bg-clip-text pb-10 text-transparent bg-gradient-to-r from-cyan-600 via-sky-500 to-fuchsia-600 dark:from-cyan-300 dark:via-sky-200 dark:to-fuchsia-300">
                  Terms of Use
                </span>
              </h1>
              <p className="mt-5 text-lg sm:text-xl text-foreground/80 max-w-3xl mx-auto">
                By using Envitefy, you agree to these terms. Please read them
                carefully.
              </p>

              <div className="mt-8 text-left max-w-3xl mx-auto space-y-6 text-foreground/80">
                <section>
                  <h2 className="text-xl font-semibold text-foreground">
                    What we do
                  </h2>
                  <p className="mt-2">
                    Envitefy helps you extract event details from
                    images/photos/pdfs and create calendar events (including
                    `.ics` files) and optionally save them to your favorite
                    calendar service via integrations.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground">
                    Eligibility
                  </h2>
                  <p className="mt-2">
                    You must be at least 13 years old to use the service. If you
                    are under the age of majority where you live, use the
                    service only with a parent/guardian&apos;s consent.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground">
                    Your account
                  </h2>
                  <p className="mt-2">
                    Keep your account credentials secure and accurate.
                    You&apos;re responsible for all activity under your account.
                    Let us know if you suspect unauthorized use.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground">
                    Subscriptions &amp; billing
                  </h2>
                  <p className="mt-2">
                    Paid plans are processed by Stripe. Prices and features are
                    shown in the app. You can manage or cancel your subscription
                    in the billing portal. Some changes may take effect at the
                    next billing period. Taxes may apply. Refunds, when
                    applicable, are handled per our policies and Stripe&apos;s
                    processes.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground">
                    Calendar integrations
                  </h2>
                  <p className="mt-2">
                    If you connect with your favorite calendar service, you
                    authorize us to create events on your behalf using their
                    APIs. You can disconnect at any time in settings or with the
                    providers directly. We are not affiliated with Google,
                    Microsoft, Apple, or Stripe.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground">
                    Your content
                  </h2>
                  <p className="mt-2">
                    You own the images and information you upload. You grant us
                    a limited license to process that content to operate,
                    improve, and secure the service. You promise you have the
                    rights to upload the content and that it does not violate
                    law or others&apos; rights. Do not upload sensitive personal
                    information unless necessary for an event you choose to
                    store.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground">
                    Acceptable use
                  </h2>
                  <ul className="mt-2 list-disc pl-6 space-y-1">
                    <li>No illegal activity, harassment, or infringement.</li>
                    <li>
                      No attempts to disrupt, reverse engineer, or overload the
                      service.
                    </li>
                    <li>No automated scraping outside documented APIs.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground">
                    Intellectual property
                  </h2>
                  <p className="mt-2">
                    The Envitefy app, logos, and code are our intellectual
                    property or our licensors&apos;. Using the service
                    doesn&apos;t give you ownership of our IP.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground">
                    Service changes &amp; termination
                  </h2>
                  <p className="mt-2">
                    We may change or discontinue features, or suspend/terminate
                    access for violations or risk to the service. You can stop
                    using the service at any time.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground">
                    Disclaimers
                  </h2>
                  <p className="mt-2">
                    The service is provided &quot;as is&quot; without warranties
                    of any kind. Event recognition and extraction may be
                    inaccurate; always review event details before saving or
                    sharing.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground">
                    Limitation of liability
                  </h2>
                  <p className="mt-2">
                    To the maximum extent permitted by law, we are not liable
                    for indirect, incidental, special, consequential, or
                    punitive damages, or any loss of data, opportunities, or
                    profits. Our total liability for any claim is limited to the
                    amount you paid for the service in the 3 months before the
                    event giving rise to the claim.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground">
                    Changes to these terms
                  </h2>
                  <p className="mt-2">
                    We may update these terms by posting a new version here. If
                    changes are material, we&apos;ll take reasonable steps to
                    notify you. Continued use after updates means you accept the
                    new terms.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground">
                    Contact
                  </h2>
                  <p className="mt-2">
                    Questions? Visit our{" "}
                    <Link
                      href="/contact"
                      className="underline underline-offset-4"
                    >
                      contact page
                    </Link>
                    .
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
