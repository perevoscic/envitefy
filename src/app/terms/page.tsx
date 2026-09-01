import Link from "next/link";
import CompanyPageShell from "@/components/company/CompanyPageShell";
import { legalConfig } from "@/lib/legal-config";
import { LEGAL_EFFECTIVE_DATE_LABEL } from "@/lib/legal-versions";

const termsHighlights = [
  { value: "Use", label: "Create and share event pages" },
  { value: "Review", label: "Confirm details before publishing" },
  { value: "Respect", label: "No abuse or infringement" },
] as const;

const termsSections = [
  {
    title: "1. Agreement and provider",
    body: `These Terms are a binding agreement between you and ${legalConfig.legalEntityName} ("Envitefy," "we," or "us"). They govern your access to Envitefy websites, applications, public event pages, invitations, RSVP and signup workflows, AI-assisted features, integrations, and related services. By creating an account or using the service, you agree to these Terms and acknowledge the Privacy Policy.`,
  },
  {
    title: "2. Eligibility and accounts",
    body: "You must be at least 18 and legally able to enter this agreement. Provide accurate account information, protect your credentials and access codes, and promptly notify us of suspected unauthorized use. You are responsible for activity under your account except to the extent caused by Envitefy’s breach of duty.",
  },
  {
    title: "3. The service and your review obligation",
    body: "Envitefy helps create, extract, generate, host, and share event information. OCR, AI, calendar, map, discovery, and generated-content features can be incomplete, outdated, or wrong. You must review dates, times, locations, permissions, guest lists, safety information, and generated or extracted content before publishing, inviting others, purchasing anything, traveling, or relying on it. Envitefy is not the event organizer unless expressly stated.",
  },
  {
    title: "4. Hosts, guests, RSVPs, and signups",
    body: "Hosts and form organizers decide what they publish and collect and are responsible for providing required notices, obtaining consent, protecting responses, honoring guest choices, and complying with event, privacy, accessibility, marketing, contest, charity, health, and child-protection laws. Guests must provide accurate responses and respect organizer rules. A public or shared page may be copied or forwarded by others, so do not publish information that should remain confidential.",
  },
  {
    title: "5. Your content and permissions",
    body: "You retain your ownership rights in content you submit. You grant Envitefy a worldwide, non-exclusive, royalty-free license to host, copy, process, adapt, transmit, display, and create technical derivatives of that content only as reasonably needed to operate, secure, support, evaluate, and improve the service and to comply with law. The license lasts while the content is stored, plus reasonable backup and legal-retention periods. You represent that you have all rights and consents needed for the content, people, music, images, trademarks, locations, and personal information you submit.",
  },
  {
    title: "6. Acceptable use",
    body: "Do not use the service to violate law or another person’s rights; harass, threaten, deceive, impersonate, discriminate, exploit children, or expose sensitive information without authority; distribute malware or spam; scrape or harvest data without permission; evade access controls or rate limits; probe security; interfere with the service; reverse engineer protected portions except where law expressly permits; create unlawful contests or fundraising; or use outputs to make high-impact decisions about a person. We may remove content, limit sharing, or suspend access when reasonably necessary to address risk or violations.",
  },
  {
    title: "7. AI features and product improvement",
    body: "AI outputs are generated automatically and may resemble existing material or be non-unique. You are responsible for checking accuracy, suitability, and rights before use. Envitefy may use service data, content, feedback, and limited authorized human review to troubleshoot, secure, evaluate, and improve current and future Envitefy products as described in the Privacy Policy. We do not claim ownership of your original content, and we do not use private content to train a general-purpose Envitefy foundation model.",
  },
  {
    title: "8. Integrations, external links, registries, and purchases",
    body: "Third-party services and links, including Google, Microsoft, maps, registries, ticketing, affiliate, and payment sites, are governed by their own terms and privacy practices. You authorize Envitefy to send instructions and data to a connected service when you request an action. We are not responsible for third-party availability, prices, products, transactions, refunds, or conduct. We may receive an affiliate commission when disclosed, without increasing your price solely because of that commission.",
  },
  {
    title: "9. Intellectual property and reports",
    body: "Envitefy and its licensors own the service, software, designs, trademarks, and other materials excluding your content. These Terms do not grant you ownership of them. If you believe content infringes your rights, send a detailed notice through the contact page or to the designated legal contact below, including identification of the work, the allegedly infringing material and location, your contact details, a good-faith statement, an accuracy and authority statement, and your signature. Knowingly false notices may create liability.",
  },
  {
    title: "10. Fees and changes",
    body: "If paid features are offered, displayed prices, billing cadence, renewal terms, and cancellation conditions shown at purchase become part of these Terms. Taxes may apply. We may change or discontinue features and may introduce limits, but will provide notice required by law for material changes affecting an active paid commitment.",
  },
  {
    title: "11. Suspension and termination",
    body: "You may stop using Envitefy at any time and may request eligible account deletion. We may suspend or terminate access for a material breach, legal or security risk, nonpayment, abuse, or discontinuation of the service. When practical, we will provide notice and an opportunity to cure. Sections that by their nature should survive—including ownership, disclaimers, liability limits, indemnity, and dispute provisions—survive termination.",
  },
  {
    title: "12. Disclaimers",
    body: "TO THE MAXIMUM EXTENT PERMITTED BY LAW, ENVITEFY IS PROVIDED “AS IS” AND “AS AVAILABLE.” WE DISCLAIM IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE, CONTENT, AI OUTPUTS, EVENT DETAILS, INTEGRATIONS, OR THIRD-PARTY SERVICES WILL BE ACCURATE, SAFE, UNINTERRUPTED, OR ERROR-FREE. Nothing in these Terms excludes warranties or rights that cannot legally be excluded.",
  },
  {
    title: "13. Limitation of liability",
    body: "TO THE MAXIMUM EXTENT PERMITTED BY LAW, ENVITEFY AND ITS AFFILIATES WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, PUNITIVE, OR CONSEQUENTIAL DAMAGES, OR LOST PROFITS, REVENUE, DATA, GOODWILL, OR OPPORTUNITIES. OUR TOTAL LIABILITY ARISING FROM THE SERVICE WILL NOT EXCEED THE GREATER OF US$100 OR THE AMOUNT YOU PAID ENVITEFY FOR THE SERVICE DURING THE 12 MONTHS BEFORE THE EVENT GIVING RISE TO THE CLAIM. These limits do not apply where prohibited, including liability that cannot be limited for fraud, willful misconduct, or certain personal injury or consumer rights.",
  },
  {
    title: "14. Indemnity",
    body: "To the extent permitted by law, you will defend and indemnify Envitefy from third-party claims, damages, and reasonable costs arising from your content, event or form operation, unlawful use, or material breach of these Terms. This does not require you to indemnify Envitefy for its own negligence, unlawful conduct, or breach. We will provide reasonable notice and allow you to control the defense, subject to our right to participate.",
  },
  {
    title: "15. Disputes and applicable law",
    body: "Before filing a claim, contact us and give both sides 30 days to try to resolve it informally, unless urgent relief is needed or law provides otherwise. The governing law and courts are those that apply to the contracting entity and transaction under applicable conflict-of-law and consumer-protection rules. We do not impose mandatory arbitration or waive class-action rights in this version. Mandatory local consumer protections remain unaffected.",
  },
  {
    title: "16. Changes and general terms",
    body: "We may update these Terms prospectively. We will post the new effective date and provide additional notice or request renewed acceptance when required for a material change. If a provision is unenforceable, it will be limited to the minimum extent necessary and the rest remains effective. Our failure to enforce a provision is not a waiver. You may not transfer your agreement without our consent; we may transfer it as part of a reorganization or sale with appropriate notice. These Terms and incorporated policies are the entire agreement about the service.",
  },
] as const;

