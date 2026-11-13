"use client";

import { Upload } from "lucide-react";
import { useId, useRef, useState, type DragEvent } from "react";
import styles from "./image-upload-dropzone.module.css";

/** Image-only adaptation of the supplied HaloDropzone's frosted fill and moving rim. */
export default function ImageUploadDropzone({
  label,
  busy,
  value,
  onBrowse,
  onFile,
}: {
  label: string;
  busy: boolean;
  value?: string | null;
  onBrowse: () => void;
  onFile: (file: File) => Promise<void>;
}) {
  const hintId = useId();
  const dragDepth = useRef(0);
  const [dragging, setDragging] = useState(false);
  const stopDrag = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };
  return (
    <button
      type="button"
      className={styles.dropzone}
      data-image-upload-dropzone
      data-dragging={dragging}
      disabled={busy}
      aria-label={label}
      aria-describedby={hintId}
      aria-busy={busy}
      onClick={onBrowse}
      onDragEnter={(event) => {
        stopDrag(event);
        if (!busy && event.dataTransfer.types.includes("Files")) {
          dragDepth.current++;
          setDragging(true);
        }
      }}
      onDragOver={(event) => {
        stopDrag(event);
        event.dataTransfer.dropEffect = busy ? "none" : "copy";
      }}
      onDragLeave={(event) => {
        stopDrag(event);
        dragDepth.current = Math.max(0, dragDepth.current - 1);
        if (!dragDepth.current) setDragging(false);
      }}
      onDrop={(event) => {
        stopDrag(event);
        dragDepth.current = 0;
        setDragging(false);
        const file = event.dataTransfer.files[0];
        if (file && !busy) void onFile(file);
      }}
    >
      <span className={styles.glow} aria-hidden="true">
        <span className={styles.primaryBlob} />
        <span className={styles.secondaryBlob} />
        <span className={styles.tertiaryBlob} />
      </span>
      <span className={styles.surface}>
        {value ? (
          <span className={styles.imagePreview} aria-hidden="true"><img src={value} alt="" /></span>
        ) : (
          <span className={styles.icon} aria-hidden="true"><Upload size={21} /></span>
        )}
        <span className={styles.label}>{busy ? "Preparing image…" : dragging ? "Drop your image here" : "Drop an image here or browse"}</span>
        <span id={hintId} className={styles.hint}>JPG, PNG, WebP or AVIF · Up to 20 MB</span>
      </span>
      <span className={styles.rim} aria-hidden="true">
        <span className={styles.trailAmbient} />
        <span className={styles.trailCore} />
      </span>
    </button>
  );
}
