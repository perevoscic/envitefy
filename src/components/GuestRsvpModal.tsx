"use client";

import { useState, FormEvent, useEffect, useCallback } from "react";
import { useTheme } from "@/app/providers";

export type RsvpResponse = "yes" | "no" | "maybe" | null;

interface GuestRsvpModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  rsvpDeadline?: string;
  initialResponse?: Exclude<RsvpResponse, null> | null;
  themeColors?: {
    primary: string;
    secondary: string;
  };
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const yyyy = date.getUTCFullYear();
  return `${mm}-${dd}-${yyyy}`;
}

export default function GuestRsvpModal({
  isOpen,
  onClose,
  eventId,
  eventTitle,
  rsvpDeadline,
  initialResponse,
  themeColors,
}: GuestRsvpModalProps) {
  const { theme } = useTheme();
  
  const [response, setResponse] = useState<RsvpResponse>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const closeModal = useCallback(() => {
    setError(null);
    onClose();
  }, [onClose]);

  // Pre-fill from local storage if available
  useEffect(() => {
    if (isOpen) {
      const savedInfo = localStorage.getItem("envitefy_rsvp_guest_info");
      if (savedInfo) {
        try {
          const data = JSON.parse(savedInfo);
          setFirstName(data.firstName || "");
          setLastName(data.lastName || "");
          setPhone(data.phone || "");
        } catch (e) {}
      }
      setResponse(initialResponse || null);
      setError(null);
    }
  }, [initialResponse, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeModal, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!response) {
      setError("Please select if you are coming!");
      return;
    }
    if (!firstName || !lastName || !phone) {
      setError("Please fill in your name and phone number");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/events/${eventId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          response,
          firstName,
          lastName,
          phone,
          message,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        // Save info for next time
        localStorage.setItem("envitefy_rsvp_guest_info", JSON.stringify({
          firstName,
          lastName,
          phone
        }));
        
        // Dispatch event for dashboard refresh
        window.dispatchEvent(new CustomEvent("rsvp-submitted"));
        
        // Close after delay
        setTimeout(() => {
          closeModal();
          // Reset state
          setTimeout(() => {
             setResponse(null);
             setMessage("");
             setSuccess(false);
          }, 500);
        }, 2000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to submit RSVP");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const primaryColor = themeColors?.primary || "#4f46e5"; // Indigo-600 default
  const secondaryColor = themeColors?.secondary || "#ec4899"; // Pink-500 default

  const responseLabel =
    response === "yes"
      ? "Yes, I'm in"
      : response === "maybe"
      ? "Maybe"
      : response === "no"
      ? "No"
      : "";

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={closeModal}
    >
      <div 
        className="relative w-full max-w-xl overflow-hidden rounded-[2.25rem] border border-white/20 bg-white shadow-2xl animate-in zoom-in-95 duration-300 dark:bg-slate-900"
        style={{ colorScheme: theme === 'dark' ? 'dark' : 'light' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full blur-3xl" style={{ backgroundColor: `${primaryColor}16` }}></div>
        <div className="absolute -bottom-24 -left-20 h-56 w-56 rounded-full blur-3xl" style={{ backgroundColor: `${secondaryColor}14` }}></div>

        <button 
          type="button"
          onClick={closeModal}
          aria-label="Close RSVP dialog"
          className="absolute right-5 top-5 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-black/5 hover:text-slate-900 dark:hover:bg-white/5 dark:hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        <div className="relative z-10 max-h-[90vh] overflow-y-auto p-8 md:p-10 custom-scrollbar">
          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <header className="mb-2 space-y-3">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                  RSVP
                </p>
                <h2 className="text-3xl font-black leading-tight tracking-tight text-slate-900 dark:text-white md:text-4xl">
                  RSVP for {eventTitle}
                </h2>
                {rsvpDeadline && (
                  <p className="text-sm font-medium text-slate-500">
                    Please reply by {formatDate(rsvpDeadline)}.
                  </p>
                )}
              </header>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                  Response
                </label>
                {initialResponse ? (
                  <div
                    className="rounded-[1.4rem] border px-4 py-4"
                    style={{
                      borderColor: `${primaryColor}3d`,
                      backgroundColor: `${primaryColor}0f`,
                    }}
                  >
                    <p className="text-sm font-semibold text-slate-500">
                      Selected from the event page
                    </p>
                    <p className="mt-1 text-lg font-black text-slate-900 dark:text-white">
                      {responseLabel}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/60">
                    <select
                      required
                      value={response || ""}
                      onChange={(event) =>
                        setResponse((event.target.value as Exclude<RsvpResponse, null>) || null)
                      }
                      className="w-full bg-transparent text-base font-semibold text-slate-900 outline-none dark:text-white"
                    >
                      <option value="">Select your response</option>
                      <option value="yes">Yes, I&apos;m in</option>
                      <option value="maybe">Maybe</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="ml-1 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">First Name</label>
                    <input
                      required
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="John"
                      className="w-full rounded-[1.15rem] border border-slate-200 bg-slate-50 p-3.5 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-slate-300 focus:bg-white dark:border-slate-800 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-900"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="ml-1 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Last Name</label>
                    <input
                      required
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      className="w-full rounded-[1.15rem] border border-slate-200 bg-slate-50 p-3.5 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-slate-300 focus:bg-white dark:border-slate-800 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-900"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="ml-1 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Phone Number</label>
                  <input
                    required
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 000-0000"
                    className="w-full rounded-[1.15rem] border border-slate-200 bg-slate-50 p-3.5 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-slate-300 focus:bg-white dark:border-slate-800 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="ml-1 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Leave a Message</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="We're so excited! See you there!"
                    rows={3}
                    className="w-full resize-none rounded-[1.15rem] border border-slate-200 bg-slate-50 p-3.5 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-slate-300 focus:bg-white dark:border-slate-800 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-900"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-[1.15rem] border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 dark:border-red-500/20 dark:bg-red-500/10">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 flex h-[58px] w-full items-center justify-center gap-3 rounded-full text-lg font-black text-white shadow-xl transition-all hover:scale-[1.01] active:scale-[0.98] disabled:scale-100 disabled:opacity-70"
                style={{ backgroundColor: primaryColor, color: "#fff" }}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending RSVP...
                  </>
                ) : "Confirm RSVP"}
              </button>
            </form>
          ) : (
            <div className="space-y-6 py-20 text-center animate-in zoom-in-95 duration-500">
              <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <h2 className="text-4xl font-black text-slate-900 dark:text-white">RSVP Sent</h2>
              <p className="text-xl font-medium text-slate-500 dark:text-slate-400">
                The host has been notified.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
