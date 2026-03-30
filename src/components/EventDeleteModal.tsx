"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { emitEventCacheInvalidation } from "@/app/event-cache-context";

interface EventDeleteModalProps {
  eventId: string;
  eventTitle: string;
}

export default function EventDeleteModal({
  eventId,
  eventTitle,
}: EventDeleteModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleDelete = async () => {
    if (!session) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/history/${eventId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete event");
      }

      // Notify other views (e.g., calendar/sidebar) that this history row was deleted
      try {
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("history:deleted", { detail: { id: eventId } })
          );
          emitEventCacheInvalidation({
            force: true,
            source: "event-delete-modal",
          });
        }
      } catch {}

      // Redirect to home page after successful deletion
      router.replace("/");
      router.refresh();
    } catch (error) {
      console.error("Failed to delete event:", error);
      alert("Failed to delete event. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!session) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-error transition-colors hover:bg-error/10 hover:text-error"
        title="Delete event"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <polyline points="3,6 5,6 21,6" />
          <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
        <span className="hidden sm:inline">Delete</span>
      </button>

      {isMounted &&
        isOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[13000] flex items-center justify-center overflow-y-auto p-3 sm:p-4"
            role="presentation"
          >
            <div
              className="absolute inset-0 bg-[rgba(24,14,10,0.45)] backdrop-blur-[6px] backdrop-saturate-150"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="event-delete-modal-title"
              className="relative z-10 w-full sm:w-[min(92vw,24rem)] max-w-[92vw] rounded-2xl border border-border bg-surface text-foreground shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 sm:p-6">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <h2
                    id="event-delete-modal-title"
                    className="font-[family-name:var(--font-playfair),Georgia,serif] text-xl font-semibold tracking-tight text-foreground"
                  >
                    Delete Event
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-border text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                    aria-label="Close"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                <div className="mb-6">
                  <p className="mb-2 text-sm text-muted-foreground">
                    Are you sure you want to delete this event?
                  </p>
                  <div className="rounded-xl border border-border bg-background p-3">
                    <p className="break-words text-sm font-medium text-foreground">
                      {eventTitle}
                    </p>
                  </div>
                  <p className="mt-2 text-sm font-medium text-error">
                    This action cannot be undone.
                  </p>
                </div>

                <div className="flex flex-row justify-end gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-background hover:text-foreground sm:px-4"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="rounded-xl bg-error px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
                  >
                    {isLoading ? "Deleting..." : "Delete Event"}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
