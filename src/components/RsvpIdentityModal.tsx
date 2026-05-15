"use client";

import { FormEvent, useEffect, useState } from "react";

type RsvpIdentityModalProps = {
  eventTitle: string;
  hostName?: string | null;
  initialName?: string | null;
  initialEmail?: string | null;
  onClose: () => void;
  onSubmit: (identity: { name: string; email: string }) => void;
};

export default function RsvpIdentityModal({
  eventTitle,
  hostName,
  initialName,
  initialEmail,
  onClose,
  onSubmit,
}: RsvpIdentityModalProps) {
  const [name, setName] = useState(String(initialName || "").trim());
  const [email, setEmail] = useState(String(initialEmail || "").trim());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName) {
      setError("Please enter your name.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email.");
      return;
    }
    setError(null);
    onSubmit({ name: trimmedName, email: trimmedEmail });
  };

  return (
    <div className="fixed inset-0 z-[7200] flex items-center justify-center bg-black/45 px-4 py-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="rsvp-identity-title"
        className="relative w-full max-w-md rounded-[1.75rem] border border-black/10 bg-white p-6 text-[#1f1633] shadow-2xl"
      >
        <button
          type="button"
          aria-label="Close RSVP details"
          onClick={onClose}
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-[#6f6286] transition hover:bg-[#f3eefc] hover:text-[#2f1f45]"
        >
          <span aria-hidden="true">x</span>
        </button>
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#7c5cff]">RSVP</p>
        <h2 id="rsvp-identity-title" className="mt-2 pr-8 text-2xl font-black tracking-tight">
          Send your RSVP
        </h2>
        <p className="mt-2 text-sm font-medium leading-6 text-[#6f6286]">
          We will add your name and email to the message for {hostName?.trim() || "the host"}.
        </p>
        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-bold text-[#3f3269]">
            Name
            <input
              type="text"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-[#ded7f4] bg-[#fbf9ff] px-4 py-3 text-base font-semibold text-[#1f1633] outline-none transition focus:border-[#7c5cff] focus:ring-2 focus:ring-[#7c5cff]/20"
            />
          </label>
          <label className="block text-sm font-bold text-[#3f3269]">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-[#ded7f4] bg-[#fbf9ff] px-4 py-3 text-base font-semibold text-[#1f1633] outline-none transition focus:border-[#7c5cff] focus:ring-2 focus:ring-[#7c5cff]/20"
            />
          </label>
          {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-[#ded7f4] px-4 py-2 text-sm font-bold text-[#5f5289] transition hover:bg-[#f7f2ff]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-full bg-[#5b3cc4] px-5 py-2 text-sm font-black text-white shadow-lg shadow-[#5b3cc4]/20 transition hover:bg-[#4b2eb2]"
            >
              Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
