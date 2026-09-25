"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Sparkles } from "lucide-react";
import { LiveCardIcon } from "@/components/icons/LiveCardIcon";
import styles from "./publish-progress.module.css";

export type PublishStage = "locations" | "wording" | "lettering" | "saving" | "publishing";

export const PUBLISH_STAGES: Record<PublishStage, { title: string; description: string }> = {
  locations: {
    title: "Confirming the places",
    description: "Checking your venues and their local times.",
  },
  wording: {
    title: "Polishing your words",
    description: "Checking spelling and grammar while keeping your event details intact.",
  },
  lettering: {
    title: "Bringing your title to life",
    description:
      "Drawing and checking lettering that belongs to your design. This can take a few minutes.",
  },
  saving: {
    title: "Putting it all together",
    description: "Saving your finished artwork and preparing the card for your guests.",
  },
  publishing: {
    title: "Publishing your Live Card",
    description: "Saving your event details and making your card ready for guests.",
  },
};

export default function PublishProgress({
  open,
  stage,
  imageUrl,
  onCancel,
  updating = false,
}: {
  open: boolean;
  stage: PublishStage;
  imageUrl?: string;
  onCancel?: () => void;
  updating?: boolean;
}) {
  const current = updating && stage === "publishing"
    ? { title: "Saving your changes", description: "Updating your live event and card for your guests." }
    : PUBLISH_STAGES[stage];
  return (
    <Dialog.Root open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.backdrop} />
        <Dialog.Content
          className={styles.screen}
          data-publish-progress={stage}
          onEscapeKeyDown={(event) => {
            event.preventDefault();
            onCancel?.();
          }}
          onPointerDownOutside={(event) => event.preventDefault()}
        >
          <div className={styles.layout}>
            <div className={styles.scene} aria-hidden="true">
              <div className={styles.halo} />
              <div className={styles.card}>
                {imageUrl ? <img src={imageUrl} alt="" /> : <LiveCardIcon size={64} />}
                <div className={styles.sheen} />
              </div>
              <span className={styles.sparkle}>
                <Sparkles size={25} />
              </span>
            </div>
            <div className={styles.copy}>
              <p className={styles.eyebrow}>
                <LiveCardIcon size={20} /> LIVE CARD
              </p>
              <Dialog.Title className={styles.title}>A little magic. All yours.</Dialog.Title>
              <Dialog.Description className={styles.description}>
                {updating ? "We’re updating your Live Card." : "We’re getting your Live Card ready to share."}
              </Dialog.Description>
              <div className={styles.status} role="status" aria-live="polite" aria-atomic="true">
                <strong>{current.title}</strong>
                <p>{current.description}</p>
              </div>
              <div
                className={styles.track}
                role="progressbar"
                aria-label={current.title}
                aria-valuetext="In progress"
              >
                <span />
              </div>
              {onCancel ? (
                <button type="button" className={styles.cancel} onClick={onCancel}>
                  Cancel and keep editing
                </button>
              ) : (
                <p className={styles.stay}>Keep this page open while we finish.</p>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
