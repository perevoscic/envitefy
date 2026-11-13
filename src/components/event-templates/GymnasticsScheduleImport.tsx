"use client";

import { useContext, useEffect, useId, useRef, useState } from "react";
import { Camera, Check, FileText, Upload, X } from "lucide-react";
import DiscoveryProgressPanel from "@/components/event-create/DiscoveryProgressPanel";
import { EventSectionEditorBusy } from "@/components/events/EventSectionEditorContext";
import { appendImportedSchedule, importedDayLabel, normalizeScheduleImport, type ScheduleImport } from "@/lib/gymnastics-schedule-import";
import { prepareOcrUploadFile, validateClientUploadFile } from "@/utils/media-upload-client";
import styles from "./gymnastics-schedule-editor.module.css";

export default function GymnasticsScheduleImport({ eventId, setState }: {
  eventId?: string | null;
  setState: (updater: (current: any) => any) => void;
}) {
  const upload = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const uploadButton = useRef<HTMLButtonElement>(null);
  const cameraButton = useRef<HTMLButtonElement>(null);
  const request = useRef<AbortController | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  const setBusy = useContext(EventSectionEditorBusy);
  const [reading, setReading] = useState(false);
  const [candidate, setCandidate] = useState<ScheduleImport | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [phase, setPhase] = useState<"preparing" | "reading">("preparing");
  const [fileName, setFileName] = useState("");
  const open = reading || Boolean(candidate) || Boolean(error);
  useEffect(() => () => { request.current?.abort(); setBusy?.(false); }, [setBusy]);
  useEffect(() => {
    const element = dialog.current;
    if (open && element && !element.open) element.showModal();
    else if (!open && element?.open) {
      element.close();
      returnFocus.current?.focus({ preventScroll: true });
    }
  }, [open]);
  useEffect(() => {
    if (candidate) dialog.current?.querySelector<HTMLElement>("h3")?.focus();
  }, [Boolean(candidate)]);

  const cancel = () => {
    request.current?.abort();
    request.current = null;
    setReading(false);
    setBusy?.(false);
    setCandidate(null);
    setError("");
  };
  const read = async (file?: File, fromCamera = false) => {
    if (!file) return;
    returnFocus.current = fromCamera ? cameraButton.current : uploadButton.current;
    setFileName(file.name);
    const invalid = validateClientUploadFile(file, "attachment");
    if (invalid) { setError(invalid); return; }
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setReading(true);
    setPhase("preparing");
    setBusy?.(true);
    setCandidate(null);
    setError("");
    setNotice("");
    try {
      const prepared = await prepareOcrUploadFile(file);
      if (controller.signal.aborted) return;
      if (prepared.size > 4 * 1024 * 1024) throw new Error("Choose a schedule file smaller than 4 MB.");
      const form = new FormData();
      form.set("file", prepared);
      setPhase("reading");
      const query = eventId ? `?edit=${encodeURIComponent(eventId)}` : "";
      const response = await fetch(`/api/gymnastics/schedule${query}`, {
        method: "POST", body: form, signal: controller.signal,
      });
      const result = await response.json().catch(() => null);
      if (request.current !== controller || controller.signal.aborted) return;
      if (!response.ok) throw new Error(result?.error || "The schedule could not be read. Please retry.");
      setCandidate({ days: normalizeScheduleImport(result), source: { fileName: file.name, text: result?.source?.text || "" } });
    } catch (error) {
      if (request.current === controller && !controller.signal.aborted)
        setError(error instanceof Error ? error.message : "The schedule could not be read. Please retry.");
    } finally {
      if (request.current === controller) { request.current = null; setReading(false); setBusy?.(false); }
    }
  };
  const changeDay = (index: number, isoDate: string) => {
    setError("");
    setCandidate(current => current && ({ ...current,
      days: current.days.map((day, i) => i === index ? { ...day, isoDate } : day),
    }));
  };
  const changeSession = (dayIndex: number, sessionIndex: number, field: string, value: string) => setCandidate(current => current && ({ ...current,
    days: current.days.map((day, i) => i === dayIndex ? { ...day, sessions: day.sessions.map((session, j) => j === sessionIndex
      ? { ...session, [field]: field === "clubs" ? value.split("\n").map(name => name.trim()).filter(Boolean) : value } : session) } : day),
  }));
  const add = () => {
    if (!candidate) return;
    try {
      const days = normalizeScheduleImport(candidate);
      if (days.some(day => !day.isoDate)) throw new Error("Choose a date for every imported day before adding it.");
      setState(current => appendImportedSchedule(current || {}, { ...candidate, days }, () => crypto.randomUUID()));
      setCandidate(null);
      setError("");
      setNotice("Schedule added to your edits. Review it on the page, then save your changes.");
    } catch (error) { setError(error instanceof Error ? error.message : "Check the imported dates."); }
  };
  const sessionCount = candidate?.days.reduce((total, day) => total + day.sessions.length, 0) || 0;

  return <div className={styles.importSection}>
    <input ref={upload} type="file" hidden aria-label="Upload schedule file" accept="application/pdf,image/jpeg,image/png,image/webp,.pdf,.jpg,.jpeg,.png,.webp"
      onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; void read(file); }} />
    <input ref={camera} type="file" hidden aria-label="Take schedule photo" accept="image/*" capture="environment"
      onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; void read(file, true); }} />
    <div className={styles.sectionHeading}><h3>Import your schedule</h3><p>Start with a PDF or photo. Review everything before adding it.</p></div>
      <div className={styles.importActions}>
        <button ref={uploadButton} type="button" className={styles.uploadButton} onClick={() => upload.current?.click()}><Upload size={20} aria-hidden="true" /> Upload schedule</button>
        <button ref={cameraButton} type="button" onClick={() => camera.current?.click()}><Camera size={20} aria-hidden="true" /> Take a photo</button>
      </div>
      <p className={styles.fileHint}>PDF up to 4 MB · JPG, PNG or WebP up to 10 MB</p>
    <dialog ref={dialog} data-appearance-scope="app" data-app-dialog className={`${styles.importDialog} ${reading ? styles.progressDialog : ""}`}
      aria-labelledby={titleId} aria-describedby={descriptionId}
      onCancel={event => { event.preventDefault(); event.stopPropagation(); cancel(); }}
      onClose={event => event.stopPropagation()}
      onClick={event => event.stopPropagation()} onPointerDown={event => event.stopPropagation()}>
      <div className={styles.popupHeader}>
        <span className={styles.popupIcon}><FileText size={22} aria-hidden="true" /></span>
        <div><h3 id={titleId} tabIndex={-1}>{reading ? "Importing schedule" : candidate ? "Review imported schedule" : "Unable to read schedule"}</h3>
          <p id={descriptionId}>{reading ? fileName : candidate ? `${candidate.days.length} day${candidate.days.length === 1 ? "" : "s"} · ${sessionCount} session${sessionCount === 1 ? "" : "s"}` : "Try a clearer photo or a schedule PDF."}</p></div>
        {!reading && <button type="button" className={styles.closeButton} aria-label="Close import results" onClick={cancel}><X size={20} aria-hidden="true" /></button>}
      </div>
      {reading && <div className={styles.progressBody} aria-busy="true">
        <DiscoveryProgressPanel cancelLabel="Cancel import" label={phase === "preparing" ? "Preparing your file…" : "Reading your schedule…"}
          progress={0} indeterminate onCancel={cancel} showDetails={false}
          theme={{ badgeBackground: "transparent", badgeBorder: "transparent", baseBackground: "transparent", borderColor: "var(--app-border)",
            cancelBackground: "transparent", cancelBorderColor: "var(--app-border)", cancelHoverBackground: "var(--app-surface-alt)", cancelTextColor: "var(--app-foreground)",
            fillEnd: "#74e1ff", fillMiddle: "#489ffb", fillStart: "#1d6ffb", textColor: "var(--app-foreground)" }} />
        <p className={styles.fileHint}>Dates, sessions, times and clubs will be ready for your review.</p>
      </div>}
    {candidate && <div className={styles.reviewBody}>
      <p className={styles.reviewHint}>Check dates, levels, times and clubs. Missing details stay blank. Your existing sessions will be kept.</p>
      <p className={styles.fileHint}>{candidate.source.fileName}</p>
      {candidate.days.map((day, dayIndex) => <fieldset key={dayIndex} className={styles.day}>
        <legend>{importedDayLabel(day, dayIndex)}</legend>
        <label>Day {dayIndex + 1} date<input type="date" value={day.isoDate} onChange={event => changeDay(dayIndex, event.target.value)} /></label>
        {day.sessions.map((session, sessionIndex) => <fieldset key={sessionIndex} className={styles.day}>
          <legend>Session {sessionIndex + 1}</legend>
          <div className={styles.reviewFields}>
            {[["code", "Session code"], ["group", "Level / group"], ["label", "Session title"], ["startTime", "Start time"], ["warmupTime", "Warm-up time"], ["note", "Session notes"]].map(([field, label]) =>
              <label key={field} className={field === "label" || field === "note" ? styles.fullField : undefined}>{label}<input value={session[field as keyof typeof session] as string} onChange={event => changeSession(dayIndex, sessionIndex, field, event.target.value)} /></label>)}
          </div>
          <label>Clubs · one per line<textarea rows={3} value={session.clubs.join("\n")} onChange={event => changeSession(dayIndex, sessionIndex, "clubs", event.target.value)} /></label>
          <button type="button" onClick={() => setCandidate(current => current && ({ ...current, days: current.days.map((item, i) => i === dayIndex ? { ...item, sessions: item.sessions.filter((_, j) => j !== sessionIndex) } : item) }))}>Remove imported session</button>
        </fieldset>)}
        {!day.sessions.length && <p>No event scheduled.</p>}
        <button type="button" onClick={() => setCandidate(current => current && ({ ...current, days: current.days.filter((_, i) => i !== dayIndex) }))}>Remove imported day</button>
      </fieldset>)}
      <details><summary>Source text</summary><p className={styles.sourceText}>{candidate.source.text}</p></details>
    </div>}
    {error && <p className={styles.importError} role="alert">{error}</p>}
    {!reading && <div className={styles.popupFooter}>
      <button type="button" onClick={cancel}>Cancel</button>
      {candidate && <button type="button" className={styles.primaryButton} disabled={!candidate.days.length} onClick={add}><Check size={18} aria-hidden="true" /> Add to event schedule</button>}
    </div>}
    </dialog>
    {notice && <p role="status">{notice}</p>}
  </div>;
}
