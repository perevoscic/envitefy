"use client";

import { Check, Copy, ExternalLink, Monitor, Smartphone, Sparkles, Wand2 } from "lucide-react";
import { useMemo, useState } from "react";
import {
  ADMIN_EMAIL_CAMPAIGN_DRAFT_KEY,
  type AdminEmailCampaignDraft,
} from "@/lib/admin/email-campaign-draft";
import { createEmailTemplate } from "@/lib/email-template";

type AudienceMode = "individual" | "broadcast";
type PreviewMode = "desktop" | "mobile";

type GeneratedImageAsset = {
  role: "demo" | "scenario" | "hero" | "feature" | "support";
  url: string;
  altText: string;
  prompt: string;
  model: string;
  scenarioId?: "snap" | "concierge" | "teachers" | "share";
};

type GeneratedDraft = {
  subject: string;
  preheader: string;
  bodyHtml: string;
  buttonText: string;
  buttonUrl: string;
  notes: string;
  imageAssets?: GeneratedImageAsset[];
};

type GenerateEmailResponse =
  | {
      ok: true;
      model: string;
      draft: GeneratedDraft;
    }
  | {
      ok: false;
      error?: {
        message?: string;
      };
    };

function personalize(html: string): string {
  return html
    .replace(/\{\{greeting\}\}/g, "Hi Preview")
    .replace(/\{\{firstName\}\}/g, "Preview")
    .replace(/\{\{lastName\}\}/g, "Recipient");
}

