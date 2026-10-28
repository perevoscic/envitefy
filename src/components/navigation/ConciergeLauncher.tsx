"use client";

import type { Ref } from "react";
import styles from "./concierge-launcher.module.css";

export default function ConciergeLauncher({
  visible = true,
  open = false,
  onOpen,
  buttonRef,
}: {
  visible?: boolean;
  open?: boolean;
  onOpen: () => void;
  buttonRef?: Ref<HTMLButtonElement>;
}) {
  return (
    <>
      {visible && (
        <link rel="preload" as="image" href="/brand/responsive-v1/concierge-gold-168.webp" type="image/webp" crossOrigin="anonymous" fetchPriority="high" />
      )}
      <div className={styles.launcher} data-concierge-launcher data-visible={visible} data-open={open} aria-hidden={!visible} inert={!visible}>
        <button
          ref={buttonRef}
          type="button"
          className={styles.button}
          onClick={onOpen}
          aria-label={open ? "Minimize Envitefy Concierge" : "Open Envitefy Concierge"}
          title={open ? "Minimize Envitefy Concierge" : "Chat with Envitefy Concierge"}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <img src="/brand/responsive-v1/concierge-gold-168.webp" width={56} height={56} alt="" aria-hidden="true" className={styles.symbol} loading="eager" decoding="async" fetchPriority="high" crossOrigin="anonymous" />
        </button>
      </div>
    </>
  );
}
