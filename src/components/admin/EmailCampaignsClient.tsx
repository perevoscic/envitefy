"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ADMIN_EMAIL_CAMPAIGN_DRAFT_KEY,
  type AdminEmailCampaignDraft,
} from "@/lib/admin/email-campaign-draft";
import { parseStoredCampaignAudienceFilter } from "@/lib/admin/email-campaigns";
import { createEmailTemplate } from "@/lib/email-template";

interface Campaign {
  id: string;
  subject: string;
  bodyHtml: string;
  fromEmail: string | null;
  audienceFilter: unknown;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  status: string;
  errorMessage: string | null;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
  creator: {
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
}

type StatusFilter = "all" | "draft" | "queued" | "sent";

function isFullHtmlDocument(value: string): boolean {
  const html = value.trim().toLowerCase();
  return html.startsWith("<!doctype html") || html.includes("<html") || html.includes("<body");
}

function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatCampaignTime(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function CampaignsPage({
  initialShowComposer = false,
  embedded = false,
}: {
  initialShowComposer?: boolean;
  /** When true, omit the standalone page header (parent Emails shell provides nav). */
  embedded?: boolean;
}) {
  const { data: session, status } = useSession();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(initialShowComposer);
  const [campaignReloadKey, setCampaignReloadKey] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);

  // Form state
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [buttonUrl, setButtonUrl] = useState("");
  const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [scheduledAtLocal, setScheduledAtLocal] = useState("");
  const [htmlMode, setHtmlMode] = useState(false);
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const isAdmin = Boolean((session?.user as any)?.isAdmin);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = sessionStorage.getItem(ADMIN_EMAIL_CAMPAIGN_DRAFT_KEY);
      if (!raw) return;

      const handoff = JSON.parse(raw) as Partial<AdminEmailCampaignDraft>;
      if (typeof handoff.subject === "string") setSubject(handoff.subject);
      if (typeof handoff.bodyHtml === "string") setBody(handoff.bodyHtml);
      if (typeof handoff.buttonText === "string") setButtonText(handoff.buttonText);
      if (typeof handoff.buttonUrl === "string") setButtonUrl(handoff.buttonUrl);
      if (handoff.audienceMode === "broadcast") {
        setSelectedPlans(["all"]);
      } else if (handoff.audienceMode === "individual") {
        setSelectedPlans(["test"]);
      }
      setHtmlMode(true);
      setShowComposer(true);
      sessionStorage.removeItem(ADMIN_EMAIL_CAMPAIGN_DRAFT_KEY);
    } catch {}
  }, []);

  // Rich text editor functions
  const insertFormatting = (before: string, after: string = "") => {
    const textarea = bodyTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = body.substring(start, end);
    const newText = body.substring(0, start) + before + selectedText + after + body.substring(end);

    setBody(newText);

    // Set cursor position after inserted text
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const formatBold = () => insertFormatting("<strong>", "</strong>");
  const formatItalic = () => insertFormatting("<em>", "</em>");
  const formatUnderline = () => insertFormatting("<u>", "</u>");
  const formatHeading = () =>
    insertFormatting(
      '<p style="font-size: 20px; font-weight: 600; margin: 16px 0 8px 0;">',
      "</p>",
    );
  const formatCenter = () => insertFormatting('<p style="text-align: center;">', "</p>");
  const formatLink = () => {
    const url = prompt("Enter URL:");
    if (url)
      insertFormatting(
        `<a href="${url}" style="color: #2DD4BF; text-decoration: underline;">`,
        "</a>",
      );
  };
  const formatList = () =>
    insertFormatting("<ul>\n  <li>", "</li>\n  <li>Item 2</li>\n  <li>Item 3</li>\n</ul>");
  const formatNumberedList = () =>
    insertFormatting("<ol>\n  <li>", "</li>\n  <li>Item 2</li>\n  <li>Item 3</li>\n</ol>");
  const insertLineBreak = () => {
    const textarea = bodyTextareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const newText = `${body.substring(0, start)}\n<br>\n${body.substring(start)}`;
    setBody(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 5, start + 5);
    }, 0);
  };

  const insertPersonalizationToken = (token: string) => {
    const textarea = bodyTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = `${body.substring(0, start)}${token}${body.substring(end)}`;
    setBody(newText);

    setTimeout(() => {
      textarea.focus();
      const cursorPosition = start + token.length;
      textarea.setSelectionRange(cursorPosition, cursorPosition);
    }, 0);
  };

  const insertFirstName = () => insertPersonalizationToken("{{firstName}}");
  const insertFullName = () => insertPersonalizationToken("{{firstName}} {{lastName}}");

  const toggleHtmlMode = () => {
    setHtmlMode(!htmlMode);
  };

  useEffect(() => {
    if (status === "loading") return;

    if (status !== "authenticated" || !isAdmin) {
      setLoading(false);
      return;
    }

    const loadCampaigns = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (statusFilter !== "all") params.set("status", statusFilter);
        params.set("processDue", "1");
        const res = await fetch(`/api/admin/campaigns?${params.toString()}`);
        const data = await res.json();
        if (data.ok) {
          setCampaigns(data.campaigns);
        }
      } catch (error) {
        console.error("Failed to load campaigns:", error);
      } finally {
        setLoading(false);
      }
    };

    void loadCampaigns();
  }, [campaignReloadKey, isAdmin, status, statusFilter]);

  if (status === "loading") {
    return <div className="p-6">Loading…</div>;
  }

  if (status !== "authenticated") {
    return (
      <div className="p-6">
        <p className="text-red-500 mb-4">You must be signed in to view this page.</p>
        <Link href="/">Go home</Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-6">
        <p className="text-red-500 mb-4">Admin access required.</p>
        <Link href="/">Go home</Link>
      </div>
    );
  }

  const resetComposer = () => {
    setEditingCampaignId(null);
    setSubject("");
    setBody("");
    setButtonText("");
    setButtonUrl("");
    setSelectedPlans([]);
    setTestEmail("");
    setScheduledAtLocal("");
    setHtmlMode(false);
  };

  const buildAudienceFilter = () => {
    const isTest = selectedPlans.includes("test");
    return {
      testEmail: isTest ? testEmail : undefined,
      minScans: undefined,
      maxScans: undefined,
      lastActiveAfter: undefined,
      lastActiveBefore: undefined,
    };
  };

  const validateComposer = (opts?: { requireAudience?: boolean }) => {
    if (!subject || !body) {
      alert("Subject and body are required");
      return false;
    }
    if (opts?.requireAudience !== false && selectedPlans.length === 0) {
      alert("Please select at least one audience");
      return false;
    }
    if (selectedPlans.includes("test") && (!testEmail || !testEmail.trim())) {
      alert("Please enter at least one recipient email address");
      return false;
    }
    return true;
  };

  const loadCampaignIntoComposer = (campaign: Campaign, mode: "edit" | "reuse") => {
    const parsed = parseStoredCampaignAudienceFilter(campaign.audienceFilter);
    setSubject(campaign.subject);
    setBody(campaign.bodyHtml);
    setButtonText(parsed.buttonText);
    setButtonUrl(parsed.buttonUrl);
    setHtmlMode(true);
    if (parsed.audienceFilter.testEmail) {
      setSelectedPlans(["test"]);
      setTestEmail(parsed.audienceFilter.testEmail);
    } else if (parsed.audienceFilter.minScans || parsed.audienceFilter.maxScans) {
      setSelectedPlans(["all"]);
      setTestEmail("");
    } else {
      // Sent broadcast rows often only store audienceMode.
      const modeValue =
        campaign.audienceFilter &&
        typeof campaign.audienceFilter === "object" &&
        !Array.isArray(campaign.audienceFilter)
          ? (campaign.audienceFilter as { audienceMode?: string }).audienceMode
          : undefined;
      if (modeValue === "individual") {
        setSelectedPlans(["test"]);
      } else {
        setSelectedPlans(["all"]);
      }
      setTestEmail(parsed.audienceFilter.testEmail || "");
    }
    setScheduledAtLocal(toDatetimeLocalValue(campaign.scheduledAt));
    setEditingCampaignId(mode === "edit" ? campaign.id : null);
    setShowComposer(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaveDraft = async () => {
    if (!validateComposer()) return;
    setSavingDraft(true);
    try {
      const res = await fetch(
        editingCampaignId ? `/api/admin/campaigns/${editingCampaignId}` : "/api/admin/campaigns",
        {
          method: editingCampaignId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "save",
            subject,
            body,
            buttonText: buttonText || undefined,
            buttonUrl: buttonUrl || undefined,
            audienceFilter: buildAudienceFilter(),
          }),
        },
      );
      const data = await res.json();
      if (!data.ok) {
        alert(`Error: ${data.error || "Failed to save draft"}`);
        return;
      }
      setEditingCampaignId(data.campaignId);
      alert("Draft saved. You can edit it later from Campaign History.");
      setCampaignReloadKey((value) => value + 1);
    } catch (error: unknown) {
      alert(`Error: ${error instanceof Error ? error.message : "Failed to save draft"}`);
    } finally {
      setSavingDraft(false);
    }
  };

  const handleScheduleCampaign = async () => {
    if (!validateComposer()) return;
    if (!scheduledAtLocal) {
      alert("Pick a date and time to schedule this campaign");
      return;
    }
    const scheduledAt = new Date(scheduledAtLocal);
    if (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() <= Date.now()) {
      alert("Schedule time must be in the future");
      return;
    }

    setScheduling(true);
    try {
      let campaignId = editingCampaignId;
      if (!campaignId) {
        const draftRes = await fetch("/api/admin/campaigns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject,
            body,
            buttonText: buttonText || undefined,
            buttonUrl: buttonUrl || undefined,
            audienceFilter: buildAudienceFilter(),
          }),
        });
        const draftData = await draftRes.json();
        if (!draftData.ok) {
          alert(`Error: ${draftData.error || "Failed to save draft before scheduling"}`);
          return;
        }
        campaignId = draftData.campaignId;
        setEditingCampaignId(campaignId);
      }

      const res = await fetch(`/api/admin/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "schedule",
          scheduledAt: scheduledAt.toISOString(),
          subject,
          body,
          buttonText: buttonText || undefined,
          buttonUrl: buttonUrl || undefined,
          audienceFilter: buildAudienceFilter(),
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        alert(`Error: ${data.error || "Failed to schedule campaign"}`);
        return;
      }
      alert(`Campaign scheduled for ${formatCampaignTime(data.scheduledAt)}`);
      resetComposer();
      setShowComposer(false);
      setCampaignReloadKey((value) => value + 1);
    } catch (error: unknown) {
      alert(`Error: ${error instanceof Error ? error.message : "Failed to schedule campaign"}`);
    } finally {
      setScheduling(false);
    }
  };

  const handleCancelCampaignRow = async (campaign: Campaign) => {
    if (!confirm(`Cancel "${campaign.subject}"?`)) return;
    try {
      const res = await fetch(`/api/admin/campaigns/${campaign.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = await res.json();
      if (!data.ok) {
        alert(`Error: ${data.error || "Failed to cancel"}`);
        return;
      }
      if (editingCampaignId === campaign.id) resetComposer();
      setCampaignReloadKey((value) => value + 1);
    } catch (error: unknown) {
      alert(`Error: ${error instanceof Error ? error.message : "Failed to cancel"}`);
    }
  };

  const handleSendCampaign = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateComposer()) return;

    setSending(true);

    try {
      const res = await fetch("/api/admin/campaigns/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: editingCampaignId || undefined,
          subject,
          body,
          buttonText: buttonText || undefined,
          buttonUrl: buttonUrl || undefined,
          audienceFilter: buildAudienceFilter(),
        }),
      });

      const data = await res.json();

      if (data.ok) {
        let message = `Campaign sent!\n✅ Sent: ${data.sent}\n❌ Failed: ${data.failed}`;

        if (data.errors && data.errors.length > 0) {
          message += `\n\n❌ Failed recipients:\n`;
          data.errors.slice(0, 10).forEach((err: { email: string; error: string }) => {
            const shortError =
              err.error.length > 80 ? `${err.error.substring(0, 80)}...` : err.error;
            message += `• ${err.email}\n  ${shortError}\n`;
          });
          if (data.errors.length > 10) {
            message += `\n... and ${data.errors.length - 10} more failures`;
          }
        }

        alert(message);
        resetComposer();
        setShowComposer(false);
        setCampaignReloadKey((value) => value + 1);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error: unknown) {
      alert(`Error: ${error instanceof Error ? error.message : "Failed to send"}`);
    } finally {
      setSending(false);
    }
  };

  const handlePlanToggle = (plan: string) => {
    setSelectedPlans((prev) =>
      prev.includes(plan) ? prev.filter((p) => p !== plan) : [...prev, plan],
    );
  };

  // Generate email preview HTML using the same wrapper as real campaign sends.
  const generatePreviewHtml = () => {
    const greeting = "Hi Preview";
    const firstName = "Preview";
    const lastName = "Recipient";
    const previewBody = body
      .replace(/\{\{greeting\}\}/g, greeting)
      .replace(/\{\{firstName\}\}/g, firstName)
      .replace(/\{\{lastName\}\}/g, lastName);

    if (isFullHtmlDocument(previewBody)) {
      return previewBody;
    }

    return createEmailTemplate({
      title: subject || "Campaign Preview",
      body: previewBody || "<p>Your email body will appear here...</p>",
      buttonText: buttonText || undefined,
      buttonUrl: buttonUrl || undefined,
      footerText: "You're receiving this because you have an Envitefy account.",
    });
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-[#9b8ac8]",
      queued: "bg-[#8c74df]",
      sending: "bg-[#a58de9]",
      sent: "bg-[#6f57c8]",
      failed: "bg-[#e86b9a]",
      cancelled: "bg-[#b2a5d6]",
    };
    return (
      <span
        className={`px-2 py-1 rounded text-xs font-medium text-white ${
          colors[status] || "bg-gray-500"
        }`}
      >
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className={embedded ? "text-slate-950" : "min-h-[100dvh] text-slate-950"} suppressHydrationWarning>
      <div className="max-w-7xl" suppressHydrationWarning>
        {/* Header */}
        {!embedded ? (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Link
                href="/admin/emails"
                className="text-slate-500 hover:text-slate-950 transition-colors"
              >
                Emails
              </Link>
              <span className="text-slate-400">/</span>
              <h1 className="text-2xl font-semibold text-slate-950">Email Campaigns</h1>
            </div>
            <p className="text-slate-600 text-sm">Send bulk emails to your users using Resend</p>
          </div>
        ) : (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Campaign composer</h2>
              <p className="mt-1 text-sm text-slate-600">
                Save drafts, schedule sends, or send now. Drafts stay in history for reuse.
              </p>
            </div>
            <Link
              href="/admin/emails"
              className="inline-flex min-h-9 items-center rounded-md border border-violet-200 bg-violet-50 px-3 text-xs font-semibold text-violet-800 transition hover:bg-violet-100"
            >
              ← Back to AI Generator
            </Link>
          </div>
        )}

        {/* Composer Toggle */}
        <div className="mb-6">
          <button
            onClick={() => {
              if (showComposer) {
                resetComposer();
                setShowComposer(false);
              } else {
                resetComposer();
                setShowComposer(true);
              }
            }}
            className="px-4 py-2 bg-[#7f67d3] text-white rounded-lg font-medium hover:bg-[#6f57c8] transition-all"
          >
            {showComposer ? "✕ Cancel" : "✉️ New Campaign"}
          </button>
        </div>

        {/* Campaign Composer */}
        {showComposer && (
          <form
            onSubmit={handleSendCampaign}
            className="bg-white rounded-xl border border-[#ddd5f6] ring-1 ring-[#ede7ff] overflow-hidden shadow-sm p-6 mb-8"
          >
            <h2 className="text-lg font-semibold text-[#43366f] mb-4">
              {editingCampaignId ? "Edit Campaign" : "Compose Campaign"}
            </h2>

            {/* Subject */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#43366f] mb-2">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Your campaign subject line"
                className="w-full px-4 py-2 bg-white border border-[#d8d0f3] rounded-lg text-[#483a74] placeholder:text-[#9a8fc0] focus:outline-none focus:ring-2 focus:ring-[#baa9ea]/55 focus:border-[#9b86df]"
                required
              />
            </div>

            {/* Body */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#43366f] mb-2">
                Email Body <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-[#8c80b6] mb-2">
                Use{" "}
                <code className="bg-[#f2edff] px-1 py-0.5 rounded text-[#5f49bb]">
                  {"{{greeting}}"}
                </code>{" "}
                for personalized greeting,{" "}
                <code className="bg-[#f2edff] px-1 py-0.5 rounded text-[#5f49bb]">
                  {"{{firstName}}"}
                </code>{" "}
                for first name, and{" "}
                <code className="bg-[#f2edff] px-1 py-0.5 rounded text-[#5f49bb]">
                  {"{{lastName}}"}
                </code>{" "}
                for last name
              </p>

              {/* Formatting Toolbar */}
              <div className="flex flex-wrap gap-1 mb-2 p-2 bg-[#f8f4ff] rounded-lg border border-[#e4def9]">
                <button
                  type="button"
                  onClick={formatBold}
                  className="px-3 py-1.5 text-sm font-bold rounded hover:bg-[#eee7ff] transition-colors border border-[#ddd5f6]"
                  title="Bold"
                >
                  <strong>B</strong>
                </button>
                <button
                  type="button"
                  onClick={formatItalic}
                  className="px-3 py-1.5 text-sm italic rounded hover:bg-[#eee7ff] transition-colors border border-[#ddd5f6]"
                  title="Italic"
                >
                  <em>I</em>
                </button>
                <button
                  type="button"
                  onClick={formatUnderline}
                  className="px-3 py-1.5 text-sm underline rounded hover:bg-[#eee7ff] transition-colors border border-[#ddd5f6]"
                  title="Underline"
                >
                  U
                </button>
                <div className="w-px h-6 bg-[#ddd5f6] my-auto mx-1" />
                <button
                  type="button"
                  onClick={formatHeading}
                  className="px-3 py-1.5 text-sm font-semibold rounded hover:bg-[#eee7ff] transition-colors border border-[#ddd5f6]"
                  title="Heading"
                >
                  H
                </button>
                <button
                  type="button"
                  onClick={formatCenter}
                  className="px-3 py-1.5 text-sm rounded hover:bg-[#eee7ff] transition-colors border border-[#ddd5f6]"
                  title="Center align"
                >
                  ≡
                </button>
                <div className="w-px h-6 bg-[#ddd5f6] my-auto mx-1" />
                <button
                  type="button"
                  onClick={formatLink}
                  className="px-3 py-1.5 text-sm rounded hover:bg-[#eee7ff] transition-colors border border-[#ddd5f6]"
                  title="Insert link"
                >
                  🔗
                </button>
                <button
                  type="button"
                  onClick={formatList}
                  className="px-3 py-1.5 text-sm rounded hover:bg-[#eee7ff] transition-colors border border-[#ddd5f6]"
                  title="Bullet list"
                >
                  • List
                </button>
                <button
                  type="button"
                  onClick={formatNumberedList}
                  className="px-3 py-1.5 text-sm rounded hover:bg-[#eee7ff] transition-colors border border-[#ddd5f6]"
                  title="Numbered list"
                >
                  1. List
                </button>
                <button
                  type="button"
                  onClick={insertLineBreak}
                  className="px-3 py-1.5 text-sm rounded hover:bg-[#eee7ff] transition-colors border border-[#ddd5f6]"
                  title="Line break"
                >
                  ↵
                </button>
                <div className="w-px h-6 bg-[#ddd5f6] my-auto mx-1" />
                <button
                  type="button"
                  onClick={insertFirstName}
                  className="px-3 py-1.5 text-sm rounded hover:bg-[#eee7ff] transition-colors border border-[#ddd5f6]"
                  title="Insert first name ({{firstName}})"
                >
                  First
                </button>
                <button
                  type="button"
                  onClick={insertFullName}
                  className="px-3 py-1.5 text-sm rounded hover:bg-[#eee7ff] transition-colors border border-[#ddd5f6]"
                  title="Insert full name ({{firstName}} {{lastName}})"
                >
                  Name
                </button>
                <div className="w-px h-6 bg-[#ddd5f6] my-auto mx-1" />
                <button
                  type="button"
                  onClick={toggleHtmlMode}
                  className={`px-3 py-1.5 text-sm rounded transition-colors border border-border/50 font-mono ${
                    htmlMode
                      ? "bg-[#efe9ff] text-[#6f57c8] hover:bg-[#e7ddff]"
                      : "hover:bg-[#eee7ff]"
                  }`}
                  title={htmlMode ? "Switch to visual editor" : "View HTML source"}
                >
                  &lt;/&gt;
                </button>
              </div>

              {htmlMode && (
                <div className="mb-2 px-3 py-2 bg-[#f6f2ff] border border-[#ddd5f6] rounded-lg">
                  <p className="text-xs text-[#6f57c8] mb-2">
                    <span className="font-semibold">💡 HTML Mode Tips:</span>
                  </p>
                  <ul className="text-xs text-[#6f57c8] space-y-1 ml-4 list-disc">
                    <li>Use inline styles for best compatibility</li>
                    <li>
                      Add <code className="bg-[#ece4ff] px-1 rounded">!important</code> to colors &
                      backgrounds for dark mode
                    </li>
                    <li>
                      Add <code className="bg-[#ece4ff] px-1 rounded">bgcolor="#FFFFFF"</code>{" "}
                      attributes to elements with white backgrounds
                    </li>
                    <li>
                      Example:{" "}
                      <code className="bg-[#ece4ff] px-1 rounded">
                        style="background-color: #F59E0B !important; color: white !important;"
                      </code>
                    </li>
                  </ul>
                </div>
              )}

              <textarea
                ref={bodyTextareaRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={
                  htmlMode
                    ? `<p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">{{greeting}},</p>\n\n<p style="margin: 0 0 16px 0;">Your HTML content here...</p>`
                    : `{{greeting}},\n\nWe're excited to share...\n\nYour content here (HTML supported).`
                }
                rows={5}
                className={`w-full px-4 py-2 bg-background border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 font-mono text-sm md:min-h-[300px] resize-y ${
                  htmlMode
                    ? "border-[#bca9ea] focus:ring-[#baa9ea]/55 bg-[#f8f4ff]"
                    : "border-[#d8d0f3] focus:ring-[#baa9ea]/55"
                }`}
                required
              />
            </div>

            {/* Button (optional) */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-[#43366f] mb-2">
                  Button Text (optional)
                </label>
                <input
                  type="text"
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                  placeholder="Get Started"
                  className="w-full px-4 py-2 bg-white border border-[#d8d0f3] rounded-lg text-[#483a74] placeholder:text-[#9a8fc0] focus:outline-none focus:ring-2 focus:ring-[#baa9ea]/55 focus:border-[#9b86df]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#43366f] mb-2">
                  Button URL (optional)
                </label>
                <input
                  type="url"
                  value={buttonUrl}
                  onChange={(e) => setButtonUrl(e.target.value)}
                  placeholder="https://envitefy.com/create-event"
                  className="w-full px-4 py-2 bg-white border border-[#d8d0f3] rounded-lg text-[#483a74] placeholder:text-[#9a8fc0] focus:outline-none focus:ring-2 focus:ring-[#baa9ea]/55 focus:border-[#9b86df]"
                />
              </div>
            </div>

            {/* Audience Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#43366f] mb-2">
                Audience <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {["test", "all"].map((plan) => (
                  <button
                    key={plan}
                    type="button"
                    onClick={() => handlePlanToggle(plan)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      selectedPlans.includes(plan)
                        ? plan === "test"
                          ? "bg-[#7f67d3] text-white shadow-lg"
                          : plan === "all"
                            ? "bg-[#6f57c8] text-white shadow-lg"
                            : "bg-[#8c74df] text-white shadow-lg"
                        : "bg-[#f3efff] text-[#4b3f72] hover:bg-[#eae2ff]"
                    }`}
                  >
                    {plan === "test" ? "📧 Individual" : plan === "all" ? "All users" : plan}
                  </button>
                ))}
              </div>

              {/* Individual Recipients Email Input */}
              {selectedPlans.includes("test") && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-[#43366f] mb-2">
                    Recipient Email Addresses <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="email1@example.com, email2@example.com, email3@example.com"
                    rows={3}
                    className="w-full px-4 py-2 bg-white border border-[#d8d0f3] rounded-lg text-[#483a74] placeholder:text-[#9a8fc0] focus:outline-none focus:ring-2 focus:ring-[#baa9ea]/55 focus:border-[#9b86df] resize-y"
                    required={selectedPlans.includes("test")}
                  />
                  <p className="text-xs text-[#8c80b6] mt-2">
                    📧 Enter one or more email addresses (comma-separated). Great for sending to
                    specific recipients or testing before full campaign launch.
                  </p>
                </div>
              )}
            </div>

            {/* Schedule */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#43366f] mb-2">
                Schedule send (optional)
              </label>
              <input
                type="datetime-local"
                value={scheduledAtLocal}
                onChange={(e) => setScheduledAtLocal(e.target.value)}
                className="w-full max-w-md px-4 py-2 bg-white border border-[#d8d0f3] rounded-lg text-[#483a74] focus:outline-none focus:ring-2 focus:ring-[#baa9ea]/55 focus:border-[#9b86df]"
              />
              <p className="text-xs text-[#8c80b6] mt-2">
                Set a future time, then click Schedule. Due campaigns also send when you open this
                tab or when cron hits process-due.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                disabled={!subject || !body || selectedPlans.length === 0}
                className="px-6 py-2 bg-[#7f67d3] text-white rounded-lg font-medium hover:bg-[#6f57c8] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Preview Email
              </button>
              <button
                type="button"
                onClick={() => void handleSaveDraft()}
                disabled={savingDraft || sending || scheduling || !subject || !body}
                className="px-6 py-2 bg-white text-[#4b3f72] border border-[#d8d0f3] rounded-lg font-medium hover:bg-[#f6f2ff] transition-all disabled:opacity-50"
              >
                {savingDraft ? "Saving…" : "Save draft"}
              </button>
              <button
                type="button"
                onClick={() => void handleScheduleCampaign()}
                disabled={scheduling || sending || savingDraft || !subject || !body || !scheduledAtLocal}
                className="px-6 py-2 bg-[#8c74df] text-white rounded-lg font-medium hover:bg-[#7b63d0] transition-all disabled:opacity-50"
              >
                {scheduling ? "Scheduling…" : "Schedule send"}
              </button>
              <button
                type="button"
                onClick={() => {
                  resetComposer();
                  setShowComposer(false);
                }}
                className="px-6 py-2 bg-[#f3efff] text-[#4b3f72] rounded-lg font-medium hover:bg-[#eae2ff] transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-xl border border-[#ddd5f6] ring-1 ring-[#ede7ff] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-[#e4def9] bg-[#faf8ff]">
                <div>
                  <h2 className="text-xl font-semibold text-[#43366f]">Email Preview</h2>
                  <p className="text-sm text-[#8c80b6] mt-1">
                    Review your campaign before sending to{" "}
                    {selectedPlans
                      .filter((p) => p !== "test")
                      .map((p) => (p === "all" ? "All users" : p))
                      .join(", ") || "your selection"}
                  </p>
                </div>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 rounded-lg hover:bg-[#eee7ff] transition-colors"
                  title="Close preview"
                >
                  <svg
                    className="w-6 h-6 text-[#8c80b6]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Preview Content */}
              <div className="flex-1 overflow-auto p-6 bg-[#f8f4ff]">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <iframe
                    srcDoc={generatePreviewHtml()}
                    className="w-full border-0"
                    style={{ height: "600px" }}
                    title="Email Preview"
                    sandbox="allow-same-origin"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between p-6 border-t border-[#e4def9] bg-[#faf8ff]">
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-6 py-2 bg-[#f3efff] text-[#4b3f72] rounded-lg font-medium hover:bg-[#eae2ff] transition-all"
                >
                  ← Back to Edit
                </button>
                <button
                  onClick={(e) => {
                    setShowPreview(false);
                    handleSendCampaign(e as any);
                  }}
                  disabled={sending}
                  className="px-6 py-2 bg-[#6f57c8] text-white rounded-lg font-medium hover:bg-[#5f49bb] transition-all disabled:opacity-50 shadow-lg"
                >
                  {sending ? "Sending..." : "✓ Approve & Send Campaign"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Campaign History */}
        <div className="bg-white rounded-xl border border-[#ddd5f6] ring-1 ring-[#ede7ff] overflow-hidden shadow-sm">
          <div className="p-6 border-b border-[#e4def9] bg-[#faf8ff]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-[#43366f]">Campaign History</h2>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["all", "All"],
                    ["draft", "Drafts"],
                    ["queued", "Scheduled"],
                    ["sent", "Sent"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStatusFilter(value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                      statusFilter === value
                        ? "bg-[#7f67d3] text-white border-[#7f67d3]"
                        : "bg-white text-[#4b3f72] border-[#d8d0f3] hover:bg-[#f6f2ff]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-6">Loading campaigns...</div>
          ) : campaigns.length === 0 ? (
            <div className="p-6 text-center text-[#8c80b6]">
              No campaigns yet. Create your first one above!
            </div>
          ) : (
            <div className="divide-y divide-[#e4def9]">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="p-6 hover:bg-[#faf8ff] transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-[#43366f] mb-1">{campaign.subject}</h3>
                      <p className="text-sm text-[#8c80b6]">
                        by {campaign.creator.firstName || campaign.creator.email}
                      </p>
                    </div>
                    {getStatusBadge(campaign.status)}
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                    <div>
                      <span className="text-[#8c80b6]">Recipients:</span>{" "}
                      <span className="font-medium">{campaign.recipientCount}</span>
                    </div>
                    <div>
                      <span className="text-[#8c80b6]">Sent:</span>{" "}
                      <span className="font-medium text-[#6f57c8]">{campaign.sentCount}</span>
                    </div>
                    <div>
                      <span className="text-[#8c80b6]">Failed:</span>{" "}
                      <span className="font-medium text-[#e86b9a]">{campaign.failedCount}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
                    <div className="text-xs text-[#8c80b6]">
                      {campaign.status === "queued" && campaign.scheduledAt
                        ? `Scheduled ${formatCampaignTime(campaign.scheduledAt)}`
                        : campaign.sentAt
                          ? `Sent ${formatCampaignTime(campaign.sentAt)}`
                          : `Created ${formatCampaignTime(campaign.createdAt)}`}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(campaign.status === "draft" ||
                        campaign.status === "queued" ||
                        campaign.status === "cancelled") && (
                        <button
                          type="button"
                          onClick={() => loadCampaignIntoComposer(campaign, "edit")}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#f6f2ff] hover:bg-[#eee7ff] border border-[#d8d0f3] transition-colors text-[#4b3f72]"
                        >
                          Edit
                        </button>
                      )}
                      {(campaign.status === "draft" || campaign.status === "queued") && (
                        <button
                          type="button"
                          onClick={() => void handleCancelCampaignRow(campaign)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white hover:bg-[#fff1f5] border border-[#f0c2d4] transition-colors text-[#b44d73]"
                        >
                          {campaign.status === "queued" ? "Cancel schedule" : "Cancel"}
                        </button>
                      )}
                      {(campaign.status === "sent" || campaign.status === "failed") && (
                        <button
                          type="button"
                          onClick={() => loadCampaignIntoComposer(campaign, "reuse")}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#f6f2ff] hover:bg-[#eee7ff] border border-[#d8d0f3] transition-colors flex items-center gap-1.5 text-[#4b3f72]"
                          title="Copy this campaign to create a new one"
                        >
                          Copy & Reuse
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
