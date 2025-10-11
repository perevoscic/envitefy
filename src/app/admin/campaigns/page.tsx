"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface Campaign {
  id: string;
  subject: string;
  bodyHtml: string;
  fromEmail: string | null;
  audienceFilter: any;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  status: string;
  errorMessage: string | null;
  sentAt: string | null;
  createdAt: string;
  creator: {
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
}

export default function CampaignsPage() {
  const { data: session, status } = useSession();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(false);

  // Form state
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [buttonUrl, setButtonUrl] = useState("");
  const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [htmlMode, setHtmlMode] = useState(false);
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Rich text editor functions
  const insertFormatting = (before: string, after: string = "") => {
    const textarea = bodyTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = body.substring(start, end);
    const newText =
      body.substring(0, start) +
      before +
      selectedText +
      after +
      body.substring(end);

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
      "</p>"
    );
  const formatCenter = () =>
    insertFormatting('<p style="text-align: center;">', "</p>");
  const formatLink = () => {
    const url = prompt("Enter URL:");
    if (url)
      insertFormatting(
        `<a href="${url}" style="color: #2DD4BF; text-decoration: underline;">`,
        "</a>"
      );
  };
  const formatList = () =>
    insertFormatting(
      "<ul>\n  <li>",
      "</li>\n  <li>Item 2</li>\n  <li>Item 3</li>\n</ul>"
    );
  const formatNumberedList = () =>
    insertFormatting(
      "<ol>\n  <li>",
      "</li>\n  <li>Item 2</li>\n  <li>Item 3</li>\n</ol>"
    );
  const insertLineBreak = () => {
    const textarea = bodyTextareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const newText =
      body.substring(0, start) + "\n<br>\n" + body.substring(start);
    setBody(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 5, start + 5);
    }, 0);
  };

  const insertFullName = () => {
    const textarea = bodyTextareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const newText =
      body.substring(0, start) +
      "{{firstName}} {{lastName}}" +
      body.substring(start);
    setBody(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 27, start + 27);
    }, 0);
  };

  const toggleHtmlMode = () => {
    setHtmlMode(!htmlMode);
  };

  if (status === "loading") {
    return <div className="p-6">Loading…</div>;
  }

  if (status !== "authenticated") {
    return (
      <div className="p-6">
        <p className="text-red-500 mb-4">
          You must be signed in to view this page.
        </p>
        <Link href="/">Go home</Link>
      </div>
    );
  }

  // Check admin status
  const isAdmin = (session.user as any)?.isAdmin;
  if (!isAdmin) {
    return (
      <div className="p-6">
        <p className="text-red-500 mb-4">Admin access required.</p>
        <Link href="/">Go home</Link>
      </div>
    );
  }

  const loadCampaigns = async () => {
    try {
      const res = await fetch("/api/admin/campaigns");
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

  useEffect(() => {
    loadCampaigns();
  }, []);

  const handleSendCampaign = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject || !body) {
      alert("Subject and body are required");
      return;
    }

    if (selectedPlans.length === 0) {
      alert("Please select at least one audience");
      return;
    }

    // Handle test and all modes
    const isTest = selectedPlans.includes("test");
    const isAll = selectedPlans.includes("all");
    if (isTest && (!testEmail || !testEmail.trim())) {
      alert("Please enter at least one recipient email address");
      return;
    }

    setSending(true);

    try {
      const res = await fetch("/api/admin/campaigns/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          body,
          buttonText: buttonText || undefined,
          buttonUrl: buttonUrl || undefined,
          audienceFilter: {
            // Test mode has priority; next is All users; else specific plans
            plans: isTest ? [] : isAll ? undefined : selectedPlans,
            testEmail: isTest ? testEmail : undefined,
          },
        }),
      });

      const data = await res.json();

      if (data.ok) {
        let message = `Campaign sent!\n✅ Sent: ${data.sent}\n❌ Failed: ${data.failed}`;

        // Show failed recipients
        if (data.errors && data.errors.length > 0) {
          message += `\n\n❌ Failed recipients:\n`;
          data.errors.slice(0, 10).forEach((err: any) => {
            const shortError =
              err.error.length > 80
                ? err.error.substring(0, 80) + "..."
                : err.error;
            message += `• ${err.email}\n  ${shortError}\n`;
          });
          if (data.errors.length > 10) {
            message += `\n... and ${data.errors.length - 10} more failures`;
          }
        }

        alert(message);
        // Reset form
        setSubject("");
        setBody("");
        setButtonText("");
        setButtonUrl("");
        setSelectedPlans([]);
        setShowComposer(false);
        // Reload campaigns
        loadCampaigns();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const handlePlanToggle = (plan: string) => {
    setSelectedPlans((prev) =>
      prev.includes(plan) ? prev.filter((p) => p !== plan) : [...prev, plan]
    );
  };

  // Generate email preview HTML (client-side version of createEmailTemplate)
  const generatePreviewHtml = () => {
    const baseUrl = window.location.origin;
    const logoUrl = `${baseUrl}/SnapMyDateSnapItSaveitDone_black_h.png`;
    const greeting = "Hi, "; // Sample greeting for preview
    const firstName = "Taylor";
    const lastName = "Smith";
    const previewBody = body
      .replace(/\{\{greeting\}\}/g, greeting)
      .replace(/\{\{firstName\}\}/g, firstName)
      .replace(/\{\{lastName\}\}/g, lastName);

    return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light only" />
    <meta name="supported-color-schemes" content="light" />
    <title>${subject || "Campaign Preview"}</title>
    <style>
      /* Prevent dark mode */
      :root { color-scheme: light only !important; }
      @media (prefers-color-scheme: dark) {
        body, table, td, a { background-color: #FFFBF7 !important; }
      }
    </style>
  </head>
  <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #FFFBF7 !important; color-scheme: light !important;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #FFFBF7 !important; padding: 40px 20px; color-scheme: light !important;" bgcolor="#FFFBF7">
      <tr>
        <td align="center" style="background-color: #FFFBF7 !important;" bgcolor="#FFFBF7">
          <!-- Logo on beige background -->
          <div style="padding: 0 0 24px 0; background-color: #FFFBF7 !important; text-align: center;" bgcolor="#FFFBF7">
            <img src="${logoUrl}" alt="Snap My Date" style="max-width: 280px; height: auto; display: block; margin: 0 auto;">
          </div>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; background-color: #FFFFFF !important; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" bgcolor="#FFFFFF">
            <!-- Content -->
            <tr>
              <td style="padding: 32px 32px 24px 32px; background-color: #FFFFFF;" bgcolor="#FFFFFF">
                <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 700; color: #2E2C2D; line-height: 1.3;">
                  ${subject || "Subject Preview"}
                </h1>
                <div style="color: #4E4E50; font-size: 16px; line-height: 1.6;">
                  ${previewBody || "<p>Your email body will appear here...</p>"}
                </div>
                ${
                  buttonText && buttonUrl
                    ? `
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 32px 0 0 0;">
                  <tr>
                    <td style="border-radius: 12px; background-color: #2DD4BF !important;" bgcolor="#2DD4BF">
                      <a href="${buttonUrl}" style="display: inline-block; padding: 14px 32px; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 16px; background-color: #2DD4BF;">
                        ${buttonText}
                      </a>
                    </td>
                  </tr>
                </table>
                `
                    : ""
                }
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding: 24px 32px 32px 32px; border-top: 1px solid #E5E5E5; background-color: #FFFFFF;" bgcolor="#FFFFFF">
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #737373; line-height: 1.5; font-style: italic;">
                  Sincerely,<br>
                  <strong style="color: #2E2C2D;">Snap My Date Team</strong>
                </p>
                <p style="margin: 4px 0 0 0; font-size: 11px; letter-spacing: 1.6px; color: #9CA3AF; font-weight: 700; text-transform: uppercase;">
                  SNAP IT. SAVE IT. DONE.
                </p>
                <p style="margin: 16px 0 0 0; font-size: 12px; color: #A3A3A3; line-height: 1.5;">
                  You're receiving this because you have a Snap My Date account.
                </p>
              </td>
            </tr>
          </table>
          <!-- Social Media Links -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 32px auto 16px auto; background-color: #FFFBF7;" bgcolor="#FFFBF7">
            <tr>
              <td style="text-align: center; padding-bottom: 16px; background-color: #FFFBF7;" bgcolor="#FFFBF7">
                <p style="margin: 0; font-size: 14px; color: #737373;">Connect with us</p>
              </td>
            </tr>
            <tr>
              <td style="text-align: center;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                  <tr>
                    <td style="padding: 0 12px;">
                      <a href="https://www.instagram.com/snapmydate/" target="_blank" title="Instagram" style="display: inline-block;">
                        <svg width="32" height="32" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="none" style="display: block;">
                          <path d="M35.38,10.46a2.19,2.19,0,1,0,2.16,2.22v-.06A2.18,2.18,0,0,0,35.38,10.46Z" stroke="#737373" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M40.55,5.5H7.45a2,2,0,0,0-1.95,2v33.1a2,2,0,0,0,2,2h33.1a2,2,0,0,0,2-2V7.45A2,2,0,0,0,40.55,5.5Z" stroke="#737373" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M24,15.72A8.28,8.28,0,1,0,32.28,24h0A8.28,8.28,0,0,0,24,15.72Z" stroke="#737373" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </a>
                    </td>
                    <td style="padding: 0 12px;">
                      <a href="https://www.facebook.com/snapmydate/" target="_blank" title="Facebook" style="display: inline-block;">
                        <svg width="32" height="32" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="none" style="display: block;">
                          <path d="M24,42.5V18.57a5.07,5.07,0,0,1,5.08-5.07h0c2.49,0,4.05.74,5.12,2.12" stroke="#737373" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          <line x1="19.7" y1="23.29" x2="29.85" y2="23.29" stroke="#737373" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M7.48,5.5a2,2,0,0,0-2,2h0v33a2,2,0,0,0,2,2H40.52a2,2,0,0,0,2-2h0v-33a2,2,0,0,0-2-2H7.48Z" stroke="#737373" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </a>
                    </td>
                    <td style="padding: 0 12px;">
                      <a href="https://www.youtube.com/@snapmydate" target="_blank" title="YouTube" style="display: inline-block;">
                        <svg width="32" height="32" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="none" style="display: block;">
                          <path d="M40.5,5.5H7.5a2,2,0,0,0-2,2v33a2,2,0,0,0,2,2h33a2,2,0,0,0,2-2v-33A2,2,0,0,0,40.5,5.5Z" stroke="#737373" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M19,17v14l12-7Z" stroke="#737373" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                        </svg>
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          <p style="margin: 24px 0 0 0; font-size: 12px; color: #737373; text-align: center;">
            © ${new Date().getFullYear()} Snap My Date. All rights reserved.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>
    `.trim();
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-500",
      queued: "bg-blue-500",
      sending: "bg-yellow-500",
      sent: "bg-green-500",
      failed: "bg-red-500",
      cancelled: "bg-gray-400",
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
    <div
      className="min-h-[100dvh] bg-background text-foreground"
      suppressHydrationWarning
    >
      <div className="max-w-7xl mx-auto p-6" suppressHydrationWarning>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/admin"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Admin
            </Link>
            <span className="text-muted-foreground">/</span>
            <h1 className="text-2xl font-bold text-foreground">
              Email Campaigns
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Send bulk emails to your users using Resend
          </p>
        </div>

        {/* Composer Toggle */}
        <div className="mb-6">
          <button
            onClick={() => setShowComposer(!showComposer)}
            className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:opacity-90 transition-all"
          >
            {showComposer ? "✕ Cancel" : "✉️ New Campaign"}
          </button>
        </div>

        {/* Campaign Composer */}
        {showComposer && (
          <form
            onSubmit={handleSendCampaign}
            className="bg-surface rounded-xl ring-1 ring-border/60 overflow-hidden shadow-sm p-6 mb-8"
          >
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Compose Campaign
            </h2>

            {/* Subject */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Your campaign subject line"
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            {/* Body */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                Email Body <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-muted-foreground mb-2">
                Use{" "}
                <code className="bg-surface-alt px-1 py-0.5 rounded">
                  {"{{greeting}}"}
                </code>{" "}
                for personalized greeting,{" "}
                <code className="bg-surface-alt px-1 py-0.5 rounded">
                  {"{{firstName}} {{lastName}}"}
                </code>{" "}
                for full name
              </p>

              {/* Formatting Toolbar */}
              <div className="flex flex-wrap gap-1 mb-2 p-2 bg-surface-alt/50 rounded-lg border border-border">
                <button
                  type="button"
                  onClick={formatBold}
                  className="px-3 py-1.5 text-sm font-bold rounded hover:bg-surface transition-colors border border-border/50"
                  title="Bold"
                >
                  <strong>B</strong>
                </button>
                <button
                  type="button"
                  onClick={formatItalic}
                  className="px-3 py-1.5 text-sm italic rounded hover:bg-surface transition-colors border border-border/50"
                  title="Italic"
                >
                  <em>I</em>
                </button>
                <button
                  type="button"
                  onClick={formatUnderline}
                  className="px-3 py-1.5 text-sm underline rounded hover:bg-surface transition-colors border border-border/50"
                  title="Underline"
                >
                  U
                </button>
                <div className="w-px h-6 bg-border my-auto mx-1" />
                <button
                  type="button"
                  onClick={formatHeading}
                  className="px-3 py-1.5 text-sm font-semibold rounded hover:bg-surface transition-colors border border-border/50"
                  title="Heading"
                >
                  H
                </button>
                <button
                  type="button"
                  onClick={formatCenter}
                  className="px-3 py-1.5 text-sm rounded hover:bg-surface transition-colors border border-border/50"
                  title="Center align"
                >
                  ≡
                </button>
                <div className="w-px h-6 bg-border my-auto mx-1" />
                <button
                  type="button"
                  onClick={formatLink}
                  className="px-3 py-1.5 text-sm rounded hover:bg-surface transition-colors border border-border/50"
                  title="Insert link"
                >
                  🔗
                </button>
                <button
                  type="button"
                  onClick={formatList}
                  className="px-3 py-1.5 text-sm rounded hover:bg-surface transition-colors border border-border/50"
                  title="Bullet list"
                >
                  • List
                </button>
                <button
                  type="button"
                  onClick={formatNumberedList}
                  className="px-3 py-1.5 text-sm rounded hover:bg-surface transition-colors border border-border/50"
                  title="Numbered list"
                >
                  1. List
                </button>
                <button
                  type="button"
                  onClick={insertLineBreak}
                  className="px-3 py-1.5 text-sm rounded hover:bg-surface transition-colors border border-border/50"
                  title="Line break"
                >
                  ↵
                </button>
                <div className="w-px h-6 bg-border my-auto mx-1" />
                <button
                  type="button"
                  onClick={insertFullName}
                  className="px-3 py-1.5 text-sm rounded hover:bg-surface transition-colors border border-border/50"
                  title="Insert full name ({{firstName}} {{lastName}})"
                >
                  👤 Name
                </button>
                <div className="w-px h-6 bg-border my-auto mx-1" />
                <button
                  type="button"
                  onClick={toggleHtmlMode}
                  className={`px-3 py-1.5 text-sm rounded transition-colors border border-border/50 font-mono ${
                    htmlMode
                      ? "bg-purple-500/20 text-purple-600 dark:text-purple-400 hover:bg-purple-500/30"
                      : "hover:bg-surface"
                  }`}
                  title={
                    htmlMode ? "Switch to visual editor" : "View HTML source"
                  }
                >
                  &lt;/&gt;
                </button>
              </div>

              {htmlMode && (
                <div className="mb-2 px-3 py-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-500/30 rounded-lg">
                  <p className="text-xs text-purple-700 dark:text-purple-300 flex items-center gap-2">
                    <span className="font-semibold">💡 HTML Mode:</span>
                    <span>
                      Write raw HTML code. Use inline styles for best email
                      compatibility.
                    </span>
                  </p>
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
                    ? "border-purple-500/50 focus:ring-purple-500/50 bg-purple-50/5"
                    : "border-border focus:ring-primary"
                }`}
                required
              />
            </div>

            {/* Button (optional) */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Button Text (optional)
                </label>
                <input
                  type="text"
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                  placeholder="Get Started"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Button URL (optional)
                </label>
                <input
                  type="url"
                  value={buttonUrl}
                  onChange={(e) => setButtonUrl(e.target.value)}
                  placeholder="https://snapmydate.com/subscription"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Audience Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                Audience <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {["test", "all", "free", "monthly", "yearly", "FF"].map(
                  (plan) => (
                    <button
                      key={plan}
                      type="button"
                      onClick={() => handlePlanToggle(plan)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        selectedPlans.includes(plan)
                          ? plan === "test"
                            ? "bg-blue-500 text-white shadow-lg"
                            : plan === "all"
                            ? "bg-indigo-600 text-white shadow-lg"
                            : "bg-primary text-white shadow-lg"
                          : "bg-surface-alt text-foreground hover:bg-surface-alt/80"
                      }`}
                    >
                      {plan === "test"
                        ? "📧 Individual"
                        : plan === "all"
                        ? "All users"
                        : plan === "free"
                        ? "Free Trial"
                        : plan === "monthly"
                        ? "Monthly Plan"
                        : plan === "yearly"
                        ? "Yearly Plan"
                        : "Lifetime (FF)"}
                    </button>
                  )
                )}
              </div>

              {/* Individual Recipients Email Input */}
              {selectedPlans.includes("test") && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Recipient Email Addresses{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="email1@example.com, email2@example.com, email3@example.com"
                    rows={3}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-y"
                    required={selectedPlans.includes("test")}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    📧 Enter one or more email addresses (comma-separated).
                    Great for sending to specific recipients or testing before
                    full campaign launch.
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                disabled={!subject || !body || selectedPlans.length === 0}
                className="px-6 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                👁️ Preview Email
              </button>
              <button
                type="button"
                onClick={() => setShowComposer(false)}
                className="px-6 py-2 bg-surface-alt text-foreground rounded-lg font-medium hover:bg-surface-alt/80 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-surface rounded-xl ring-1 ring-border/60 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    Email Preview
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Review your campaign before sending to{" "}
                    {selectedPlans
                      .filter((p) => p !== "test")
                      .map((p) =>
                        p === "all"
                          ? "All users"
                          : p === "free"
                          ? "Free Trial"
                          : p === "monthly"
                          ? "Monthly"
                          : p === "yearly"
                          ? "Yearly"
                          : "Lifetime"
                      )
                      .join(", ") || "your selection"}
                  </p>
                </div>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 rounded-lg hover:bg-surface-alt transition-colors"
                  title="Close preview"
                >
                  <svg
                    className="w-6 h-6 text-muted-foreground"
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
              <div className="flex-1 overflow-auto p-6 bg-surface-alt/30">
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
              <div className="flex items-center justify-between p-6 border-t border-border bg-surface-alt/50">
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-6 py-2 bg-surface-alt text-foreground rounded-lg font-medium hover:bg-surface-alt/80 transition-all"
                >
                  ← Back to Edit
                </button>
                <button
                  onClick={(e) => {
                    setShowPreview(false);
                    handleSendCampaign(e as any);
                  }}
                  disabled={sending}
                  className="px-6 py-2 bg-green-500 text-white rounded-lg font-medium hover:opacity-90 transition-all disabled:opacity-50 shadow-lg"
                >
                  {sending ? "Sending..." : "✓ Approve & Send Campaign"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Campaign History */}
        <div className="bg-surface rounded-xl ring-1 ring-border/60 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">
              Campaign History
            </h2>
          </div>

          {loading ? (
            <div className="p-6">Loading campaigns...</div>
          ) : campaigns.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              No campaigns yet. Create your first one above!
            </div>
          ) : (
            <div className="divide-y divide-border">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="p-6 hover:bg-surface-alt/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">
                        {campaign.subject}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        by{" "}
                        {campaign.creator.firstName || campaign.creator.email}
                      </p>
                    </div>
                    {getStatusBadge(campaign.status)}
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Recipients:</span>{" "}
                      <span className="font-medium">
                        {campaign.recipientCount}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Sent:</span>{" "}
                      <span className="font-medium text-green-600">
                        {campaign.sentCount}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Failed:</span>{" "}
                      <span className="font-medium text-red-600">
                        {campaign.failedCount}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="text-xs text-muted-foreground">
                      {campaign.sentAt
                        ? `Sent ${new Date(campaign.sentAt).toLocaleString()}`
                        : `Created ${new Date(
                            campaign.createdAt
                          ).toLocaleString()}`}
                    </div>
                    <button
                      onClick={() => {
                        // Copy campaign content to form
                        setSubject(campaign.subject);
                        setBody(campaign.bodyHtml);
                        setShowComposer(true);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-surface hover:bg-surface-alt border border-border transition-colors flex items-center gap-1.5"
                      title="Copy this campaign to create a new one"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      Copy & Reuse
                    </button>
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
