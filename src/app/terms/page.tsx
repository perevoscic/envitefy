import Link from "next/link";
import CompanyPageShell from "@/components/company/CompanyPageShell";

const termsHighlights = [
  { value: "Use", label: "Create and share event pages" },
  { value: "Review", label: "Confirm details before publishing" },
  { value: "Respect", label: "No abuse or infringement" },
] as const;

const termsSections = [
  {
    title: "Services",
    body: "Envitefy provides event creation, public event pages, RSVP and signup workflows, calendar-related coordination tools, and guest-facing event actions.",
  },
  {
    title: "Participation features",
    body: "Our platform includes participation workflows that allow hosts to collect RSVP and sign-up responses. You are responsible for reviewing information before publishing or sharing any event details.",
  },
  {
    title: "Eligibility and account responsibility",
    body: "You must be at least 13 years old to use the service. You are responsible for maintaining account security and for all activity under your account.",
  },
  {
    title: "Acceptable use",
    body: "Do not use Envitefy for illegal activity, harassment, infringement, unauthorized scraping, attempts to disrupt the service, or attempts to reverse engineer protected systems.",
  },
  {
    title: "Content and rights",
    body: "You retain ownership of your content and grant us a limited license to process it to operate, secure, and improve the service.",
  },
  {
    title: "Service changes",
    body: "We may modify, suspend, or discontinue features at any time, including newly introduced functionality.",
  },
  {
    title: "Disclaimers and limitation of liability",
    body: "The service is provided as-is, without warranties to the extent permitted by law. To the maximum extent permitted by law, we are not liable for indirect or consequential damages.",
  },
  {
    title: "Updates to these terms",
    body: "We may revise these terms by publishing an updated version on this page. Continued use means acceptance of the revised terms.",
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
            Questions? Visit our{" "}
            <Link
              href="/contact"
              className="font-semibold text-[#203137] underline underline-offset-4"
            >
              contact page
            </Link>
            .
          </div>
        </div>
      </section>
    </CompanyPageShell>
  );
}
