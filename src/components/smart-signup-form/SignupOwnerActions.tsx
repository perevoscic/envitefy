"use client";

import { Copy, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import EventDeleteModal from "@/components/EventDeleteModal";
import type { SignupForm } from "@/types/signup";
import { resolveEditHref } from "@/utils/event-edit-route";
import styles from "./signup-theme.module.css";

export default function SignupOwnerActions({
  eventId,
  eventTitle,
  eventData,
  form,
}: {
  eventId: string;
  eventTitle: string;
  eventData: Record<string, unknown>;
  form: SignupForm;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const duplicate = () => {
    try {
      const dataCopy: Record<string, unknown> = {
        ...eventData,
        signupForm: { ...form, responses: [], revision: 0, availability: undefined },
      };
      delete dataCopy.shared;
      delete dataCopy.sharedOut;
      sessionStorage.setItem(
        "snapmydate:signup-duplicate",
        JSON.stringify({ originalTitle: eventTitle, dataCopy }),
      );
      router.push("/smart-signup-form?duplicate=1");
    } catch {
      setError("This browser could not retain the copy. Free some browser storage and try again.");
    }
  };

  return (
    <>
      <nav aria-label="Manage signup form" className={styles.ownerToolbar}>
        <Link
          href={resolveEditHref(eventId, eventData, eventTitle)}
          className={styles.ownerButton}
          title="Edit event"
          aria-label="Edit event"
        >
          <Pencil className="size-4" aria-hidden="true" />
          <span className={styles.ownerLabel}>Edit</span>
        </Link>
        <button
          type="button"
          onClick={duplicate}
          className={styles.ownerButton}
          title="Duplicate form"
          aria-label="Duplicate form"
        >
          <Copy className="size-4" aria-hidden="true" />
          <span className={styles.ownerLabel}>Duplicate</span>
        </button>
        <EventDeleteModal
          eventId={eventId}
          eventTitle={eventTitle}
          buttonClassName={`${styles.ownerButton} text-red-700`}
          ariaLabel="Delete event"
        >
          <Trash2 className="size-4" aria-hidden="true" />
          <span className={styles.ownerLabel}>Delete</span>
        </EventDeleteModal>
      </nav>
      {error && (
        <p role="alert" className={styles.ownerError}>
          {error}
        </p>
      )}
    </>
  );
}
