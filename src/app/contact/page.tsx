"use client";

import { Mail } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";
import CompanyPageShell from "@/components/company/CompanyPageShell";
import ThankYouModal from "@/components/ThankYouModal";
import { useRecaptcha } from "@/hooks/useRecaptcha";

const contactHighlights = [
  { value: "Support", label: "Product questions" },
  { value: "Partnerships", label: "Teams and organizers" },
  { value: "Feedback", label: "Ideas and issues" },
] as const;

const contactInputClass =
  "mt-2 w-full rounded-lg border border-[#d9ded3] bg-[#fbfcf8] px-4 py-3 text-[#203137] outline-none transition placeholder:font-normal placeholder:text-[#8b968f] placeholder:opacity-100 focus:border-[#2f6f64] focus:ring-4 focus:ring-[#2f6f64]/12";
const contactTextareaClass =
  "mt-2 w-full resize-y rounded-lg border border-[#d9ded3] bg-[#fbfcf8] px-4 py-3 text-[#203137] outline-none transition placeholder:font-normal placeholder:text-[#8b968f] placeholder:opacity-100 focus:border-[#2f6f64] focus:ring-4 focus:ring-[#2f6f64]/12";

type ContactApiResponse = {
  ok?: boolean;
  error?: string;
};

export default function ContactPage() {
  const { data: session } = useSession();
  const { executeRecaptcha, recaptchaConfigured, recaptchaReady } = useRecaptcha();
  const userName = typeof session?.user?.name === "string" ? session.user.name : "";
  const userEmail = typeof session?.user?.email === "string" ? session.user.email : "";
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState<null | { ok: boolean; message: string }>(null);
  const [showThankYou, setShowThankYou] = useState(false);

  return (
    <CompanyPageShell
      eyebrow="Contact"
      title="Reach the Envitefy team."
      description="Questions, feedback, partnerships, and product support all start here. Send a clear note and we will route it to the right place."
      primaryLabel="Back home"
      primaryHref="/"
      secondaryLabel="Read FAQ"
      secondaryHref="/faq"
      highlights={contactHighlights}
    >
      <section className="px-4 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-lg border border-[#d9ded3] bg-white p-5 shadow-[0_24px_64px_rgba(32,49,55,0.1)] sm:p-6">
            <div className="flex items-start gap-4 border-b border-[#d9ded3] pb-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#203137] text-white">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-[#202124]">Send a message</h2>
                <p className="mt-2 text-sm leading-6 text-[#52605c]">
                  We use your email only to reply to this request.
                </p>
              </div>
            </div>

            <form
              className="relative mt-6 grid gap-4"
              onSubmit={async (event) => {
                event.preventDefault();
                if (submitting) return;
                setSent(null);
                setSubmitting(true);

                const form = event.currentTarget;
                const formData = new FormData(form);
                const name = String(formData.get("name") || "").trim();
                const email = String(formData.get("email") || "").trim();
                const title = String(formData.get("title") || "").trim();
                const message = String(formData.get("message") || "").trim();
                const website = String(formData.get("website") || "").trim();

                try {
                  const recaptchaToken = await executeRecaptcha("contact");
                  const response = await fetch("/api/contact", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, email, title, message, recaptchaToken, website }),
                  });
                  const data = (await response.json().catch(() => ({}))) as ContactApiResponse;

                  if (response.ok && data.ok) {
                    form.reset();
                    setShowThankYou(true);
                    setSent(null);
                  } else {
                    setSent({
                      ok: false,
                      message: data.error || "Something went wrong.",
                    });
                  }
                } catch (error: unknown) {
                  setSent({
                    ok: false,
                    message: error instanceof Error ? error.message : "Network error.",
                  });
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -left-[9999px] h-px w-px overflow-hidden opacity-0"
              >
                <label htmlFor="contact-website">Website</label>
                <input
                  id="contact-website"
                  name="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="text-sm font-semibold text-[#303735]">
                    Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    autoComplete="name"
                    defaultValue={userName}
                    className={contactInputClass}
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="text-sm font-semibold text-[#303735]">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    defaultValue={userEmail}
                    className={contactInputClass}
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="title" className="text-sm font-semibold text-[#303735]">
                  Subject
                </label>
                <input
                  id="title"
                  name="title"
                  required
                  className={contactInputClass}
                  placeholder="What can we help with?"
                />
              </div>

              <div>
                <label htmlFor="message" className="text-sm font-semibold text-[#303735]">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  required
                  className={contactTextareaClass}
                  placeholder="Share the event type, link, route, or workflow if relevant."
                />
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                {sent && !sent.ok ? (
                  <p className="text-sm text-rose-600">{sent.message}</p>
                ) : (
                  <span />
                )}
                <button
                  type="submit"
                  disabled={submitting || (recaptchaConfigured && !recaptchaReady)}
                  className="cta-shell h-12 rounded-full bg-[#203137] px-7 text-sm font-semibold text-white shadow-[0_18px_42px_rgba(32,49,55,0.18)] transition hover:-translate-y-0.5 hover:bg-[#2b4148] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {submitting
                    ? "Sending..."
                    : recaptchaConfigured && !recaptchaReady
                      ? "Loading..."
                      : "Send message"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <ThankYouModal open={showThankYou} onClose={() => setShowThankYou(false)} />
    </CompanyPageShell>
  );
}
