import Link from "next/link";
import CompanyPageShell from "@/components/company/CompanyPageShell";
import { legalConfig } from "@/lib/legal-config";
import { LEGAL_EFFECTIVE_DATE_LABEL } from "@/lib/legal-versions";

const privacyHighlights = [
  { value: "Choice", label: "Optional analytics stays off until selected" },
  { value: "Control", label: "Access, correction, deletion, opt-out" },
  { value: "Limited", label: "Human review only for defined purposes" },
] as const;

const privacySections = [
  {
    title: "1. Scope and who we are",
    body: [
      `This policy explains how ${legalConfig.legalEntityName} ("Envitefy," "we," "us") handles personal information through Envitefy websites, applications, public event pages, invitations, RSVP and signup workflows, and related services.`,
      "Event hosts and form organizers may independently decide why and how they use guest or respondent information. Contact the organizer first about their own use of information; this policy covers Envitefy’s processing.",
    ],
  },
  {
    title: "2. Information we collect",
    body: [
      "Account information: email address, name, password hash, profile image, authentication records, product preferences, and legal acceptance records.",
      "Content and event information: invitations, photos, PDFs, schedules, event details, prompts, generated content, registry or external links, messages, and other material you submit or publish.",
      "Guest and participation information: RSVP answers, signup-form responses, names, contact details, attendance choices, comments, and organizer-defined form fields.",
      "Connected-service information: OAuth identifiers and tokens and the calendar or other data needed to perform actions you request through Google, Microsoft, or another integration.",
      "Technical and usage information: IP-derived security data, device and browser information, logs, referral data, approximate location inferred from IP, page paths, feature interactions, cookie or local-storage identifiers, and diagnostics.",
      "Communications and transaction information: support messages, contact requests, marketing preferences, and records from payment, registry, or affiliate partners. Envitefy does not receive full payment-card numbers from third-party checkout providers.",
    ],
  },
  {
    title: "3. Why we use information",
    body: [
      "We use information to provide accounts and requested features; parse uploads; create and host event pages; deliver invitations, RSVPs, signups, maps, calendars, communications, and integrations; provide support; secure the service; prevent fraud and abuse; comply with law; and enforce our terms.",
      "We also use service, usage, and feedback information to understand performance, troubleshoot errors, test features, and improve future products. We may create aggregated or de-identified statistics that are not reasonably linked to an individual.",
      "Authorized personnel may review user content when you ask for support, when needed to investigate a security or abuse issue, to meet a legal obligation, or for limited quality review and product improvement. Access is restricted by role and purpose. Do not upload information you are not authorized to provide.",
    ],
  },
  {
    title: "4. AI and automated processing",
    body: [
      "Envitefy uses automated tools and third-party AI providers to extract event details, classify content, research publicly available event information, and generate or improve text and images. Inputs can include files, images, prompts, and relevant event context; outputs can be inaccurate.",
      "We use submitted content to operate, secure, evaluate, and improve Envitefy, including limited human review described above. We do not use private user content to train a general-purpose Envitefy foundation model. A service provider may handle data under its own service contract and data controls; avoid submitting sensitive information unless it is necessary for the feature.",
      "You must review generated or extracted information before publishing it, relying on it, or adding it to a calendar.",
    ],
  },
  {
    title: "5. When information is shared",
    body: [
      "With your direction: public event pages and share links may expose event details and content to anyone with access to the page. RSVP and signup responses are available to the relevant host or organizer. Connected services receive the instructions and data needed to perform the action you request.",
      "With service providers: hosting, database, storage, security, analytics (only after your choice), email, customer-support, OCR, maps, and AI providers process information for us under applicable contractual restrictions.",
      "For legal and safety reasons: we may disclose information to comply with law or valid process, protect rights and safety, investigate fraud or abuse, or complete a merger, financing, reorganization, or sale with appropriate protections.",
      "We do not sell personal information for money. Some privacy laws define certain advertising, analytics, or affiliate disclosures more broadly as a ‘sale,’ ‘sharing,’ or targeted advertising. Optional analytics does not load until you choose it, and you can change that choice at any time through Privacy choices.",
    ],
  },
  {
    title: "6. Google and Microsoft data",
    body: [
      "When you connect Google or Microsoft, Envitefy requests only the permissions displayed on that provider’s consent screen and uses the resulting data to authenticate you or perform calendar actions you request. Disconnecting removes locally stored provider refresh tokens and requires reauthentication before future connected actions.",
      "Envitefy’s use and transfer of information received from Google APIs adheres to the Google API Services User Data Policy, including its Limited Use requirements.",
    ],
  },
  {
    title: "7. Cookies, local storage, and analytics choices",
    body: [
      "Necessary technologies support login, security, accessibility, preferences, consent records, and core product functions. They cannot be disabled through the analytics preference tool.",
      "Optional analytics and performance measurement load only after you select Allow analytics. Analytics events omit URL query strings to reduce accidental collection of invitation codes, search terms, or other data in links. Selecting Necessary only stops future optional analytics; browser or provider tools may be needed to remove information already stored by a third party.",
    ],
  },
  {
    title: "8. Sensitive information and health-related events",
    body: [
      "Event content can reveal sensitive information, including health appointments, religious events, precise locations, family information, or information about children. Envitefy is not a health-care provider and is not designed to receive protected health information on behalf of HIPAA-regulated entities unless we have signed an appropriate written agreement.",
      "Do not put sensitive details on a public page. Use available access controls, collect only what is necessary, and obtain required permission from every person whose information you submit.",
    ],
  },
  {
    title: "9. Retention and security",
    body: [
      "We retain account and event information while your account or content is active and for a limited period afterward as reasonably needed for service delivery, security, dispute resolution, legal compliance, backup cycles, and enforcement. Diagnostic scan copies are retained for a limited troubleshooting period and then scheduled for deletion. OAuth tokens are removed when an integration is disconnected or the account is deleted, subject to backup cycles and legal requirements.",
      "We use administrative, technical, and organizational safeguards designed for the nature of the information. Administrative access to retained scan diagnostics is limited to troubleshooting and logged. No online service can guarantee absolute security. You are responsible for choosing safe sharing settings and protecting your account credentials and event access codes.",
    ],
  },
  {
    title: "10. Your choices and privacy rights",
    body: [
      "Depending on where you live, you may have rights to know, access, correct, delete, or obtain a copy of personal information; restrict or object to processing; withdraw consent; opt out of certain sharing, targeted advertising, or profiling; and appeal a denied request. We will not discriminate against you for exercising applicable rights.",
      "You can update certain profile information, disconnect integrations, change analytics choices, and unsubscribe from marketing using product controls. For other requests, use the contact page or email the privacy contact below. We may verify your identity and may retain information when an exception applies. Authorized agents may submit requests where permitted by law.",
    ],
  },
  {
    title: "11. Children",
    body: [
      "Envitefy accounts are for people who are at least 18. The service is not directed to children, and a child may not create an account. Adults who create events involving children are responsible for having authority and consent to provide related information and for avoiding unnecessary or public disclosure. Contact us if you believe a child supplied personal information directly to Envitefy.",
    ],
  },
  {
    title: "12. International transfers and changes",
    body: [
      "Envitefy and its providers may process information in the United States and other countries whose laws may differ from yours. Where required, we use recognized transfer safeguards.",
      "We may update this policy as the service or law changes. We will post the revised version and effective date and provide additional notice when required. Material changes apply prospectively unless law permits otherwise.",
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
            <p className="mt-4 text-sm text-[#52605c]">
              Effective {LEGAL_EFFECTIVE_DATE_LABEL}
            </p>
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
            <p>
              Privacy requests can be submitted through the contact page
              {legalConfig.privacyContactEmail ? ` or by email to ${legalConfig.privacyContactEmail}` : ""}.
              {legalConfig.legalPostalAddress ? ` Mail: ${legalConfig.legalPostalAddress}.` : ""}
            </p>
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
