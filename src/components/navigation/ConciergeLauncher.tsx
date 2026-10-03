"use client";

import { MessageCircle } from "lucide-react";
import styles from "./concierge-launcher.module.css";

export default function ConciergeLauncher({
  visible,
  onOpen,
}: {
  visible: boolean;
  onOpen: () => void;
}) {
  return (
    <div className={styles.launcher} data-visible={visible} aria-hidden={!visible} inert={!visible}>
      <button
        type="button"
        className={styles.button}
        onClick={onOpen}
        aria-label="Open Envitefy Concierge"
        aria-haspopup="dialog"
      >
        <MessageCircle size={24} aria-hidden="true" />
        <span className={styles.copy}>
          <span className={styles.title}>Concierge</span>
          <span className={styles.subtitle}>Questions? Ask Envitefy</span>
        </span>
      </button>
    </div>
  );
}
