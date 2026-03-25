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
        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
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
          <div className="fixed inset-0 z-[13000] flex items-center justify-center overflow-y-auto bg-black/50 p-3 sm:p-4">
            <div className="w-[min(92vw,24rem)] rounded-lg border border-border bg-background">
              <div className="p-4 sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-red-600">
                    Delete Event
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="text-foreground/50 hover:text-foreground"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                <div className="mb-6">
                  <p className="mb-2 text-foreground/80">
                    Are you sure you want to delete this event?
                  </p>
                  <div className="rounded-md border border-border bg-surface p-3">
                    <p className="break-words font-medium text-foreground">
                      {eventTitle}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-red-600">
                    This action cannot be undone.
                  </p>
                </div>

                <div className="flex flex-row justify-end gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="rounded-md border border-border px-3 sm:px-4 py-2 text-sm text-foreground/70 transition-colors hover:bg-surface hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="rounded-md bg-red-600 px-3 sm:px-4 py-2 text-sm text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
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
