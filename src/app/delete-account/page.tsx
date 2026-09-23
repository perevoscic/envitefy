import type { Metadata } from "next";
import Link from "next/link";
import AccountDeletionRequestForm from "@/components/account/AccountDeletionRequestForm";
import CompanyTopNav from "@/components/company/CompanyTopNav";
import { legalConfig } from "@/lib/legal-config";

export const metadata: Metadata = {
  title: "Delete your account | Envitefy",
  description: "Request deletion of your Envitefy account and associated data. Learn how to submit a request, verify ownership, and understand data retention.",
  alternates: { canonical: "/delete-account" },
};

export default function DeleteAccountPage() {
  const supportEmail = legalConfig.privacyContactEmail || "no-reply@envitefy.com";
  return (
    <>
      <CompanyTopNav />
      <main className="min-h-screen bg-[#f7f8f3] px-4 pb-16 pt-[calc(7rem+env(safe-area-inset-top))] text-slate-900 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-semibold text-[#2f6f64]">Envitefy account &amp; data</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Delete your Envitefy account</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">Request deletion of your account and associated personal data here, even if you no longer have the app or cannot sign in.</p>
          <div className="mt-8 grid items-start gap-6 lg:grid-cols-2">
            <section aria-labelledby="request-heading" className="rounded-2xl border border-[#d9ded3] bg-white p-5 shadow-sm sm:p-7">
              <h2 id="request-heading" className="text-xl font-bold">Request account deletion</h2>
              <ol className="mb-6 mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-600">
                <li>Enter your Envitefy sign-in email and submit the request below.</li>
                <li>Reply to Envitefy support to verify that you own the account.</li>
                <li>Support will confirm the deletion outcome and explain any information that must be retained.</li>
              </ol>
              <AccountDeletionRequestForm />
              <p className="mt-4 text-sm leading-6 text-slate-600">
                Cannot access your account email or use this form?{" "}
                <Link href="/contact" className="font-semibold text-[#5c438e] underline underline-offset-4">Contact Envitefy support</Link>
                {" "}or email <a className="break-all font-semibold text-[#5c438e] underline underline-offset-4" href={`mailto:${supportEmail}?subject=Envitefy%20account%20deletion%20request`}>{supportEmail}</a>.
                Ask for account deletion and include your account email. Never send your password.
              </p>
            </section>
            <div id="data" className="scroll-mt-28 space-y-6">
              <section className="rounded-2xl border border-[#d9ded3] bg-white p-5 sm:p-7">
                <h2 className="text-xl font-bold">Data covered by your request</h2>
                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
                  <li>Your account details, profile photo, sign-in records and preferences.</li>
                  <li>Your saved events, drafts, invitations, sign-up forms, uploaded files and generated content.</li>
                  <li>Personal data associated with your account in messages, RSVPs and sign-up responses.</li>
                  <li>Stored Google and Microsoft calendar connection tokens and associated sync records.</li>
                </ul>
                <p className="mt-4 text-sm leading-6 text-slate-600">Deletion is permanent once completed. Download anything you want to keep before your request is processed. Removing the app from your device does not delete your account.</p>
              </section>
              <section className="rounded-2xl border border-[#d9ded3] bg-white p-5 sm:p-7">
                <h2 className="text-xl font-bold">Timing and retained data</h2>
                <p className="mt-4 text-sm leading-6 text-slate-600">Support verifies ownership before processing deletion and will explain the expected completion time in its reply. Some information may be retained for security, fraud prevention, dispute resolution or legal obligations. Backup copies may remain until the applicable backup cycle ends.</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">Any applicable retention period and the reason for keeping information will be explained when your request is handled. See the <Link href="/privacy" className="font-semibold text-[#5c438e] underline underline-offset-4">Envitefy privacy policy</Link> for our current retention practices.</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">Copies others have downloaded or added to their own calendars are outside your Envitefy account. Event organizers may separately retain information they collected; contact the organizer about those copies.</p>
              </section>
              <p className="text-sm leading-6 text-slate-600">You can also start this request in <Link href="/settings#profile" className="font-semibold text-[#5c438e] underline underline-offset-4">Settings → Profile → Delete account</Link>.</p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
