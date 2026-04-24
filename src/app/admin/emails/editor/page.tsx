"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
  MAGAZINE_1_SUBJECT,
  renderMagazineEmail,
} from "@/lib/email-templates/magazine-1";

const EDITOR_HANDOFF_KEY = "envitefy:admin:email-editor:handoff";
const EDITOR_DRAFT_KEY = "envitefy:admin:email-editor:draft";

const STARTER_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Envitefy Email</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background:#f6f3ff;color:#1f1a37;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 12px 40px rgba(77,56,160,0.12);">
          <tr>
            <td style="padding:40px 32px;">
              <h1 style="margin:0 0 16px 0;font-size:28px;line-height:34px;color:#17112d;">Hi {{firstName}},</h1>
              <p style="margin:0 0 16px 0;font-size:16px;line-height:26px;color:#3a3552;">
                This is a starter HTML email. Paste your own full HTML here, or keep
                iterating — the preview on the right updates as you type.
              </p>
              <p style="margin:24px 0 0 0;">
                <a href="https://envitefy.com" style="display:inline-block;padding:14px 24px;border-radius:999px;background:linear-gradient(90deg,#6f45ff 0%,#169dff 100%);color:#ffffff;font-weight:700;text-decoration:none;">
                  Open Envitefy
                </a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

type DeviceMode = "desktop" | "mobile";
type AudienceMode = "test" | "all";

function personalize(html: string) {
  return html
    .replace(/\{\{greeting\}\}/g, "Hi Taylor")
    .replace(/\{\{firstName\}\}/g, "Taylor")
    .replace(/\{\{lastName\}\}/g, "Smith");
}

