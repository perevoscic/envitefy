"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, ImagePlus, Sparkles, Undo2, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import AuthModal from "@/components/auth/AuthModal";
import {
  applySignupCustomTheme,
  captureSignupTheme,
  normalizeSignupCustomTheme,
  restoreSignupTheme,
  SIGNUP_CUSTOM_THEME_PROMPT_LIMIT,
  SIGNUP_CUSTOM_THEME_REFERENCE_LIMIT,
  type SignupThemeProposal,
} from "@/lib/signup-custom-theme";
import { applySignupThemeDetails, normalizeSignupThemeDetails } from "@/lib/signup-theme-brief";
import type { SignupForm, SignupHeaderImageAsset } from "@/types/signup";
import SignupPageRenderer from "./SignupPageRenderer";
import custom from "./signup-custom-theme.module.css";

export default function SignupCustomThemeDialog({
  form,
  onUseTheme,
  onClose,
  isNew = false,
  initialMessage = "",
}: {
  form: SignupForm;
  onUseTheme: (theme: SignupThemeProposal) => void;
  onClose: () => void;
  isNew?: boolean;
  initialMessage?: string;
}) {
  const { status, update } = useSession();
  const id = useId();
  const [prompt, setPrompt] = useState("");
  const [reference, setReference] = useState<{ dataUrl: string; name: string } | null>(null);
  const [referenceMode, setReferenceMode] = useState<"use" | "inspire">("use");
  const [readingImage, setReadingImage] = useState(false);
  const [keepArtwork, setKeepArtwork] = useState(!isNew);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(initialMessage);
  const [candidate, setCandidate] = useState<SignupThemeProposal | null>(null);
  const [stage, setStage] = useState<"brief" | "preview">("brief");
  const opener = useRef<HTMLElement | null>(null);
  const promptInput = useRef<HTMLTextAreaElement>(null);
  const previewHeading = useRef<HTMLHeadingElement>(null);
  const [history, setHistory] = useState<SignupThemeProposal[]>([]);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const request = useRef<AbortController | null>(null);
  const reader = useRef<FileReader | null>(null);
  const preview = useMemo(
    () =>
      candidate
        ? applySignupThemeDetails(
            restoreSignupTheme(form, candidate),
            isNew ? candidate.details : undefined,
          )
        : form,
    [candidate, form, isNew],
  );
  const latest = useRef(preview);
  latest.current = preview;
  const hasArtwork = Boolean(preview.header?.backgroundImage || preview.header?.images?.length);
  const previewForm: SignupForm = isNew
    ? {
        ...preview,
        title: preview.title || "Your event title",
        description: preview.description || "A little welcome, in your own words.",
      }
    : preview;
  useEffect(() => {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    // This app scrolls the root element; Radix also locks body scrolling.
    const overflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = overflow;
    };
  }, []);
  useEffect(() => {
    if (!authOpen && !busy) {
      if (stage === "preview") previewHeading.current?.focus();
      else promptInput.current?.focus();
    }
  }, [stage, authOpen, busy]);
  useEffect(
    () => () => {
      request.current?.abort();
      reader.current?.abort();
    },
    [],
  );
  useEffect(() => {
    if (!prompt.trim() && !reference && !candidate && !busy) return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [prompt, reference, candidate, busy]);

  const chooseImage = (file?: File) => {
    reader.current?.abort();
    setReadingImage(false);
    if (!file) return;
    setError("");
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > SIGNUP_CUSTOM_THEME_REFERENCE_LIMIT
    ) {
      setError("Choose a PNG, JPG or WebP inspiration image smaller than 2 MB.");
      return;
    }
    const next = new FileReader();
    reader.current = next;
    setReadingImage(true);
    next.onload = () => {
      if (reader.current !== next) return;
      if (typeof next.result === "string") {
        setReference({ dataUrl: next.result, name: file.name });
        setKeepArtwork(false);
        setReferenceMode("use");
      }
      setReadingImage(false);
    };
    next.onerror = () => {
      setError("That image could not be opened. Please try another.");
      setReadingImage(false);
    };
    next.readAsDataURL(file);
  };

  const generate = async () => {
    if (request.current || readingImage) return;
    setError("");
    setNotice("");
    if (prompt.trim().length < 5) {
      setError("Describe the theme or changes you have in mind.");
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
      const appearance = latest.current.appearance;
      const currentTheme = appearance?.customTheme
        ? {
            ...appearance.customTheme,
            fontPair: appearance.fontPair,
            colors: {
              ...appearance.customTheme.colors,
              accent:
                appearance.accent ||
                (appearance.palette === "ink"
                  ? appearance.customTheme.colors.ink
                  : appearance.customTheme.colors.accent),
              page:
                appearance.palette === "soft"
                  ? appearance.customTheme.colors.soft
                  : appearance.customTheme.colors.page,
            },
          }
        : null;
      const response = await fetch("/api/signup-themes/generate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          prompt,
          currentTheme,
          generateArtwork: !keepArtwork || !hasArtwork,
          referenceImage: reference?.dataUrl,
          referenceImageMode: referenceMode,
          includeContent: isNew,
          currentDetails: isNew ? candidate?.details : undefined,
        }),
      });
      const body: unknown = await response.json().catch(() => null);
      if (!body || typeof body !== "object")
        throw new Error("The theme service couldn't respond. Please try again.");
      const result = body as Record<string, unknown>;
      if (response.status === 401) {
        setAuthOpen(true);
        return;
      }
      if (!response.ok)
        throw new Error(
          typeof result.error === "string"
            ? result.error
            : "Your theme couldn't be generated. Please try again.",
        );
      const theme = normalizeSignupCustomTheme(result.theme);
      if (!theme) throw new Error("This theme could not be read. Please try again.");
      const details =
        isNew && result.details != null ? normalizeSignupThemeDetails(result.details) : undefined;
      if (details === null)
        throw new Error("The event details could not be read. Please try again.");
      let artwork: SignupHeaderImageAsset | undefined;
      if (result.artwork && typeof result.artwork === "object") {
        const image = result.artwork as Record<string, unknown>;
        if (
          typeof image.dataUrl !== "string" ||
          !/^data:image\/webp;base64,[A-Za-z0-9+/=]+$/.test(image.dataUrl)
        )
          throw new Error("The artwork could not be read. Please try again.");
        artwork = {
          name: `${theme.name}.webp`,
          type: "image/webp",
          dataUrl: image.dataUrl,
          width: typeof image.width === "number" ? image.width : undefined,
          height: typeof image.height === "number" ? image.height : undefined,
        };
      }
      if ((!keepArtwork || !hasArtwork) && !artwork)
        throw new Error("The artwork wasn't returned. Please try again.");
      if (controller.signal.aborted) return;
      const current = latest.current;
      if (candidate) setHistory((previous) => [...previous.slice(-4), candidate]);
      const next = applySignupCustomTheme(current, theme, artwork);
      // A supplied photo or flag must keep its original colors, not inherit a theme tint.
      if (result.artworkSource === "reference" && next.appearance) {
        next.appearance.imageFilterEnabled = false;
        next.appearance.imageFit = "contain";
      }
      setCandidate({
        ...captureSignupTheme(next),
        ...(isNew ? { details: { ...candidate?.details, ...details } } : {}),
      });
      setKeepArtwork(true);
      setReference(null);
      setPrompt("");
      setNotice("");
      setStage("preview");
    } catch (failure) {
      if (!controller.signal.aborted)
        setError(
          failure instanceof Error
            ? failure.message
            : "Your theme couldn't be generated. Please try again.",
        );
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
          <Dialog.Overlay className={custom.overlay} />
          <Dialog.Content
            className={`${custom.dialog} ${stage === "preview" && !busy ? custom.previewDialog : ""}`}
            onPointerDownOutside={(event) => event.preventDefault()}
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              (stage === "preview" ? previewHeading.current : promptInput.current)?.focus();
            }}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              if (!authOpen) opener.current?.focus();
            }}
          >
            <header className={custom.header}>
              <div>
                <p className={custom.eyebrow}>
                  <Sparkles size={15} aria-hidden /> Envitefy Create
                </p>
                <Dialog.Title ref={previewHeading} tabIndex={-1} className={custom.title}>
                  {busy
                    ? "Creating your theme"
                    : stage === "preview"
                      ? "Your custom theme"
                      : candidate
                        ? "What would you like to change?"
                        : "What should your sign-up look like?"}
                </Dialog.Title>
                <Dialog.Description className={custom.description}>
                  {busy
                    ? "Bringing your colors, artwork and layout together."
                    : stage === "preview"
                      ? preview.appearance?.customTheme?.name
                      : isNew
                        ? "Share your idea, event details, or an example you love."
                        : "Describe the look you have in mind. We’ll take it from there."}
                </Dialog.Description>
              </div>
              <button
                type="button"
                className={custom.close}
                onClick={close}
                aria-label="Close custom theme dialog"
              >
                <X size={22} aria-hidden />
              </button>
            </header>
            <div className={custom.body}>
              {busy ? (
                <div className={custom.loading} role="status" aria-live="polite">
                  <div className={custom.loadingVisual} aria-hidden="true">
                    <div className={custom.loadingPaper}>
                      <div className={custom.loadingPaperTop}>
                        <i />
                        <i />
                        <i />
                      </div>
                      <div className={custom.loadingArtwork}>
                        <span />
                        <span />
                      </div>
                      <div className={custom.loadingHeading} />
                      <div className={custom.loadingText} />
                      <div className={custom.loadingText} />
                      <div className={custom.loadingSlots}>
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                    <div className={custom.loadingPalette}>
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>
                    <div className={custom.loadingType}>
                      Aa<span>Made for you</span>
                    </div>
                    <span className={custom.loadingSparkle}>
                      <Sparkles size={22} />
                    </span>
                  </div>
                  <h3>Making your idea take shape</h3>
                  <div className={custom.loadingTrack} aria-hidden="true">
                    <span />
                  </div>
                  <p>Your preview will appear here. This can take a couple of minutes.</p>
                  <button
                    type="button"
                    className={custom.secondary}
                    onClick={() => {
                      request.current?.abort();
                      setNotice("Generation cancelled. You can adjust your idea and try again.");
                    }}
                  >
                    Cancel generation
                  </button>
                </div>
              ) : stage === "preview" && candidate ? (
                <div className={custom.preview}>
                  <SignupPageRenderer form={previewForm} imageLoading="eager">
                    {isNew && !preview.sections.length ? (
                      <div className={custom.placeholder}>
                        <h3>Your signup sections</h3>
                        <p>Add roles, items or times after choosing your theme.</p>
                        <div aria-hidden className={custom.placeholderLines}>
                          <span />
                          <span />
                          <span />
                        </div>
                      </div>
                    ) : undefined}
                  </SignupPageRenderer>
                </div>
              ) : (
                <div className={custom.brief}>
                  <label className={custom.label} htmlFor={`${id}-prompt`}>
                    {candidate
                      ? "Describe a change"
                      : isNew
                        ? "Your idea or event description"
                        : "Your design idea"}
                  </label>
                  <textarea
                    ref={promptInput}
                    id={`${id}-prompt`}
                    className={custom.prompt}
                    rows={5}
                    value={prompt}
                    maxLength={SIGNUP_CUSTOM_THEME_PROMPT_LIMIT}
                    aria-describedby={`${id}-help`}
                    placeholder={
                      candidate
                        ? "Make it more elegant, with softer colors…"
                        : "Tell us what you’re organizing, paste an existing sign-up, or describe the style you want…"
                    }
                    onChange={(event) => setPrompt(event.target.value)}
                  />
                  <p id={`${id}-help`} className={custom.help}>
                    {isNew
                      ? "Paste an event description too. We’ll include the details you provide and leave anything missing for you to fill in."
                      : "Your event details and signup sections will stay as you entered them."}
                  </p>
                  <div className={custom.reference}>
                    <label className={custom.upload} htmlFor={`${id}-reference`}>
                      <ImagePlus size={18} aria-hidden />
                      {reference ? "Change reference image" : "Add a photo or reference"}
                      <span className={custom.optional}>Optional</span>
                      <input
                        id={`${id}-reference`}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(event) => {
                          chooseImage(event.target.files?.[0]);
                          event.target.value = "";
                        }}
                      />
                    </label>
                    {readingImage && <p role="status">Opening image…</p>}
                    {reference && (
                      <div className={custom.referencePreview}>
                        <img
                          src={reference.dataUrl}
                          alt="Your design reference"
                          width={56}
                          height={56}
                        />
                        <span>{reference.name}</span>
                        <button type="button" onClick={() => setReference(null)}>
                          Remove
                        </button>
                      </div>
                    )}
                    {reference && (
                      <fieldset className={custom.imageChoices}>
                        <legend>How should we use this image?</legend>
                        <label>
                          <input
                            type="radio"
                            name={`${id}-image-mode`}
                            checked={referenceMode === "use"}
                            onChange={() => {
                              setReferenceMode("use");
                              setKeepArtwork(false);
                            }}
                          />
                          <span>
                            <strong>Use this image</strong>
                            <small>Keep it as the artwork, in its original colors.</small>
                          </span>
                        </label>
                        <label>
                          <input
                            type="radio"
                            name={`${id}-image-mode`}
                            checked={referenceMode === "inspire"}
                            onChange={() => {
                              setReferenceMode("inspire");
                              setKeepArtwork(false);
                            }}
                          />
                          <span>
                            <strong>Use as inspiration</strong>
                            <small>
                              For screenshots or a new take on the same subject and style.
                            </small>
                          </span>
                        </label>
                      </fieldset>
                    )}
                    <p className={custom.help}>PNG, JPG or WebP, up to 2 MB.</p>
                  </div>
                  {hasArtwork && !reference && (
                    <label className={custom.check}>
                      <input
                        type="checkbox"
                        checked={keepArtwork}
                        onChange={(event) => setKeepArtwork(event.target.checked)}
                      />
                      Keep my current artwork
                    </label>
                  )}
                  {status === "unauthenticated" && (
                    <p className={custom.help}>
                      Sign in to generate. Your idea stays here while you sign in.
                    </p>
                  )}
                  {notice && (
                    <p role="status" className={custom.help}>
                      {notice}
                    </p>
                  )}
                  {error && (
                    <p role="alert" className={custom.error}>
                      {error}
                    </p>
                  )}
                </div>
              )}
            </div>
            {!busy && (
              <footer className={custom.footer}>
                {stage === "preview" && candidate ? (
                  <>
                    <div className={custom.previewActions}>
                      <button
                        type="button"
                        className={custom.secondary}
                        onClick={() => setStage("brief")}
                      >
                        <ArrowLeft size={16} aria-hidden /> Describe a change
                      </button>
                      {history.length > 0 && (
                        <button
                          type="button"
                          className={custom.quiet}
                          onClick={() => {
                            setCandidate(history.at(-1)!);
                            setHistory(history.slice(0, -1));
                          }}
                        >
                          <Undo2 size={16} aria-hidden /> Previous design
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      className={custom.primary}
                      onClick={() => onUseTheme(candidate)}
                    >
                      Use this theme →
                    </button>
                  </>
                ) : (
                  <>
                    {candidate ? (
                      <button
                        type="button"
                        className={custom.quiet}
                        onClick={() => setStage("preview")}
                      >
                        <ArrowLeft size={16} aria-hidden /> Back to preview
                      </button>
                    ) : (
                      <p className={custom.footerNote}>
                        {isNew
                          ? "Review your design and details before continuing."
                          : "Review the new look before applying it."}
                      </p>
                    )}
                    <button
                      type="button"
                      className={custom.primary}
                      disabled={readingImage || status === "loading"}
                      onClick={generate}
                    >
                      <Sparkles size={16} aria-hidden />{" "}
                      {candidate ? "Update theme" : "Create with Envitefy"}
                    </button>
                  </>
                )}
              </footer>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <AuthModal
        open={authOpen}
        mode={authMode}
        onModeChange={setAuthMode}
        onClose={() => setAuthOpen(false)}
        allowGoogleAuth={false}
        signupSource="signup_forms"
        signupIntent="signup_forms"
        description="Sign in to create your custom theme. Your design idea stays here."
        onAuthenticated={async () => {
          await update();
          setAuthOpen(false);
        }}
      />
    </>
  );
}
