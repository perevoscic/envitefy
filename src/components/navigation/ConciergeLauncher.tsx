"use client";

import styles from "./concierge-launcher.module.css";

export default function ConciergeLauncher({
  visible = true,
  open = false,
  onOpen,
}: {
  visible?: boolean;
  open?: boolean;
  onOpen: () => void;
}) {
  return (
    <div className={styles.launcher} data-concierge-launcher data-visible={visible} data-open={open} aria-hidden={!visible} inert={!visible}>
      <button
        type="button"
        className={styles.button}
        onClick={onOpen}
        aria-label={open ? "Minimize Envitefy Concierge" : "Open Envitefy Concierge"}
        title={open ? "Minimize Envitefy Concierge" : "Chat with Envitefy Concierge"}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className={styles.symbol} aria-hidden="true" />
      </button>
    </div>
  );
}
