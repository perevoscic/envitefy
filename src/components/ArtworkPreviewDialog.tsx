"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import styles from "./ArtworkPreviewDialog.module.css";

/** Center artwork in the available screen, with Share and Close in opposite top corners. */
export default function ArtworkPreviewDialog({
  open,
  title,
  aspectRatio = 2 / 3,
  onClose,
  onReturnFocus,
  children,
}: {
  open: boolean;
  title: string;
  aspectRatio?: number;
  onClose: () => void;
  onReturnFocus?: () => void;
  children: ReactNode;
}) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[7000] bg-slate-950/55 backdrop-blur-sm" />
        <Dialog.Content
          data-artwork-preview
          aria-describedby={undefined}
          className={styles.content}
          style={{ "--artwork-preview-ratio": aspectRatio } as CSSProperties}
          onCloseAutoFocus={
            onReturnFocus
              ? (event) => {
                  event.preventDefault();
                  onReturnFocus();
                }
              : undefined
          }
        >
          <Dialog.Title className="sr-only">{title}</Dialog.Title>
          <div className={styles.close}>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close preview"
                className="inline-flex size-11 items-center justify-center rounded-full border border-white/40 bg-white/90 text-slate-950 shadow-sm transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <X size={21} aria-hidden="true" />
              </button>
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
