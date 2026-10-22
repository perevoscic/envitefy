"use client";

import EmailPreviewFrame from "@/components/admin/EmailPreviewFrame";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAdminAccess } from "@/components/admin/AdminAccessProvider";
import { FEATURES_OCT26_SUBJECT, renderFeaturesEmail } from "@/lib/email-templates/features-oct26";

const EDITOR_HANDOFF_KEY = "envitefy:admin:email-editor:handoff";

export default function FeaturesEmailPreviewPage() {
  const { status, isAdmin } = useAdminAccess();
  const router = useRouter();
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const html = useMemo(() => {
    return renderFeaturesEmail({
      baseUrl: origin || "https://envitefy.com",
    });
  }, [origin]);

  async function copyHtml() {
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function openInEditor() {
    try {
      sessionStorage.setItem(
        EDITOR_HANDOFF_KEY,
        JSON.stringify({ emailDesignVersion: "adaptive-v1", subject: FEATURES_OCT26_SUBJECT, html }),
      );
    } catch {}
    router.push("/admin/emails/editor?from=features");
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

  return (
    <div
      className="min-h-[100dvh] bg-gradient-to-br from-[#ffffff] via-[#f6f3ff] to-[#f1ecff] text-[#3f3269] transition-colors dark:bg-none dark:bg-background"
      suppressHydrationWarning
    >
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6" suppressHydrationWarning>
        <div className="flex flex-col gap-2 pt-8" suppressHydrationWarning>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/emails"
              className="text-[#8c80b6] hover:text-[#43366f] transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </Link>
            <h1
              className="text-2xl font-bold bg-gradient-to-r from-[#6f57c8] to-[#9278e3] bg-clip-text text-transparent dark:bg-none dark:text-foreground"
              suppressHydrationWarning
            >
              ✨ Envitefy Features Campaign
            </h1>
          </div>
          <p className="text-sm text-[#8c80b6] ml-9" suppressHydrationWarning>
            Snap, Live Cards, Event Pages, Sign-up Forms and RSVP &amp; Registry. Images ship from{" "}
            <code className="bg-[#f2edff] px-1 py-0.5 rounded text-[#5f49bb]">
              /email/features-oct26/
            </code>
            .
          </p>
        </div>

        <section suppressHydrationWarning>
          <div className="bg-white rounded-xl border border-[#ddd5f6] ring-1 ring-[#ede7ff] overflow-hidden shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-[#e4def9] bg-[#faf8ff]">
              <div>
                <h2 className="text-lg font-semibold text-[#43366f]">Email Preview</h2>
                <p className="text-xs text-[#8c80b6] mt-0.5">
                  Subject:{" "}
                  <span className="font-semibold text-[#5f49bb]">{FEATURES_OCT26_SUBJECT}</span>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={copyHtml}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#f6f2ff] hover:bg-[#eee7ff] border border-[#d8d0f3] transition-colors text-[#4b3f72]"
                >
                  {copied ? "Copied!" : "Copy HTML"}
                </button>
                <button
                  type="button"
                  onClick={openInEditor}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#7f67d3] hover:bg-[#6f57c8] text-white transition-colors dark:bg-primary dark:text-primary-foreground dark:hover:bg-[var(--primary-hover)]"
                >
                  ✎ Edit & send in HTML editor
                </button>
              </div>
            </div>
            <div className="p-6">
              <EmailPreviewFrame
                srcDoc={html}
                className="w-full border border-[#ddd5f6] rounded-lg bg-white"
                style={{ height: "900px" }}
                title="Features Email Preview"
                suppressHydrationWarning
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
