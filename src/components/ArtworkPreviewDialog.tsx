"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Share2, X } from "lucide-react";
import { type CSSProperties, type ReactNode, useLayoutEffect, useRef, useState } from "react";
import { useArtworkAspectRatio } from "@/hooks/use-artwork-aspect-ratio";
import { useMobilePreviewSwipe } from "@/hooks/useMobilePreviewSwipe";
import chromeStyles from "./studio/LiveCardChromeButton.module.css";
import styles from "./ArtworkPreviewDialog.module.css";

const chromeButtonClassName = `${chromeStyles.glass} inline-flex size-11 cursor-pointer items-center justify-center rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white`;

function PreviewFooter({ children, onHeight }: { children: ReactNode; onHeight: (height: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => onHeight(Math.max(76, Math.ceil(element.getBoundingClientRect().height) + 24));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [onHeight]);
  return <div ref={ref} className={styles.footer}>{children}</div>;
}

/** Center artwork, with optional owner download beside Close. */
export default function ArtworkPreviewDialog({
  open,
  title,
  aspectRatio = 2 / 3,
  imageUrl,
  onClose,
  onShare,
  onReturnFocus,
  toolbar,
  footer,
  downloadAction,
  mobileSwipeNavigation = false,
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
  footer?: ReactNode;
  downloadAction?: ReactNode;
  mobileSwipeNavigation?: boolean;
  children: ReactNode;
}) {
  const artworkRatio = useArtworkAspectRatio(imageUrl, aspectRatio);
  const [footerSpace, setFooterSpace] = useState(76);
  const swipe = useMobilePreviewSwipe({
    enabled: open && mobileSwipeNavigation,
    direction: "right",
    onSwipe: onClose,
  });
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          data-mobile-swipe={mobileSwipeNavigation ? "true" : undefined}
          className={`${styles.overlay} fixed inset-0 z-[7000] bg-neutral-950`}
        />
        <Dialog.Content
          {...swipe}
          data-artwork-preview
          data-mobile-swipe={mobileSwipeNavigation ? "true" : undefined}
          data-has-toolbar={toolbar ? "true" : undefined}
          data-has-footer={footer ? "true" : undefined}
          aria-describedby={undefined}
          className={`${styles.viewportFrame} ${styles.content}`}
          style={{
            "--artwork-preview-ratio": artworkRatio,
            ...(footer ? { "--artwork-preview-footer-space": `${footerSpace}px` } : {}),
          } as CSSProperties}
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
            {downloadAction}
            <Dialog.Close asChild>
              <button type="button" aria-label="Close preview" className={chromeButtonClassName}>
                <X size={21} aria-hidden="true" />
              </button>
            </Dialog.Close>
          </div>
          {children}
          {footer ? <PreviewFooter onHeight={setFooterSpace}>{footer}</PreviewFooter> : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