/** Private blob proxy URLs are rewritten to envitefy.com; remap to current origin for local preview. */
function rewriteBlobUrlsForPreview(html: string): string {
  if (typeof window === "undefined") return html;
  const origin = window.location.origin.replace(/\/$/, "");
  return html
    .replace(
      /https?:\/\/(?:www\.)?envitefy\.com(\/api\/blob\/[^"'\s>]+)/gi,
      `${origin}$1`,
    )
    .replace(/(src=")(\/api\/blob\/[^"]+)/gi, `$1${origin}$2`);
}

function bodyHasPurpleCta(html: string): boolean {
  return /background-color\s*:\s*#7F67D3/i.test(html);
}

function buildPreviewHtml(draft: GeneratedDraft | null): string {
  if (!draft) return "";
  const body = rewriteBlobUrlsForPreview(personalize(draft.bodyHtml));
  const suppressWrapperButton = bodyHasPurpleCta(body) || !draft.buttonText || !draft.buttonUrl;
  return createEmailTemplate({
    preheader: draft.preheader,
    title: draft.subject,
    body,
    buttonText: suppressWrapperButton ? undefined : draft.buttonText,
    buttonUrl: suppressWrapperButton ? undefined : draft.buttonUrl,
    footerText: "You're receiving this because you have an Envitefy account.",
  });
}

export default function AdminEmailPromptGenerator() {
  const [prompt, setPrompt] = useState("");
  const [audienceMode, setAudienceMode] = useState<AudienceMode>("individual");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop");
  const [draft, setDraft] = useState<GeneratedDraft | null>(null);
  const [model, setModel] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(
    null,
  );

  const previewHtml = useMemo(() => buildPreviewHtml(draft), [draft]);

  async function handleGenerate() {
    const trimmed = prompt.trim();
    setMessage(null);
    setCopied(false);

    if (!trimmed) {
      setMessage({ tone: "error", text: "Add a prompt first." });
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/admin/emails/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: trimmed,
          audienceMode,
          currentSubject: draft?.subject || undefined,
          // Intro-only revise copy: strip prior HTML so legacy GIF scenario markup is not reused.
          currentBodyHtml: draft
            ? draft.bodyHtml
                .replace(/<table\b[\s\S]*$/i, "")
                .replace(/<img\b[^>]*>/gi, "")
                .trim() || undefined
            : undefined,
          // Never reuse GIFs or incomplete legacy image sets.
          currentImageAssets: (draft?.imageAssets || []).filter(
            (asset) =>
              asset.role === "scenario" &&
              Boolean(asset.scenarioId) &&
              !/\.gif(?:$|[?#])/i.test(asset.url),
          ),
        }),
      });
      const data = (await res.json()) as GenerateEmailResponse;
      if (!res.ok) {
        throw new Error(
          data.ok ? "Failed to generate email." : data.error?.message || "Failed to generate email.",
        );
      }
      if (!data.ok) {
        throw new Error(data.error?.message || "Failed to generate email.");
      }

      setDraft(data.draft);
      setModel(data.model);
      setMessage({
        tone: "success",
        text: draft ? "Updated draft ready." : "Generated draft ready.",
      });
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "Failed to generate email.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleCopyHtml() {
    if (!previewHtml) return;
    try {
      await navigator.clipboard.writeText(previewHtml);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  function handleUseInCampaign() {
    if (!draft) return;
    const handoff: AdminEmailCampaignDraft = {
      subject: draft.subject,
      bodyHtml: draft.bodyHtml,
      preheader: draft.preheader || undefined,
      buttonText: draft.buttonText || undefined,
      buttonUrl: draft.buttonUrl || undefined,
      audienceMode,
    };

    try {
      sessionStorage.setItem(ADMIN_EMAIL_CAMPAIGN_DRAFT_KEY, JSON.stringify(handoff));
    } catch {}

    window.location.assign("/admin/emails?tab=campaigns&compose=1");
  }

  const promptStarters = [
    {
      label: "Back to school",
      prompt:
        "Write a back-to-school email for parents and teachers. Cover snapping birthday flyers, asking Concierge about an upcoming birthday, class parties, and sharing one event link. Include clear CTAs.",
    },
    {
      label: "Birthday parties",
      prompt:
        "Promote Envitefy for birthday parties: snap a flyer into a live card, use Concierge if details are still fuzzy, then share RSVP with families.",
    },
    {
      label: "Teachers + share",
      prompt:
        "Email for teachers and room parents: turn class party flyers into live pages, collect helpers with smart sign-ups, and share one link with every family.",
    },
  ];

  return (
    <section className="overflow-hidden rounded-lg border border-violet-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-violet-100 bg-violet-50/70 px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-700" strokeWidth={1.8} />
            <h2 className="text-base font-semibold text-slate-950">AI Email Generator</h2>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Prompt for campaign copy, generate a branded HTML draft, then open Campaigns to save as
            draft, schedule, or send.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {model ? (
            <span className="inline-flex min-h-6 items-center rounded-full border border-violet-200 bg-white px-2.5 text-xs font-medium text-violet-700">
              {model}
            </span>
          ) : null}
          <a
            href="/admin/emails?tab=campaigns"
            className="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-800"
          >
            Campaigns
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.9} />
          </a>
        </div>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Prompt
            </label>
            {!draft ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {promptStarters.map((starter) => (
                  <button
                    key={starter.label}
                    type="button"
                    onClick={() => setPrompt(starter.prompt)}
                    className="inline-flex min-h-8 items-center rounded-md border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-800"
                  >
                    {starter.label}
                  </button>
                ))}
              </div>
            ) : null}
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={7}
              placeholder={
                draft
                  ? "Change the tone to be more premium, shorten the intro, or use a different CTA..."
                  : "Launch a campaign for parents planning birthday parties. Mention live cards, RSVP, registry links, and a CTA to create an event."
              }
              className="mt-2 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />
            {draft ? (
              <p className="mt-1 text-xs leading-5 text-slate-500">
                After a draft exists, this prompt edits the current email. Ask for a new image only
                when you want the visual regenerated.
              </p>
            ) : null}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Audience
            </label>
            <div className="flex rounded-lg bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setAudienceMode("individual")}
                className={`min-h-9 rounded-md px-3 text-sm font-medium transition ${
                  audienceMode === "individual"
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-600 hover:text-slate-950"
                }`}
              >
                Individual
              </button>
              <button
                type="button"
                onClick={() => setAudienceMode("broadcast")}
                className={`min-h-9 rounded-md px-3 text-sm font-medium transition ${
                  audienceMode === "broadcast"
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-600 hover:text-slate-950"
                }`}
              >
                Broadcast
              </button>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              {audienceMode === "broadcast"
                ? "Newsletter tone for all users. Use In Campaign preselects All users."
                : "1:1 tone for a test or short list. Use In Campaign preselects Individual."}{" "}
              Each generate creates professional still photos (QA-checked to avoid AI-looking
              art) for Snap, Concierge, teachers, and sharing—with CTAs to envitefy.com.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={busy}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-violet-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Wand2 className="h-4 w-4" strokeWidth={1.9} />
              {busy
                ? draft
                  ? "Updating..."
                  : "Generating..."
                : draft
                  ? "Update Draft"
                  : "Generate HTML Email"}
            </button>
            <button
              type="button"
              onClick={handleCopyHtml}
              disabled={!draft}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-600" strokeWidth={1.9} />
              ) : (
                <Copy className="h-4 w-4" strokeWidth={1.9} />
              )}
              {copied ? "Copied" : "Copy Full HTML"}
            </button>
            <button
              type="button"
              onClick={handleUseInCampaign}
              disabled={!draft}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-4 text-sm font-semibold text-violet-800 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ExternalLink className="h-4 w-4" strokeWidth={1.9} />
              Use In Campaign
            </button>
          </div>

          {message ? (
            <div
              className={`rounded-lg border px-3 py-2 text-sm ${
                message.tone === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              {message.text}
            </div>
          ) : null}

          {draft ? (
            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Subject
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-950">{draft.subject}</p>
              </div>
              {draft.preheader ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Preheader
                  </p>
                  <p className="mt-1 text-sm text-slate-700">{draft.preheader}</p>
                </div>
              ) : null}
              {draft.imageAssets?.length ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Generated Images
                  </p>
                  <div className="mt-1 space-y-2">
                    {draft.imageAssets.map((asset) => (
                      <a
                        key={asset.url}
                        href={asset.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block truncate rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-violet-700 hover:bg-violet-50"
                      >
                        {asset.url}
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Body HTML
                </p>
                <textarea
                  readOnly
                  value={draft.bodyHtml}
                  rows={8}
                  className="mt-1 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs leading-5 text-slate-800"
                />
              </div>
              {draft.notes ? <p className="text-xs text-slate-500">{draft.notes}</p> : null}
            </div>
          ) : null}
        </div>

        <div className="min-h-[520px] overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Preview
            </span>
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setPreviewMode("desktop")}
                  className={`inline-flex min-h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition ${
                    previewMode === "desktop"
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-600 hover:text-slate-950"
                  }`}
                >
                  <Monitor className="h-3.5 w-3.5" strokeWidth={1.9} />
                  Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("mobile")}
                  className={`inline-flex min-h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition ${
                    previewMode === "mobile"
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-600 hover:text-slate-950"
                  }`}
                >
                  <Smartphone className="h-3.5 w-3.5" strokeWidth={1.9} />
                  Mobile
                </button>
              </div>
              <span className="text-xs text-slate-500">Personalization preview</span>
            </div>
          </div>
          {busy && !draft ? (
            <div className="flex h-full min-h-[520px] flex-col items-center justify-center gap-3 px-6 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-200 border-t-violet-700" />
              <p className="text-sm font-medium text-slate-700">
                Generating professional scenario photos…
              </p>
              <p className="max-w-sm text-xs text-slate-500">
                Creating QA-checked stills for Snap, Concierge, teachers, and share (no GIFs).
                First run often takes 2–5 minutes — image gen + vision QA for each row.
              </p>
            </div>
          ) : draft ? (
            <div className="flex h-[620px] justify-center overflow-auto bg-slate-100 p-3">
              <iframe
                title="Generated email preview"
                srcDoc={previewHtml}
                sandbox="allow-same-origin"
                className="h-full border-0 bg-white shadow-sm"
                style={
                  previewMode === "mobile"
                    ? { width: 390, maxWidth: "100%" }
                    : { width: "100%" }
                }
              />
            </div>
          ) : (
            <div className="flex h-full min-h-[520px] items-center justify-center px-6 text-center text-sm text-slate-500">
              Generated email preview will appear here.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