export default function TermsPage() {
  return (
    <CompanyPageShell
      eyebrow="Terms"
      title="Terms for creating and sharing with Envitefy."
      description="These terms cover event creation, hosted pages, RSVP and signup workflows, uploads, guest actions, integrations, and account responsibility."
      primaryLabel="Back home"
      primaryHref="/"
      secondaryLabel="Privacy policy"
      secondaryHref="/privacy"
      highlights={termsHighlights}
    >
      <section className="px-4 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10">
            <p className="text-xs font-bold uppercase text-[#2f6f64]">
              Terms summary
            </p>
            <h2
              className="mt-4 text-3xl font-semibold leading-tight text-[#202124] sm:text-5xl"
              style={{
                fontFamily: "var(--font-montserrat), var(--font-sans), sans-serif",
              }}
            >
              Use the product responsibly and review what you publish.
            </h2>
            <p className="mt-4 text-sm text-[#52605c]">
              Effective {LEGAL_EFFECTIVE_DATE_LABEL}
            </p>
          </div>

          <div className="grid gap-4">
            {termsSections.map((section) => (
              <article
                key={section.title}
                className="rounded-lg border border-[#d9ded3] bg-white p-6 shadow-[0_18px_48px_rgba(32,49,55,0.08)]"
              >
                <h3 className="text-xl font-semibold text-[#202124]">
                  {section.title}
                </h3>
                <p className="mt-4 text-base leading-7 text-[#52605c]">{section.body}</p>
              </article>
            ))}
          </div>

          <div className="mt-10 rounded-lg border border-[#d9ded3] bg-[#edf9f5] p-5 text-sm leading-6 text-[#52605c]">
            Questions or legal notices can be submitted through our{" "}
            <Link
              href="/contact"
              className="font-semibold text-[#203137] underline underline-offset-4"
            >
              contact page
            </Link>
            {legalConfig.legalContactEmail ? ` or by email to ${legalConfig.legalContactEmail}` : ""}.
            {legalConfig.legalPostalAddress ? ` Mail: ${legalConfig.legalPostalAddress}.` : " The contracting entity and postal address must be configured before launch."}
          </div>
        </div>
      </section>
    </CompanyPageShell>
  );
}
