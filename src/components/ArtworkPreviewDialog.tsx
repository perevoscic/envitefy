"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Share2, X } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { useArtworkAspectRatio } from "@/hooks/use-artwork-aspect-ratio";
import chromeStyles from "./studio/LiveCardChromeButton.module.css";
import styles from "./ArtworkPreviewDialog.module.css";

const chromeButtonClassName = `${chromeStyles.glass} inline-flex size-11 cursor-pointer items-center justify-center rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white`;

/** Center artwork in the available screen, with Share and Close in opposite top corners. */
export default function ArtworkPreviewDialog({
  open,
  title,
  aspectRatio = 2 / 3,
  imageUrl,
  onClose,
  onShare,
  onReturnFocus,
  toolbar,
  children,
}: {
  open: boolean;
  title: string;
  aspectRatio?: number;
  imageUrl?: string | null;
  onClose: () => void;
  onShare?: () => void;
  onReturnFocus?: () => void;
  toolbar?: ReactNode;
  children: ReactNode;
}) {
  const artworkRatio = useArtworkAspectRatio(imageUrl, aspectRatio);
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[7000] bg-neutral-950" />
        <Dialog.Content
          data-artwork-preview
          data-has-toolbar={toolbar ? "true" : undefined}
          aria-describedby={undefined}
          className={`${styles.viewportFrame} ${styles.content}`}
          style={{ "--artwork-preview-ratio": artworkRatio } as CSSProperties}
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
          {toolbar ? <div className={styles.toolbar}>{toolbar}</div> : null}
          {onShare ? (
            <div className={styles.share}>
              <button
                type="button"
                aria-label="Share"
                onClick={onShare}
                className={chromeButtonClassName}
              >
                <Share2 size={21} aria-hidden="true" />
              </button>
            </div>
          ) : null}
          <div className={styles.close}>
            <Dialog.Close asChild>
              <button type="button" aria-label="Close preview" className={chromeButtonClassName}>
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
