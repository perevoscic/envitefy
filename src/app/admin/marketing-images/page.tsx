"use client";

import { ArrowLeft, History, Loader2, Pencil, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import {
  buttonClass,
  fieldClass,
  primaryClass,
  SettingsDrawer,
  StudioDrawer,
  StudioPreview,
} from "./studio-components";
import { StudioLibrary } from "./studio-library";
import { StudioComposer } from "./studio-composer";
import { useContentStudio } from "./use-content-studio";
import styles from "./studio.module.css";

export default function ContentStudioPage() {
  const studio = useContentStudio();
  const [view, setView] = useState<"create" | "library">("create");
  const [mobileView, setMobileView] = useState<"conversation" | "preview">("conversation");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [title, setTitle] = useState("");
  const composer = useRef<HTMLTextAreaElement>(null);
  const busy = Boolean(studio.sending || studio.activeVersion || studio.uploading);
  const hasHistory = Boolean(studio.conversation?.messages.length);
  const messages = studio.conversation?.messages || [];

  function suggest(text: string) {
    studio.setDraft(text);
    window.requestAnimationFrame(() => composer.current?.focus());
  }
  function focusConversation() {
    setMobileView("conversation");
    window.requestAnimationFrame(() => composer.current?.focus());
  }
  async function sendCreation() {
    if (await studio.send()) setMobileView("preview");
  }
  async function startNew() {
    await studio.newConversation();
    setView("create");
    setMobileView("conversation");
    composer.current?.focus();
  }
  async function open(id: string) {
    setView("create");
    setMobileView("preview");
    await studio.openConversation(id);
  }

  return (
    <div className={`${styles.studio} mx-auto max-w-[1450px] pb-8 text-slate-900`}>
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/admin"
            className={`${buttonClass} border border-slate-200 bg-white px-3`}
            aria-label="Back to admin dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="mb-0.5 text-[11px] font-medium tracking-wide text-slate-400">
              ENVITEFY / MARKETING
            </div>
            <h1 className="font-sans text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
              Content Studio<span className="text-violet-500">.</span>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-5">
          <nav
            aria-label="Content studio"
            className="flex rounded-xl border border-slate-200 bg-white p-1"
          >
            {(["create", "library"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setView(tab);
                  if (tab === "library") void studio.loadLibrary();
                }}
                aria-pressed={view === tab}
                className={`min-h-10 rounded-lg px-4 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${view === tab ? "bg-slate-100 text-slate-950" : "text-slate-500 hover:text-slate-800"}`}
              >
                {tab === "create" ? "Create" : "Library"}
              </button>
            ))}
          </nav>
          <button
            type="button"
            className={`${buttonClass} border border-slate-200 bg-white`}
            onClick={() => {
              void startNew();
            }}
            disabled={studio.loading || studio.sending || studio.uploading}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New creation</span>
            <span className="sr-only sm:hidden">New creation</span>
          </button>
        </div>
      </header>

      {view === "library" ? (
        <StudioLibrary
          studio={studio}
          onOpen={(id) => {
            void open(id);
          }}
          onNew={() => {
            void startNew();
          }}
        />
      ) : (
        <div className="grid items-start gap-5 py-5 lg:grid-cols-[minmax(340px,0.8fr)_minmax(0,1.2fr)] lg:gap-8 lg:py-7 xl:grid-cols-[minmax(360px,0.72fr)_minmax(0,1.28fr)]">
          <div
            className="flex rounded-xl border border-slate-200 bg-white p-1 lg:hidden"
            role="group"
            aria-label="Creation view"
          >
            {(["conversation", "preview"] as const).map((panel) => (
              <button
                type="button"
                key={panel}
                onClick={() => setMobileView(panel)}
                aria-pressed={mobileView === panel}
                aria-controls={`studio-${panel}-panel`}
                className={`min-h-11 flex-1 rounded-lg px-4 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${mobileView === panel ? "bg-violet-50 text-violet-700" : "text-slate-500 hover:bg-slate-50"}`}
              >
                {panel === "conversation" ? "Conversation" : "Preview"}
              </button>
            ))}
          </div>
          <section
            id="studio-conversation-panel"
            className={`${mobileView === "conversation" ? "block" : "hidden"} min-w-0 lg:block`}
            aria-label="Creative conversation"
          >
            {studio.loading ? (
              <div
                role="status"
                className="flex min-h-52 items-center justify-center gap-2 text-sm text-slate-500"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                Opening your studio…
              </div>
            ) : (
              <>
                {hasHistory ? (
                  <div className="mb-5">
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setTitle(studio.conversation?.title || "");
                          setRenameOpen(true);
                        }}
                        className="group flex min-h-11 min-w-0 items-start gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                      >
                        <h2 className="font-sans line-clamp-2 text-xl font-semibold leading-7 tracking-tight text-slate-900">
                          {studio.conversation?.title || "Your creation"}
                        </h2>
                        <Pencil className="mt-1.5 h-3.5 w-3.5 shrink-0 text-slate-300 group-hover:text-violet-500" />
                        <span className="sr-only">Rename creation</span>
                      </button>
                      <button
                        type="button"
                        className={buttonClass}
                        onClick={() => setHistoryOpen(true)}
                        aria-label="Open conversation history"
                      >
                        <History className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      Keep the idea going. Every version is saved.
                    </p>
                  </div>
                ) : (
                  <div className="mb-5 pt-1">
                    <div className="mb-3 inline-flex items-center gap-2 text-xs font-medium text-violet-600">
                      <Sparkles className="h-4 w-4" />
                      Your creative space
                    </div>
                    <h2 className="font-sans max-w-sm text-[26px] font-semibold leading-tight tracking-tight text-slate-950 sm:text-[28px]">
                      What would you like to create?
                    </h2>
                    <p className="mt-3 max-w-sm text-sm leading-6 text-slate-500">
                      Start with a thought. Turn it into a prompt, image, or video. Then make it
                      yours.
                    </p>
                  </div>
                )}

                {hasHistory && (
                  <div
                    className="mb-4 max-h-[220px] space-y-4 overflow-y-auto pr-1 lg:max-h-[clamp(96px,calc(100dvh-720px),220px)]"
                    aria-label="Recent conversation"
                    role="region"
                  >
                    {messages.length > 4 && (
                      <button
                        type="button"
                        onClick={() => setHistoryOpen(true)}
                        className="min-h-11 text-xs font-medium text-slate-500 hover:text-violet-700"
                      >
                        View earlier messages
                      </button>
                    )}
                    {messages.slice(-4).map((message) => (
                      <div
                        key={message.id}
                        className={
                          message.role === "user"
                            ? "ml-5 rounded-2xl rounded-br-sm border border-slate-200 bg-white px-4 py-3"
                            : "px-1 py-1"
                        }
                      >
                        {message.role === "assistant" && (
                          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-violet-600">
                            <Sparkles className="h-3.5 w-3.5" />
                            Studio
                          </p>
                        )}
                        <p className="line-clamp-4 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                          {message.text}
                        </p>
                        {message.versionId && message.role === "assistant" && (
                          <button
                            type="button"
                            className="mt-2 min-h-8 text-xs font-medium text-violet-600"
                            onClick={() => {
                              if (message.versionId) void studio.selectVersion(message.versionId);
                            }}
                          >
                            View version →
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <StudioComposer
                  studio={studio}
                  composerRef={composer}
                  onSubmit={sendCreation}
                  onSettingsOpen={() => setSettingsOpen(true)}
                />
                {!hasHistory && (
                  <div className="mt-7">
                    <p className="mb-3 text-xs font-medium text-slate-400">
                      Need a starting point?
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        {
                          label: "Make event planning feel easy",
                          text: "Show how Envitefy makes planning an event feel easy: one beautiful event page for all the details, without the back-and-forth messages.",
                        },
                        {
                          label: "Give me a scroll-stopping hook",
                          text: "Create a playful, scroll-stopping idea about replacing chaotic event group chats with one simple Envitefy link.",
                        },
                      ].map((idea) => (
                        <button
                          type="button"
                          key={idea.label}
                          onClick={() => suggest(idea.text)}
                          className="min-h-10 rounded-xl border border-slate-200 bg-white/60 px-3 py-2 text-left text-xs leading-5 text-slate-500 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                        >
                          {idea.label}
                          <span className="ml-2 text-slate-300">↗</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {hasHistory && !busy && (
                  <div
                    className="mt-5 flex flex-wrap gap-2"
                    aria-label="Refinement ideas"
                    role="group"
                  >
                    {[
                      "Make it more playful",
                      "Try a different visual direction",
                      "Use less text",
                    ].map((text) => (
                      <button
                        type="button"
                        key={text}
                        onClick={() => suggest(text)}
                        className="min-h-10 rounded-xl border border-slate-200 px-3 text-xs text-slate-500 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                      >
                        {text}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
          <div
            id="studio-preview-panel"
            className={`${mobileView === "preview" ? "block" : "hidden"} min-w-0 pb-20 lg:block lg:pb-0`}
          >
            <StudioPreview studio={studio} onRefine={focusConversation} />
            <div className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-30 flex justify-center lg:hidden">
              <button
                type="button"
                onClick={focusConversation}
                className={`${primaryClass} w-full max-w-md border border-violet-500 shadow-lg`}
              >
                <Pencil className="h-4 w-4" />
                {hasHistory ? "Refine this creation" : "Share your idea"}
              </button>
            </div>
          </div>
        </div>
      )}

      <SettingsDrawer studio={studio} open={settingsOpen} onOpenChange={setSettingsOpen} />
      <StudioDrawer
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        title="Conversation history"
        description="Your ideas and the directions you explored, all in one place."
      >
        <div className="space-y-5">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`rounded-xl p-4 ${message.role === "user" ? "bg-slate-50" : "bg-violet-50/50"}`}
            >
              <p className="mb-2 text-xs font-semibold text-slate-400">
                {message.role === "user" ? "You" : "Studio"}
              </p>
              <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
                {message.text}
              </p>
              {message.versionId && (
                <button
                  type="button"
                  className={`${buttonClass} mt-2 text-violet-700`}
                  onClick={() => {
                    if (message.versionId) void studio.selectVersion(message.versionId);
                    setHistoryOpen(false);
                  }}
                >
                  Open version →
                </button>
              )}
            </div>
          ))}
        </div>
      </StudioDrawer>
      <StudioDrawer
        open={renameOpen}
        onOpenChange={setRenameOpen}
        title="Name your creation"
        description="Give this conversation a name that makes it easy to find later."
      >
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            await studio.rename(title);
            setRenameOpen(false);
          }}
        >
          <label htmlFor="studio-title" className="mb-2 block text-sm font-medium text-slate-700">
            Creation name
          </label>
          <input
            id="studio-title"
            className={fieldClass}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={160}
          />
          <button className={`${primaryClass} mt-5`} type="submit" disabled={!title.trim()}>
            Save name
          </button>
        </form>
      </StudioDrawer>
    </div>
  );
}
