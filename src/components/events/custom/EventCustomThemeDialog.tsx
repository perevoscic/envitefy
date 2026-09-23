"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, Sparkles, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import AuthModal from "@/components/auth/AuthModal";
import {
  CUSTOM_EVENT_CATEGORIES,
  type CustomEventCategory,
  type CustomEventPage,
  EVENT_DESIGN_PROMPT_LIMIT,
  EVENT_DESIGN_REFERENCE_LIMIT,
  normalizeCustomEventPage,
} from "@/lib/event-custom-design";
import CustomEventPageContent from "./CustomEventPageContent";
import styles from "./custom-event.module.css";

export default function EventCustomThemeDialog({
  category,
  initialPage,
  initialMessage,
  onClose,
  onUseDesign,
}: {
  category: CustomEventCategory;
  initialPage?: CustomEventPage;
  initialMessage?: string;
  onClose: () => void;
  onUseDesign: (page: CustomEventPage) => void;
}) {
  const { status, update } = useSession();
  const [prompt, setPrompt] = useState("");
  const [reference, setReference] = useState<{ dataUrl: string; name: string } | null>(null);
  const [referenceMode, setReferenceMode] = useState<"use" | "inspire">("use");
  const [candidate, setCandidate] = useState(initialPage || null);
  const [history, setHistory] = useState<CustomEventPage[]>([]);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const request = useRef<AbortController | null>(null);
  const reader = useRef<FileReader | null>(null);
  const promptInput = useRef<HTMLTextAreaElement>(null);
  const previewHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (authOpen || busy) return;
    if (preview) previewHeading.current?.focus();
    else promptInput.current?.focus();
  }, [authOpen, busy, preview]);
  useEffect(
    () => () => {
      request.current?.abort();
      reader.current?.abort();
    },
    [],
  );
  useEffect(() => {
    const before = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = before;
    };
  }, []);
  useEffect(() => {
    if (!prompt && !reference && !candidate) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [prompt, reference, candidate]);
  const chooseImage = (file?: File) => {
    reader.current?.abort();
    setReading(false);
    setError("");
    if (!file) return;
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > EVENT_DESIGN_REFERENCE_LIMIT
    ) {
      setError("Choose a PNG, JPG or WebP image smaller than 2 MB.");
      return;
    }
    const next = new FileReader();
    reader.current = next;
    setReading(true);
    next.onload = () => {
      if (reader.current !== next) return;
      if (typeof next.result === "string") {
        setReference({ dataUrl: next.result, name: file.name });
        setReferenceMode("use");
      }
      setReading(false);
    };
    next.onerror = () => {
      setError("That image could not be opened. Try another.");
      setReading(false);
    };
    next.readAsDataURL(file);
  };
  const generate = async () => {
    if (request.current || reading) return;
    setError("");
    if (prompt.trim().length < 5) {
      setError("Describe the design you have in mind.");
      return;
    }
    if (status !== "authenticated") {
      setAuthOpen(true);
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    try {
      const response = await fetch("/api/event-themes/generate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          category,
          prompt,
          referenceImage: reference?.dataUrl,
          referenceImageMode: referenceMode,
          currentDesign: candidate?.design,
          currentDetails: candidate?.details,
        }),
      });
      const result = await response.json();
      if (response.status === 401) {
        setAuthOpen(true);
        return;
      }
      if (!response.ok)
        throw new Error(result.error || "Your design could not be generated. Please try again.");
      const next = normalizeCustomEventPage(result);
      if (!next || next.category !== category)
        throw new Error("The design could not be read. Please try again.");
      if (controller.signal.aborted) return;
      if (candidate) setHistory((previous) => [...previous.slice(-2), candidate]);
      setCandidate(candidate ? { ...next, details: candidate.details } : next);
      setPreview(true);
      setPrompt("");
    } catch (failure) {
      if (!controller.signal.aborted)
        setError(failure instanceof Error ? failure.message : "Please try again.");
    } finally {
      if (request.current === controller) {
        request.current = null;
        setBusy(false);
      }
    }
  };
  const close = () => {
    request.current?.abort();
    reader.current?.abort();
    onClose();
  };
  return (
    <>
      <Dialog.Root
        open={!authOpen}
        onOpenChange={(open) => {
          if (!open) close();
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className={styles.overlay} />
          <Dialog.Content className={styles.dialog}>
            <header className={styles.dialogHeader}>
              <div>
                <Dialog.Title ref={previewHeading} tabIndex={-1}>
                  {preview ? "Your custom event page" : "Create with Envitefy"}
                </Dialog.Title>
                <Dialog.Description>
                  {preview
                    ? "Preview your design, then make the details yours in the editor."
                    : `${CUSTOM_EVENT_CATEGORIES[category]} · Describe your idea and add an optional image.`}
                </Dialog.Description>
              </div>
              <button
                type="button"
                className={styles.close}
                aria-label="Close custom design dialog"
                onClick={close}
              >
                <X size={20} />
              </button>
            </header>
            <div className={styles.dialogBody}>
              {error && (
                <p role="alert" className={styles.error}>
                  {error}
                </p>
              )}
              {initialMessage && !candidate && <p className={styles.notice}>{initialMessage}</p>}
              {preview && candidate ? (
                <CustomEventPageContent page={candidate} />
              ) : (
                <div className={styles.brief}>
                  <label className={styles.field}>
                    {candidate ? "Describe a design change" : "Describe your event and design"}
                    <textarea
                      ref={promptInput}
                      rows={6}
                      maxLength={EVENT_DESIGN_PROMPT_LIMIT}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      disabled={busy}
                      placeholder={
                        candidate
                          ? "Try a darker palette with gold accents…"
                          : "Tell us the occasion, colors and mood, plus any event details you already know…"
                      }
                    />
                  </label>
                  {candidate && (
                    <p className={styles.notice}>
                      Your event details stay the same. You can edit them after choosing your
                      design.
                    </p>
                  )}
                  <label className={styles.field}>
                    Reference image (optional)
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      disabled={busy}
                      onChange={(e) => chooseImage(e.target.files?.[0])}
                    />
                    <span className={styles.notice}>PNG, JPG or WebP, up to 2 MB.</span>
                  </label>
                  {reference && (
                    <div className={styles.reference}>
                      <img src={reference.dataUrl} alt="Your design reference" />
                      <div>
                        <p>{reference.name}</p>
                        <label className={styles.check}>
                          <input
                            type="radio"
                            name="reference-mode"
                            checked={referenceMode === "use"}
                            disabled={busy}
                            onChange={() => setReferenceMode("use")}
                          />
                          Use this image
                        </label>
                        <label className={styles.check}>
                          <input
                            type="radio"
                            name="reference-mode"
                            checked={referenceMode === "inspire"}
                            disabled={busy}
                            onChange={() => setReferenceMode("inspire")}
                          />
                          Use as inspiration
                        </label>
                        <button
                          type="button"
                          className={styles.secondary}
                          disabled={busy}
                          onClick={() => setReference(null)}
                        >
                          Remove image
                        </button>
                      </div>
                    </div>
                  )}
                  {busy && (
                    <p role="status" className={styles.notice}>
                      Creating your page design and artwork. This can take a few minutes…
                    </p>
                  )}
                </div>
              )}
            </div>
            <footer className={styles.dialogFooter}>
              {preview && candidate ? (
                <>
                  {history.length > 0 && (
                    <button
                      className={styles.secondary}
                      type="button"
                      onClick={() => {
                        setCandidate(history[history.length - 1]);
                        setHistory((previous) => previous.slice(0, -1));
                      }}
                    >
                      Previous design
                    </button>
                  )}
                  <button
                    className={styles.secondary}
                    type="button"
                    onClick={() => setPreview(false)}
                  >
                    Describe a change
                  </button>
                  <button
                    className={styles.primary}
                    type="button"
                    onClick={() => onUseDesign(candidate)}
                  >
                    Use this design
                  </button>
                </>
              ) : (
                <>
                  {candidate && (
                    <button
                      className={styles.secondary}
                      type="button"
                      disabled={busy}
                      onClick={() => setPreview(true)}
                    >
                      <ArrowLeft size={16} className="inline" /> Back to preview
                    </button>
                  )}
                  <button
                    className={styles.primary}
                    type="button"
                    disabled={busy || reading || status === "loading"}
                    onClick={() => void generate()}
                  >
                    <Sparkles size={16} />
                    {busy ? "Creating…" : candidate ? "Update design" : "Create with Envitefy"}
                  </button>
                </>
              )}
            </footer>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <AuthModal
        open={authOpen}
        mode={authMode}
        onModeChange={setAuthMode}
        onClose={() => setAuthOpen(false)}
        allowGoogleAuth={false}
        description="Sign in to create your event page. Your idea stays here."
        onAuthenticated={async () => {
          await update();
          setAuthOpen(false);
        }}
      />
    </>
  );
}
