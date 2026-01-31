"use client";

import { useState, FormEvent, useEffect } from "react";
import { useTheme } from "@/app/providers";

type RsvpResponse = "yes" | "no" | "maybe" | null;

interface GuestRsvpModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  rsvpDeadline?: string;
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
    }
  }, [isOpen]);

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
          onClose();
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

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300"
        style={{ colorScheme: theme === 'dark' ? 'dark' : 'light' }}
      >
        {/* Animated Background Blob */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl" style={{ backgroundColor: `${primaryColor}1a` }}></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-secondary/10 rounded-full blur-3xl" style={{ backgroundColor: `${secondaryColor}1a` }}></div>

        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        <div className="p-8 md:p-10 relative z-10 max-h-[90vh] overflow-y-auto custom-scrollbar">
          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <header className="mb-6">
                <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-1 text-slate-900 dark:text-white leading-tight">
                  RSVP for {eventTitle}
                </h2>
                {rsvpDeadline && (
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    Deadline: {formatDate(rsvpDeadline)}
                  </p>
                )}
              </header>

              <div className="space-y-4">
                <p className="text-base text-slate-600 dark:text-slate-300 font-bold ml-1">
                  Will you be joining us?
                </p>
                
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'yes', label: 'Yes!', icon: '✨' },
                    { id: 'maybe', label: 'Maybe', icon: '🤔' },
                    { id: 'no', label: 'No', icon: '😔' }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setResponse(opt.id as any)}
                      className={`flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl border-2 transition-all duration-200 ${
                        response === opt.id 
                          ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10' 
                          : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-white dark:bg-slate-800/50'
                      }`}
                    >
                      <span className="text-lg sm:text-xl mb-1">{opt.icon}</span>
                      <span className={`text-[10px] sm:text-sm font-black uppercase tracking-tight ${response === opt.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-200'}`}>
                        {opt.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">First Name</label>
                    <input
                      required
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="John"
                      className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none font-bold text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Last Name</label>
                    <input
                      required
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none font-bold text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Phone Number</label>
                  <input
                    required
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 000-0000"
                    className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none font-bold text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Leave a Message (Optional)</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="We're so excited! See you there!"
                    rows={3}
                    className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none font-bold text-sm resize-none"
                  />
                </div>
              </div>

              {error && (
                <p className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-500/10 p-3 rounded-xl border border-red-100 dark:border-red-500/20">
                  ⚠️ {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4.5 rounded-2xl font-black text-lg shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70 disabled:scale-100 mt-2"
                style={{ backgroundColor: primaryColor, color: '#fff', height: '60px' }}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    SENDING...
                  </>
                ) : 'CONFIRM RSVP'}
              </button>
            </form>
          ) : (
            <div className="py-20 text-center space-y-6 animate-in zoom-in-95 duration-500">
              <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <h2 className="text-4xl font-black text-slate-900 dark:text-white">RSVP Sent!</h2>
              <p className="text-xl text-slate-500 dark:text-slate-400 font-medium">
                Awesome! The host has been notified. <br/> See you there! 🎉
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
