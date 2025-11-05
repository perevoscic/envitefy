"use client";
import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

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
  const { data: session } = useSession();
  const router = useRouter();

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
        }
      } catch {}

      // Redirect to home page after successful deletion
      router.push("/");
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

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[400]">
          <div className="bg-background border border-border rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
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
                <p className="text-foreground/80 mb-2">
                  Are you sure you want to delete this event?
                </p>
                <div className="bg-surface border border-border rounded-md p-3">
                  <p className="font-medium text-foreground">{eventTitle}</p>
                </div>
                <p className="text-sm text-red-600 mt-2">
                  This action cannot be undone.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm text-foreground/70 hover:text-foreground border border-border rounded-md hover:bg-surface transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? "Deleting..." : "Delete Event"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
