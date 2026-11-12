"use client";

import * as Dialog from "@radix-ui/react-dialog";
import DiscoveryProgressPanel, { type DiscoveryProgressTheme } from "./DiscoveryProgressPanel";
import styles from "./discovery-progress-dialog.module.css";

export default function DiscoveryProgressDialog({
  open, label, progress, theme, onCancel, onReturnFocus,
}: {
  open: boolean;
  label: string;
  progress: number;
  theme: DiscoveryProgressTheme;
  onCancel: () => void;
  onReturnFocus: () => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={next => { if (!next && progress < 100) onCancel(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content
          className={styles.content}
          aria-describedby={undefined}
          onPointerDownOutside={event => event.preventDefault()}
          onInteractOutside={event => event.preventDefault()}
          onCloseAutoFocus={event => { event.preventDefault(); onReturnFocus(); }}
        >
          <Dialog.Title className={styles.title}>Importing meet details</Dialog.Title>
          <div className={styles.body}>
            <DiscoveryProgressPanel
              cancelLabel="Cancel import"
              cancelDisabled={progress >= 100}
              label={label}
              progress={progress}
              onCancel={onCancel}
              showDetails={false}
              theme={theme}
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
