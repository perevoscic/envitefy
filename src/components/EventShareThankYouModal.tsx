"use client";

import { useEffect } from "react";

export type EventShareThankYouModalProps = {
  open: boolean;
  onClose: () => void;
  recipientEmail?: string;
};

export default function EventShareThankYouModal({
  open,
  onClose,
  recipientEmail,
}: EventShareThankYouModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  // Auto-close after 3.5 seconds
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        onClose();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-transparent backdrop-blur-[3px] backdrop-saturate-125"
        onClick={onClose}
      />
      {/* Modal Content */}
      <div className="relative w-full sm:w-[480px] max-w-[92vw]">
        {/* Card */}
        <div className="relative bg-surface text-foreground border border-border rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="text-center">
            {/* Success Icon */}
            <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                />
              </svg>
            </div>

            {/* Thank You Message */}
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Event Shared!
            </h2>
            <p className="text-foreground/80 mb-2">
              {recipientEmail ? (
                <>
                  Your event invitation has been sent to{" "}
                  <span className="font-medium">{recipientEmail}</span>
                </>
              ) : (
                "Your event invitation has been sent successfully"
              )}
            </p>
            <p className="text-sm text-foreground/60 mb-6">
              They'll receive an email and can accept the invitation to add it
              to their calendar.
            </p>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-2xl px-6 py-3 text-base font-semibold bg-blue-500 hover:bg-blue-400 active:bg-blue-600 text-white shadow-lg shadow-blue-500/25 transition-colors duration-200"
            >
              Got it
            </button>
          </div>
        </div>

        {/* Close button in top-right corner */}
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute top-2 right-2 sm:top-3 sm:right-3 inline-flex items-center justify-center h-10 w-10 rounded-2xl border border-border bg-surface/70 text-foreground/80 hover:text-foreground hover:bg-surface/90 shadow-sm z-20 pointer-events-auto touch-manipulation"
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
    </div>
  );
}