export default function EmailEditorPage() {
  const { data: session, status } = useSession();
  const isAdmin = Boolean((session?.user as any)?.isAdmin);

  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [audience, setAudience] = useState<AudienceMode>("test");
  const [testEmails, setTestEmails] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [device, setDevice] = useState<DeviceMode>("desktop");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current) return;
    if (typeof window === "undefined") return;

    try {
      const handoffRaw = sessionStorage.getItem(EDITOR_HANDOFF_KEY);
      if (handoffRaw) {
        const handoff = JSON.parse(handoffRaw);
        if (handoff?.html) setHtml(String(handoff.html));
        if (handoff?.subject) setSubject(String(handoff.subject));
        sessionStorage.removeItem(EDITOR_HANDOFF_KEY);
        hydratedRef.current = true;
        return;
      }
    } catch {}

    try {
      const draftRaw = localStorage.getItem(EDITOR_DRAFT_KEY);
      if (draftRaw) {
        const draft = JSON.parse(draftRaw);
        if (draft?.html) setHtml(String(draft.html));
        if (draft?.subject) setSubject(String(draft.subject));
        hydratedRef.current = true;
        return;
      }
    } catch {}

    setHtml(STARTER_HTML);
    hydratedRef.current = true;
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    try {
      localStorage.setItem(
        EDITOR_DRAFT_KEY,
        JSON.stringify({ subject, html }),
      );
    } catch {}
  }, [subject, html]);

  const previewHtml = useMemo(() => personalize(html || ""), [html]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function insertMagazineTemplate() {
    setSubject(MAGAZINE_1_SUBJECT);
    setHtml(
      renderMagazineEmail({
        baseUrl:
          typeof window !== "undefined" ? window.location.origin : "https://envitefy.com",
      }),
    );
    setMessage(null);
  }

  function clearEditor() {
    if (!confirm("Clear the editor? Your current draft will be lost.")) return;
    setSubject("");
    setHtml(STARTER_HTML);
    setMessage(null);
    try {
      localStorage.removeItem(EDITOR_DRAFT_KEY);
    } catch {}
  }

  async function handleSend() {
    setMessage(null);

    if (!subject.trim()) {
      setMessage({ tone: "error", text: "Subject is required." });
      return;
    }
    if (!html.trim()) {
      setMessage({ tone: "error", text: "HTML body is required." });
      return;
    }

    if (audience === "test" && !testEmails.trim()) {
      setMessage({
        tone: "error",
        text: "Add at least one recipient email for a test send.",
      });
      return;
    }

    if (audience === "all") {
      const confirmed = confirm(
        "You are about to send this HTML email to ALL users. Continue?",
      );
      if (!confirmed) return;
    }

    setBusy(true);
    try {
      const payload = {
        subject,
        html,
        fromEmail: fromEmail.trim() || undefined,
        audienceFilter:
          audience === "test"
            ? { testEmail: testEmails }
            : { testEmail: null },
      };

      const res = await fetch("/api/admin/campaigns/send-raw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data?.error || "Failed to send campaign");
      }

      setMessage({
        tone: "success",
        text: `Sent ${data.sent} email${data.sent === 1 ? "" : "s"}${data.failed ? `, ${data.failed} failed` : ""}. Campaign id: ${data.campaignId}`,
      });
    } catch (err: any) {
      setMessage({
        tone: "error",
        text: err?.message || "Failed to send campaign",
      });
    } finally {
      setBusy(false);
    }
  }

  if (status === "loading") {
    return <div className="p-6">Loading…</div>;
  }
  if (status !== "authenticated") {
    return (
      <div className="p-6">
        <p className="mb-3">You must sign in to view this page.</p>
        <Link href="/">Go home</Link>
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="p-6">
        <p className="mb-3">Forbidden: Admins only.</p>
        <Link href="/">Go home</Link>
      </div>
    );
  }

  const previewFrameStyle =
    device === "mobile"
      ? { width: 390, maxWidth: "100%", height: 780 }
      : { width: "100%", height: 780 };

  return (
    <div
      className="min-h-[100dvh] bg-gradient-to-br from-[#ffffff] via-[#f6f3ff] to-[#f1ecff] text-[#3f3269]"
      suppressHydrationWarning
    >
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 space-y-5">
        <div className="flex flex-col gap-2 pt-6">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/emails"
              className="text-[#8c80b6] hover:text-[#43366f] transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#6f57c8] to-[#9278e3] bg-clip-text text-transparent">
              HTML Email Editor
            </h1>
          </div>
          <p className="text-sm text-[#8c80b6] ml-9">
            Paste a full HTML document, edit live, and send as a campaign.
            Supports{" "}
            <code className="bg-[#f2edff] px-1 py-0.5 rounded text-[#5f49bb]">
              {"{{firstName}}"}
            </code>
            ,{" "}
            <code className="bg-[#f2edff] px-1 py-0.5 rounded text-[#5f49bb]">
              {"{{lastName}}"}
            </code>
            , and{" "}
            <code className="bg-[#f2edff] px-1 py-0.5 rounded text-[#5f49bb]">
              {"{{greeting}}"}
            </code>{" "}
            substitution.
          </p>
        </div>

        {/* Top controls */}
        <div className="bg-white rounded-xl border border-[#ddd5f6] ring-1 ring-[#ede7ff] shadow-sm p-4 sm:p-5 space-y-4">
          <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-[#7f7897] mb-1.5">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Envitefy is back — reimagined."
                className="w-full px-4 py-2.5 bg-white border border-[#d8d0f3] rounded-lg text-[#483a74] placeholder:text-[#9a8fc0] focus:outline-none focus:ring-2 focus:ring-[#baa9ea]/55 focus:border-[#9b86df]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-[#7f7897] mb-1.5">
                From (optional)
              </label>
              <input
                type="text"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                placeholder="Envitefy <hello@envitefy.com>"
                className="w-full px-4 py-2.5 bg-white border border-[#d8d0f3] rounded-lg text-[#483a74] placeholder:text-[#9a8fc0] focus:outline-none focus:ring-2 focus:ring-[#baa9ea]/55 focus:border-[#9b86df]"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7f7897]">
                Audience
              </span>
              <div className="flex gap-1 bg-[#f3efff] rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setAudience("test")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    audience === "test"
                      ? "bg-[#7f67d3] text-white shadow"
                      : "text-[#4b3f72] hover:bg-white/60"
                  }`}
                >
                  📧 Individual
                </button>
                <button
                  type="button"
                  onClick={() => setAudience("all")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    audience === "all"
                      ? "bg-[#6f57c8] text-white shadow"
                      : "text-[#4b3f72] hover:bg-white/60"
                  }`}
                >
                  All users
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7f7897]">
                Preview
              </span>
              <div className="flex gap-1 bg-[#f3efff] rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setDevice("desktop")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    device === "desktop"
                      ? "bg-white text-[#4b3f72] shadow"
                      : "text-[#7f7897] hover:bg-white/60"
                  }`}
                >
                  Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setDevice("mobile")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    device === "mobile"
                      ? "bg-white text-[#4b3f72] shadow"
                      : "text-[#7f7897] hover:bg-white/60"
                  }`}
                >
                  Mobile
                </button>
              </div>
            </div>
          </div>

          {audience === "test" && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-[#7f7897] mb-1.5">
                Recipient emails (comma-separated)
              </label>
              <textarea
                value={testEmails}
                onChange={(e) => setTestEmails(e.target.value)}
                rows={2}
                placeholder="you@envitefy.com, friend@example.com"
                className="w-full px-4 py-2.5 bg-white border border-[#d8d0f3] rounded-lg text-[#483a74] placeholder:text-[#9a8fc0] focus:outline-none focus:ring-2 focus:ring-[#baa9ea]/55 focus:border-[#9b86df] resize-y"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={insertMagazineTemplate}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#f6f2ff] hover:bg-[#eee7ff] border border-[#d8d0f3] transition-colors text-[#4b3f72]"
            >
              📰 Load magazine template
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#f6f2ff] hover:bg-[#eee7ff] border border-[#d8d0f3] transition-colors text-[#4b3f72]"
            >
              {copied ? "Copied!" : "Copy HTML"}
            </button>
            <button
              type="button"
              onClick={clearEditor}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white hover:bg-[#fbf5f5] border border-[#e6c9d0] transition-colors text-[#a14a67]"
            >
              Clear
            </button>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={handleSend}
                disabled={busy}
                className="px-5 py-2 text-sm font-semibold rounded-lg bg-[#6f57c8] hover:bg-[#5f49bb] text-white shadow transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {busy
                  ? "Sending…"
                  : audience === "test"
                    ? "🚀 Send test"
                    : "🚀 Send campaign"}
              </button>
            </div>
          </div>

          {message && (
            <div
              className={`rounded-lg px-4 py-2.5 text-sm ${
                message.tone === "success"
                  ? "bg-[#edf9f0] text-[#2f7a54] border border-[#b8e3c6]"
                  : "bg-[#fff4f4] text-[#a73e3e] border border-[#efbbbb]"
              }`}
            >
              {message.text}
            </div>
          )}
        </div>

        {/* Editor + Preview */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="bg-white rounded-xl border border-[#ddd5f6] ring-1 ring-[#ede7ff] shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#e4def9] bg-[#faf8ff]">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#e86b9a]" />
                <span className="h-2 w-2 rounded-full bg-[#f5c65a]" />
                <span className="h-2 w-2 rounded-full bg-[#6bcf90]" />
                <span className="ml-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#7f7897]">
                  HTML source
                </span>
              </div>
              <span className="text-xs text-[#9a8fc0]">
                {(html || "").length.toLocaleString()} chars
              </span>
            </div>
            <textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              spellCheck={false}
              className="flex-1 min-h-[720px] w-full px-4 py-3 bg-[#1a1530] text-[#e8e3ff] font-mono text-[13px] leading-[20px] border-0 focus:outline-none resize-none"
              placeholder="Paste your full <!DOCTYPE html>...</html> document here."
            />
          </div>

          <div className="bg-white rounded-xl border border-[#ddd5f6] ring-1 ring-[#ede7ff] shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#e4def9] bg-[#faf8ff]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7f7897]">
                  Live preview
                </span>
                <span className="text-xs text-[#9a8fc0]">
                  · {device === "mobile" ? "390 px" : "Full width"}
                </span>
              </div>
              <span className="text-xs text-[#9a8fc0]">
                Personalization: firstName = Taylor
              </span>
            </div>
            <div className="flex-1 overflow-auto bg-[#f1ecfb] p-4 flex items-start justify-center">
              <iframe
                title="Live email preview"
                srcDoc={previewHtml}
                sandbox="allow-same-origin"
                style={previewFrameStyle}
                className="bg-white rounded-lg shadow-md border border-[#ddd5f6]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
