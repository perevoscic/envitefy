import Link from "next/link";
import CompanyPageShell from "@/components/company/CompanyPageShell";

const privacyHighlights = [
  { value: "No sale", label: "We do not sell personal info" },
  { value: "Control", label: "Access, correction, deletion" },
  { value: "Security", label: "Operational safeguards" },
] as const;

const privacySections = [
  {
    title: "Information we collect",
    body: [
      "Account and profile details you provide.",
      "Event content, uploads, RSVP responses, and sign-up submissions processed through the platform.",
      "Integration data required to connect third-party calendar services.",
      "Operational and security-related usage data.",
    ],
  },
  {
    title: "How we use information",
    body: [
      "Provide and improve Envitefy services.",
      "Power event pages, RSVP flows, smart signup workflows, guest actions, and organizer tools.",
      "Support integrations, account management, and customer support.",
      "Maintain security, integrity, reliability, and abuse prevention.",
    ],
  },
  {
    title: "Information sharing",
    body: [
      "We share information only as needed to provide the service, comply with legal obligations, and work with trusted infrastructure providers. We do not sell personal information.",
    ],
  },
  {
    title: "Data management",
    body: [
      "You may request access, correction, or deletion of eligible account data. You may also disconnect integrations at any time.",
    ],
  },
  {
    title: "Policy updates",
    body: [
      "We may update this policy from time to time by publishing a revised version on this page.",
    ],
  },
] as const;

export default function PrivacyPage() {
  return (
    <CompanyPageShell
      eyebrow="Privacy"
      title="Privacy for real event workflows."
      description="Envitefy handles account details, event content, uploads, RSVPs, signups, calendar integrations, and guest actions with a practical privacy model."
      primaryLabel="Back home"
      primaryHref="/"
      secondaryLabel="Terms of use"
      secondaryHref="/terms"
      highlights={privacyHighlights}
    >
      <section className="px-4 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10">
            <p className="text-xs font-bold uppercase text-[#2f6f64]">
              Policy summary
            </p>
            <h2
              className="mt-4 text-3xl font-semibold leading-tight text-[#202124] sm:text-5xl"
              style={{
                fontFamily: "var(--font-montserrat), var(--font-sans), sans-serif",
              }}
            >
              What we collect, why, and how to manage it.
            </h2>
          </div>

          <div className="grid gap-4">
            {privacySections.map((section) => (
              <article
                key={section.title}
                className="rounded-lg border border-[#d9ded3] bg-white p-6 shadow-[0_18px_48px_rgba(32,49,55,0.08)]"
              >
                <h3 className="text-xl font-semibold text-[#202124]">
                  {section.title}
                </h3>
                <div className="mt-4 space-y-3 text-base leading-7 text-[#52605c]">
                  {section.body.length > 1 ? (
                    <ul className="list-disc space-y-2 pl-5">
                      {section.body.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>{section.body[0]}</p>
                  )}
                </div>
              </article>
            ))}
          </div>

          <div className="mt-10 flex flex-col gap-3 rounded-lg border border-[#d9ded3] bg-[#edf9f5] p-5 text-sm leading-6 text-[#52605c] sm:flex-row sm:items-center sm:justify-between">
            <p>Questions about privacy or data requests can start with the contact page.</p>
            <Link
              href="/contact"
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-[#203137] px-5 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#2b4148]"
            >
              Contact Envitefy
            </Link>
          </div>
        </div>
      </section>
    </CompanyPageShell>
  );
}
