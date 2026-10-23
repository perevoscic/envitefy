"use client";

import { ArrowDown, ArrowUp, Plus, Trash2, Upload } from "lucide-react";
import { useContext, useEffect, useId, useRef, useState } from "react";
import {
  safeEventSectionLink,
  safeEventSectionPhotoUrl,
  type EventSectionExtras,
} from "@/lib/event-section-extras";
import { EventEditorInput } from "./EventEditorFields";
import { EventSectionEditorBusy } from "./EventSectionEditorContext";
import styles from "./event-section-extras.module.css";

const MAX_ITEMS = 20;
const UPLOAD_TIMEOUT = 60_000;
type Photo = NonNullable<EventSectionExtras["photos"]>[number];
type Link = NonNullable<EventSectionExtras["links"]>[number];
type UploadFailure = { file: File; message: string };

const safeLinks = (links: Link[]) =>
  links.map((link) => ({ ...link, url: safeEventSectionLink(link.url) || "" }));
const signature = (links: Link[]) => JSON.stringify(links);

function ItemActions({
  kind,
  index,
  count,
  onMove,
  onRemove,
}: {
  kind: "photo" | "link";
  index: number;
  count: number;
  onMove: (direction: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className={styles.itemActions}>
      <button
        type="button"
        aria-label={`Move ${kind} ${index + 1} up`}
        disabled={index === 0}
        onClick={() => onMove(-1)}
      >
        <ArrowUp size={17} aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label={`Move ${kind} ${index + 1} down`}
        disabled={index === count - 1}
        onClick={() => onMove(1)}
      >
        <ArrowDown size={17} aria-hidden="true" />
      </button>
      <button type="button" aria-label={`Remove ${kind} ${index + 1}`} onClick={onRemove}>
        <Trash2 size={17} aria-hidden="true" />
      </button>
    </div>
  );
}

function moved<T>(items: T[], index: number, direction: number): T[] {
  const next = [...items];
  const destination = index + direction;
  if (destination < 0 || destination >= next.length) return items;
  [next[index], next[destination]] = [next[destination], next[index]];
  return next;
}

export default function EventSectionExtrasEditor({
  value,
  onChange,
}: {
  value: EventSectionExtras;
  onChange: (patch: EventSectionExtras) => void;
}) {
  const latest = useRef(value);
  const change = useRef(onChange);
  latest.current = value;
  change.current = onChange;
  const fileInput = useRef<HTMLInputElement>(null);
  const upload = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const uploading = useRef(false);
  const mounted = useRef(false);
  const [busy, setBusy] = useState(false);
  const reportBusy = useContext(EventSectionEditorBusy);
  const [status, setStatus] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [failures, setFailures] = useState<UploadFailure[]>([]);
  const failuresRef = useRef<UploadFailure[]>([]);
  const uploadHelpId = useId();
  const [links, setLinks] = useState<Link[]>(() => (value.links || []).slice(0, MAX_ITEMS));
  const linksRef = useRef(links);
  const lastEmittedLinks = useRef(signature(value.links || []));
  const incomingLinks = signature(value.links || []);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      generation.current += 1;
      upload.current?.abort();
    };
  }, []);

  useEffect(() => {
    reportBusy?.(busy);
    return () => reportBusy?.(false);
  }, [busy, reportBusy]);

  useEffect(() => {
    // Keep an incomplete URL in its input while the stored draft contains a safe blank URL.
    if (incomingLinks === lastEmittedLinks.current) return;
    const incoming = (value.links || []).slice(0, MAX_ITEMS);
    linksRef.current = incoming;
    lastEmittedLinks.current = incomingLinks;
    setLinks(incoming);
  }, [incomingLinks]);

  const emit = (patch: EventSectionExtras) => {
    latest.current = { ...latest.current, ...patch };
    change.current(patch);
  };
  const updateLinks = (next: Link[]) => {
    linksRef.current = next;
    setLinks(next);
    const persisted = safeLinks(next);
    lastEmittedLinks.current = signature(persisted);
    emit({ links: persisted });
  };
  const updatePhotos = (next: Photo[]) => emit({ photos: next });

  async function uploadFiles(files: File[], retry = false) {
    if (uploading.current || !files.length) return;
    const remaining = MAX_ITEMS - (latest.current.photos?.length || 0);
    if (files.length > remaining) {
      setErrors([
        `You can add ${Math.max(0, remaining)} more ${remaining === 1 ? "photo" : "photos"}. Choose a smaller batch.`,
      ]);
      return;
    }
    const invalid: string[] = [];
    const accepted = files.filter((file) => {
      if (
        !/\.(jpe?g|png|webp)$/i.test(file.name) &&
        !["image/jpeg", "image/png", "image/webp"].includes(file.type)
      ) {
        invalid.push(`${file.name}: Choose a JPG, PNG or WebP photo.`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        invalid.push(`${file.name}: Photos must be 10 MB or smaller.`);
        return false;
      }
      return true;
    });
    setErrors(invalid);
    if (!accepted.length) return;
    const pendingFailures = retry ? [] : [...failuresRef.current];
    failuresRef.current = pendingFailures;
    setFailures(pendingFailures);
    const run = ++generation.current;
    uploading.current = true;
    setBusy(true);
    let added = 0;
    try {
      for (let index = 0; index < accepted.length; index += 1) {
        if (!mounted.current || generation.current !== run) return;
        const file = accepted[index];
        setStatus(`Uploading photo ${index + 1} of ${accepted.length}…`);
        const controller = new AbortController();
        upload.current = controller;
        let timedOut = false;
        const timeout = window.setTimeout(() => {
          timedOut = true;
          controller.abort();
        }, UPLOAD_TIMEOUT);
        try {
          const data = new FormData();
          data.append("file", file);
          const response = await fetch("/api/templates/media", {
            method: "POST",
            body: data,
            signal: controller.signal,
          });
          const result = (await response.json().catch(() => ({}))) as {
            url?: unknown;
            error?: unknown;
          };
          if (!mounted.current || generation.current !== run) return;
          if (!response.ok) {
            throw new Error(
              typeof result.error === "string" ? result.error : "Photo upload failed. Try again.",
            );
          }
          const url = safeEventSectionPhotoUrl(result.url);
          if (!url) throw new Error("The upload did not return a usable photo. Try again.");
          const current = latest.current.photos || [];
          if (current.length >= MAX_ITEMS)
            throw new Error("The gallery is full. Remove a photo before retrying.");
          // Read the current array after each response so edits and reordering made during uploads survive.
          updatePhotos([...current, { url, caption: "" }]);
          added += 1;
        } catch (error) {
          if (!mounted.current || generation.current !== run) return;
          const message = timedOut
            ? "The upload timed out after 60 seconds. Try again."
            : error instanceof Error
              ? error.message
              : "Photo upload failed. Try again.";
          pendingFailures.push({ file, message });
          failuresRef.current = [...pendingFailures];
          setFailures([...pendingFailures]);
        } finally {
          window.clearTimeout(timeout);
          if (upload.current === controller) upload.current = null;
        }
      }
      if (mounted.current && generation.current === run) {
        setStatus(
          `${added} ${added === 1 ? "photo" : "photos"} added.${pendingFailures.length ? " Retry the remaining uploads below." : ""}`,
        );
      }
    } finally {
      if (mounted.current && generation.current === run) {
        uploading.current = false;
        setBusy(false);
      }
    }
  }

  if (value.kind === "photos") {
    const photos = (value.photos || []).slice(0, MAX_ITEMS);
    return (
      <div className={styles.editor}>
        <p className={styles.help} id={uploadHelpId}>
          Upload JPG, PNG or WebP photos, up to 10 MB each. Add a caption to describe each photo.
        </p>
        <div className={styles.editorToolbar}>
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            aria-label="Upload photos"
            aria-describedby={uploadHelpId}
            className={styles.fileInput}
            tabIndex={-1}
            disabled={busy || photos.length >= MAX_ITEMS}
            onChange={(event) => {
              const files = Array.from(event.target.files || []);
              event.target.value = "";
              void uploadFiles(files);
            }}
          />
          <button
            type="button"
            className={styles.addButton}
            disabled={busy || photos.length >= MAX_ITEMS}
            onClick={() => fileInput.current?.click()}
          >
            <Upload size={17} aria-hidden="true" />
            Upload photos
          </button>
          <span className={styles.count}>
            {photos.length}/{MAX_ITEMS} photos
          </span>
          {busy && (
            <button
              type="button"
              onClick={() => {
                generation.current += 1;
                upload.current?.abort();
                upload.current = null;
                uploading.current = false;
                setBusy(false);
                setStatus("Upload stopped. Photos already added are kept.");
              }}
            >
              Cancel upload
            </button>
          )}
        </div>
        <div className={styles.status} role="status" aria-live="polite">
          {status}
        </div>
        {!!errors.length && (
          <div className={styles.error} role="alert">
            {errors.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        )}
        {!!failures.length && (
          <div className={styles.error} role="alert">
            {failures.map((failure, index) => (
              <p key={`${failure.file.name}-${index}`}>
                {failure.file.name}: {failure.message}
              </p>
            ))}
            <button
              type="button"
              disabled={busy || photos.length >= MAX_ITEMS}
              onClick={() =>
                void uploadFiles(
                  failuresRef.current.map((failure) => failure.file),
                  true,
                )
              }
            >
              Retry failed uploads
            </button>
          </div>
        )}
        {!photos.length && <p className={styles.empty}>Your uploaded photos will appear here.</p>}
        <div className={styles.editorItems}>
          {photos.map((photo, index) => (
            <div
              className={styles.editorItem}
              key={`${photo.url}-${photos.slice(0, index).filter((item) => item.url === photo.url).length}`}
            >
              <div className={styles.itemHeader}>
                <strong>Photo {index + 1}</strong>
                <ItemActions
                  kind="photo"
                  index={index}
                  count={photos.length}
                  onMove={(direction) =>
                    updatePhotos(moved(latest.current.photos || [], index, direction))
                  }
                  onRemove={() =>
                    updatePhotos(
                      (latest.current.photos || []).filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                />
              </div>
              {safeEventSectionPhotoUrl(photo.url) && (
                <img
                  className={styles.photoPreview}
                  src={safeEventSectionPhotoUrl(photo.url)}
                  alt={photo.caption || `Event photo ${index + 1}`}
                  loading="lazy"
                />
              )}
              <EventEditorInput
                label={`Photo ${index + 1} caption`}
                value={photo.caption}
                maxLength={240}
                onChange={(caption) =>
                  updatePhotos(
                    (latest.current.photos || []).map((item, itemIndex) =>
                      itemIndex === index ? { ...item, caption } : item,
                    ),
                  )
                }
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (value.kind !== "links") return null;
  return (
    <div className={styles.editor}>
      <p className={styles.help}>
        Give each link a descriptive label and a complete web address beginning with https:// or
        http://.
      </p>
      <div className={styles.editorItems}>
        {links.map((link, index) => (
          <div className={styles.editorItem} key={index}>
            <div className={styles.itemHeader}>
              <strong>Link {index + 1}</strong>
              <ItemActions
                kind="link"
                index={index}
                count={links.length}
                onMove={(direction) => updateLinks(moved(linksRef.current, index, direction))}
                onRemove={() =>
                  updateLinks(linksRef.current.filter((_, itemIndex) => itemIndex !== index))
                }
              />
            </div>
            <EventEditorInput
              label={`Link ${index + 1} label`}
              value={link.label}
              maxLength={240}
              onChange={(label) =>
                updateLinks(
                  linksRef.current.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, label } : item,
                  ),
                )
              }
            />
            <EventEditorInput
              label={`Link ${index + 1} URL`}
              type="url"
              value={link.url}
              maxLength={2000}
              placeholder="https://example.com"
              error={
                link.url.trim() && !safeEventSectionLink(link.url)
                  ? "Enter a complete http:// or https:// web address."
                  : undefined
              }
              onChange={(url) =>
                updateLinks(
                  linksRef.current.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, url } : item,
                  ),
                )
              }
            />
          </div>
        ))}
      </div>
      <div className={styles.editorToolbar}>
        <button
          type="button"
          className={styles.addButton}
          disabled={links.length >= MAX_ITEMS}
          onClick={() => updateLinks([...linksRef.current, { label: "", url: "" }])}
        >
          <Plus size={17} aria-hidden="true" />
          Add link
        </button>
        <span className={styles.count}>
          {links.length}/{MAX_ITEMS} links
        </span>
      </div>
    </div>
  );
}
