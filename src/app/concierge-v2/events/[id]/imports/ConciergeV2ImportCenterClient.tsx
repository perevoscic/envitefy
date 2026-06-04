"use client";

import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileSearch,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Upload,
  Warehouse,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  EmptyState,
  FriendlyError,
  PageHeader,
  PremiumCard,
  SectionHeader,
  StepCard,
} from "@/components/ui/premium-shell";

type ImportRecord = Record<string, any>;

function clean(value: any): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function list(value: any): any[] {
  return Array.isArray(value) ? value : [];
}

function formatDateTime(value: any) {
  const raw = clean(value);
  if (!raw) return "No date detected";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusClass(value: any) {
  const status = clean(value).toLowerCase();
  if (status === "accepted") return "bg-emerald-50 text-emerald-700";
  if (status === "rejected") return "bg-rose-50 text-rose-700";
  if (status === "applied") return "bg-violet-50 text-violet-700";
  return "bg-amber-50 text-amber-700";
}

function StatusPill({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-black uppercase tracking-[0.12em] ${statusClass(status)}`}>
      {status || "proposed"}
    </span>
  );
}

function typeLabel(value: any) {
  return clean(value).replace(/[_-]+/g, " ") || "item";
}

export default function ConciergeV2ImportCenterClient({
  eventId,
  initialImports,
}: {
  eventId: string;
  initialImports: ImportRecord;
}) {
  const [imports, setImports] = useState(initialImports);
  const [sourceKind, setSourceKind] = useState("pasted_text");
  const [fileSourceKind, setFileSourceKind] = useState("pdf_schedule");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(list(initialImports.documents)[0]?.id || null);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const documents = list(imports.documents);
  const selectedDocument = useMemo(
    () => documents.find((document) => document.id === selectedDocumentId) || documents[0] || null,
    [documents, selectedDocumentId],
  );
  const items = list(selectedDocument?.items);
  const proposedCount = items.filter((item) => clean(item.status) === "proposed").length;
  const acceptedCount = items.filter((item) => clean(item.status) === "accepted").length;
  const appliedCount = items.filter((item) => clean(item.status) === "applied").length;
  const providerStatus = imports.providerStatus || {};
  const uploadReady = clean(providerStatus.storage) === "ready";

  async function reloadImports() {
    setError(null);
    const response = await fetch(`/api/concierge/events/${encodeURIComponent(eventId)}/imports`);
    const json = await response.json();
    if (!response.ok || !json.ok) throw new Error(json.error || "Unable to refresh imports.");
    setImports(json.imports);
    if (!selectedDocumentId && list(json.imports.documents)[0]?.id) {
      setSelectedDocumentId(list(json.imports.documents)[0].id);
    }
  }

  async function createImport() {
    setPending("create");
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/concierge/events/${encodeURIComponent(eventId)}/imports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceKind, text }),
      });
      const json = await response.json();
      if (!response.ok || !json.ok) throw new Error(json.error || "Unable to import source material.");
      setImports(json.imports);
      setSelectedDocumentId(json.document.id);
      setNotice(`Extracted ${Number(json.document.itemCounts?.total || 0)} proposed item(s).`);
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to import source material.");
    } finally {
      setPending(null);
    }
  }

  async function uploadImportFile() {
    if (!file) return;
    setPending("upload");
    setError(null);
    setNotice(null);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("sourceKind", fileSourceKind);
      const response = await fetch(`/api/concierge/events/${encodeURIComponent(eventId)}/imports/upload`, {
        method: "POST",
        body: form,
      });
      const json = await response.json();
      if (!response.ok || !json.ok) throw new Error(json.error || "Unable to upload source material.");
      setImports(json.imports);
      setSelectedDocumentId(json.document.id);
      setNotice(`Uploaded and extracted ${Number(json.document.itemCounts?.total || 0)} proposed item(s).`);
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to upload source material.");
    } finally {
      setPending(null);
    }
  }

  async function updateItem(documentId: string, itemId: string, status: string) {
    setPending(itemId);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(
        `/api/concierge/events/${encodeURIComponent(eventId)}/imports/${encodeURIComponent(documentId)}/items/${encodeURIComponent(itemId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      const json = await response.json();
      if (!response.ok || !json.ok) throw new Error(json.error || "Unable to update extracted item.");
      setImports(json.imports);
      setSelectedDocumentId(documentId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update extracted item.");
    } finally {
      setPending(null);
    }
  }

  async function acceptAll() {
    if (!selectedDocument) return;
    const proposed = items.filter((item) => clean(item.status) === "proposed");
    for (const item of proposed) {
      await updateItem(selectedDocument.id, item.id, "accepted");
    }
    setNotice(`Accepted ${proposed.length} item(s).`);
  }

  async function applyAccepted() {
    if (!selectedDocument) return;
    setPending("apply");
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(
        `/api/concierge/events/${encodeURIComponent(eventId)}/imports/${encodeURIComponent(selectedDocument.id)}/apply`,
        { method: "POST" },
      );
      const json = await response.json();
      if (!response.ok || !json.ok) throw new Error(json.error || "Unable to apply accepted items.");
      setImports((current) => ({ ...current, documents: json.result.imports }));
      setNotice(`Applied ${Number(json.result.appliedCount || 0)} item(s) to this event.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to apply accepted items.");
    } finally {
      setPending(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#fbf9ff] text-slate-950">
      <PageHeader
        eyebrow="Imports"
        title={clean(imports.event?.title) || "Review imported flyer or file"}
        subtitle="Upload or paste event details, review what Envitefy found, then add the accepted details to your schedule, forms, reminders, and checklist."
        actions={[
          { label: "Hub", href: `/concierge-v2/events/${encodeURIComponent(eventId)}/hub`, icon: ShieldCheck },
          { label: "Schedule", href: `/concierge-v2/events/${encodeURIComponent(eventId)}/schedule`, icon: CalendarDays },
          { label: "Setup", href: `/concierge-v2/events/${encodeURIComponent(eventId)}/resources`, icon: Warehouse },
          { label: "Reminders", href: `/concierge-v2/events/${encodeURIComponent(eventId)}/ops` },
          {
            label: "Refresh",
            icon: RefreshCw,
            primary: true,
            onClick: () => {
              void reloadImports().catch((err) =>
                setError(err instanceof Error ? err.message : "Unable to refresh imports."),
              );
            },
          },
        ]}
      />

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6">
        {error ? (
          <FriendlyError message={error} />
        ) : null}
        {notice ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
            {notice}
          </div>
        ) : null}

        <section className="grid gap-3 md:grid-cols-5">
          <StepCard step="1" title="Add" description="Paste text or upload a flyer, schedule, packet, or screenshot." done={Boolean(selectedDocument)} />
          <StepCard step="2" title="Read" description="Envitefy reads the file and turns details into review cards." done={items.length > 0} />
          <StepCard step="3" title="Review" description="Check the found details before they touch your event." done={acceptedCount > 0} />
          <StepCard step="4" title="Accept" description="Accept what belongs and reject anything that should stay out." done={acceptedCount > 0} />
          <StepCard step="5" title="Add to event" description="Apply accepted details to the schedule and planning tools." done={appliedCount > 0} />
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <PremiumCard>
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                <FileSearch className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-xl font-black text-slate-950">Paste or upload event details</h2>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                  Works for emails, school notes, meet details, team calendars, birthday logistics, and copied group chat messages.
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              <label className="grid gap-1 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                Uploaded flyer or text type
                <select
                  value={sourceKind}
                  onChange={(event) => setSourceKind(event.target.value)}
                  className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold normal-case tracking-normal text-slate-950 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                >
                  <option value="pasted_text">Pasted text</option>
                  <option value="email">Email</option>
                  <option value="school_flyer">School flyer</option>
                  <option value="gymnastics_packet">Gymnastics packet</option>
                  <option value="class_newsletter">Class newsletter</option>
                  <option value="sports_calendar">Sports calendar</option>
                  <option value="group_chat">Group chat</option>
                </select>
              </label>
              <label className="grid gap-1 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                Details to review
                <textarea
                  rows={9}
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder="Paste dates, times, locations, fees, permission notes, bring items, RSVP details, or travel notes here."
                  className="rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold normal-case leading-6 tracking-normal text-slate-950 outline-none placeholder:text-slate-400 focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                />
              </label>
              <button
                type="button"
                disabled={pending === "create" || clean(text).length < 10}
                onClick={() => void createImport()}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-violet-700 px-5 text-sm font-black text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Review found details
              </button>
              <div className="mt-3 border-t border-slate-100 pt-4">
                <label className="grid gap-1 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  Upload flyer or file
                  <input
                    type="file"
                    accept=".pdf,.txt,.md,.csv,image/png,image/jpeg,image/webp"
                    onChange={(event) => setFile(event.target.files?.[0] || null)}
                    className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold normal-case tracking-normal text-slate-950 file:mr-3 file:rounded-full file:border-0 file:bg-violet-50 file:px-3 file:py-2 file:text-xs file:font-black file:uppercase file:tracking-[0.12em] file:text-violet-700"
                  />
                </label>
                <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
                  <select
                    value={fileSourceKind}
                    onChange={(event) => setFileSourceKind(event.target.value)}
                    className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                  >
                    <option value="pdf_schedule">PDF schedule</option>
                    <option value="screenshot">Screenshot</option>
                    <option value="school_flyer">School flyer</option>
                    <option value="gymnastics_packet">Gymnastics packet</option>
                    <option value="sports_calendar">Sports calendar</option>
                  </select>
                  <button
                    type="button"
                    disabled={!file || pending === "upload" || !uploadReady}
                    onClick={() => void uploadImportFile()}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    <Upload className="h-4 w-4" aria-hidden="true" />
                    {pending === "upload" ? "Uploading..." : "Upload and review"}
                  </button>
                </div>
                {!uploadReady ? (
                  <p className="mt-2 text-xs font-bold leading-5 text-amber-700">
                    Blob storage is required before source files can be uploaded.
                  </p>
                ) : null}
              </div>
            </div>
          </PremiumCard>

          <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_rgba(31,41,55,0.07)]">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-700">Import readiness</p>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl bg-emerald-50 p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                  <p className="text-sm font-black text-emerald-950">
                    Pasted text is {providerStatus.pastedText || "ready"}
                  </p>
                </div>
                <p className="mt-1 text-sm font-semibold leading-6 text-emerald-900">
                  AI parser: {providerStatus.aiParsing || "fallback"}.
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-slate-600" aria-hidden="true" />
                  <p className="text-sm font-black text-slate-950">File uploads are {providerStatus.storage || "not configured"}</p>
                </div>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                  PDF extraction: {providerStatus.pdfOcr || "provider_setup_required"}. Image OCR:{" "}
                  {providerStatus.imageOcr || "provider_setup_required"}.
                </p>
              </div>
            </div>
          </aside>
        </section>

        <section className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_55px_rgba(31,41,55,0.07)]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">Uploaded files and text</h2>
              <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-black text-violet-700">
                {documents.length}
              </span>
            </div>
            <div className="mt-4 grid gap-2">
              {documents.length ? (
                documents.map((document) => (
                  <button
                    key={document.id}
                    type="button"
                    onClick={() => setSelectedDocumentId(document.id)}
                    className={`rounded-2xl border p-3 text-left transition focus:outline-none focus:ring-4 focus:ring-violet-100 ${
                      selectedDocument?.id === document.id
                        ? "border-violet-300 bg-violet-50"
                        : "border-slate-200 bg-white hover:border-violet-200"
                    }`}
                  >
                    <p className="text-sm font-black text-slate-950">{typeLabel(document.sourceKind)}</p>
                    <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">
                      {clean(document.textPreview) || "Uploaded flyer or file"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <StatusPill status={clean(document.parseStatus)} />
                    </div>
                  </button>
                ))
              ) : (
                <EmptyState
                  icon={FileSearch}
                  title="No imports yet"
                  description="Paste text or upload a flyer, schedule, packet, or screenshot to start reviewing found details."
                  className="p-4"
                />
              )}
            </div>
          </aside>

          <PremiumCard>
            {selectedDocument ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <SectionHeader
                    eyebrow="Review found details"
                    title={typeLabel(selectedDocument.sourceKind)}
                    subtitle={`${proposedCount} to review, ${acceptedCount} accepted, ${appliedCount} added to this event.`}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={!proposedCount}
                      onClick={() => void acceptAll()}
                      className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-xs font-black uppercase tracking-[0.12em] text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      Accept all
                    </button>
                    <button
                      type="button"
                      disabled={pending === "apply" || !acceptedCount}
                      onClick={() => void applyAccepted()}
                      className="inline-flex h-10 items-center gap-2 rounded-full bg-violet-700 px-4 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      <Send className="h-4 w-4" aria-hidden="true" />
                      Add accepted
                    </button>
                  </div>
                </div>

                <div className="mt-5 grid gap-3">
                  {items.length ? (
                    items.map((item) => (
                      <article key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                              {typeLabel(item.itemType)} - {Math.round(Number(item.confidence || 0) * 100)}%
                            </p>
                            <h3 className="mt-2 text-lg font-black text-slate-950">{clean(item.title) || "Found detail"}</h3>
                            <p className="mt-1 text-sm font-semibold text-slate-500">
                              {formatDateTime(item.startAt)}
                              {clean(item.data?.locationText) ? ` at ${clean(item.data.locationText)}` : ""}
                            </p>
                          </div>
                          <StatusPill status={clean(item.status)} />
                        </div>
                        {clean(item.description) ? (
                          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{item.description}</p>
                        ) : null}
                        {clean(item.status) !== "applied" ? (
                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={pending === item.id}
                              onClick={() => void updateItem(selectedDocument.id, item.id, "accepted")}
                              className="inline-flex h-9 items-center gap-2 rounded-full bg-emerald-600 px-3 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                              Accept
                            </button>
                            <button
                              type="button"
                              disabled={pending === item.id}
                              onClick={() => void updateItem(selectedDocument.id, item.id, "rejected")}
                              className="inline-flex h-9 items-center gap-2 rounded-full border border-rose-200 bg-white px-3 text-xs font-black uppercase tracking-[0.12em] text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                              Reject
                            </button>
                          </div>
                        ) : null}
                      </article>
                    ))
                  ) : (
                    <EmptyState
                      icon={ClipboardList}
                      title="No found details yet"
                      description="Try a flyer, packet, email, or note that includes dates, tasks, fees, forms, reminders, or bring-list items."
                    />
                  )}
                </div>
              </>
            ) : (
              <EmptyState
                icon={FileSearch}
                title="Paste or upload details to begin"
                description="Found schedule items, forms, reminders, checklist tasks, and payment notes will appear here as editable review cards."
              />
            )}
          </PremiumCard>
        </section>
      </div>
    </main>
  );
}
