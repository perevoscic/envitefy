"use client";

import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  Gift,
  MapPin,
  Minus,
  Plus,
  Utensils,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type DemoPanel = "rsvp" | "details" | "gifts";
type RsvpChoice = "Going" | "Maybe" | "Not going";

const panelLabels: { id: DemoPanel; label: string }[] = [
  { id: "rsvp", label: "RSVP" },
  { id: "details", label: "Details" },
  { id: "gifts", label: "Gifts" },
];

function CountControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[#eadfd8] px-3 py-2.5">
      <span className="text-sm font-medium text-[#65544b]">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`Remove one ${label.toLowerCase()}`}
          onClick={() => onChange(Math.max(0, value - 1))}
          className="grid h-8 w-8 place-items-center rounded-full bg-[#f4ebe5] transition hover:bg-[#eadbd1]"
        >
          <Minus className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        <span className="w-4 text-center text-sm font-bold">{value}</span>
        <button
          type="button"
          aria-label={`Add one ${label.toLowerCase()}`}
          onClick={() => onChange(value + 1)}
          className="grid h-8 w-8 place-items-center rounded-full bg-[#2f694b] text-white transition hover:bg-[#25563d]"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export default function BirthdayInvitationDemo({ primaryHref }: { primaryHref: string }) {
  const [activePanel, setActivePanel] = useState<DemoPanel>("rsvp");
  const [rsvpChoice, setRsvpChoice] = useState<RsvpChoice>("Going");
  const [kids, setKids] = useState(2);
  const [adults, setAdults] = useState(2);

  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/65 bg-white/95 text-[#2d211c] shadow-[0_32px_90px_rgba(44,27,18,0.24)] backdrop-blur-xl">
      <div className="flex items-center gap-3 border-b border-[#eadfd8] p-5">
        <Image
          src="/phone-placeholders/birthday-maya.jpeg"
          alt="Maya"
          width={52}
          height={52}
          className="h-12 w-12 rounded-full object-cover ring-4 ring-[#fff1e8]"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--birthday-accent)]">
            Maya is turning eight
          </p>
          <h3 className="truncate text-xl font-semibold tracking-[-0.03em]">Rainbow Park Party</h3>
        </div>
      </div>

      <div className="grid grid-cols-3 border-b border-[#eadfd8]" role="tablist">
        {panelLabels.map((panel) => (
          <button
            key={panel.id}
            id={`birthday-demo-tab-${panel.id}`}
            type="button"
            role="tab"
            aria-controls={`birthday-demo-panel-${panel.id}`}
            aria-selected={activePanel === panel.id}
            onClick={() => setActivePanel(panel.id)}
            className={`min-h-12 border-b-2 px-3 text-xs font-bold transition ${
              activePanel === panel.id
                ? "border-[var(--birthday-accent)] text-[var(--birthday-accent)]"
                : "border-transparent text-[#806d62] hover:text-[#2d211c]"
            }`}
          >
            {panel.label}
          </button>
        ))}
      </div>

      <div className="min-h-[23rem] p-5 sm:p-6">
        {activePanel === "rsvp" ? (
          <div
            id="birthday-demo-panel-rsvp"
            role="tabpanel"
            aria-labelledby="birthday-demo-tab-rsvp"
          >
            <div className="flex items-center justify-between gap-4">
              <p className="font-semibold">Will your family join us?</p>
              <span className="rounded-full bg-[#e6f3e9] px-2.5 py-1 text-[10px] font-bold text-[#2e6a48]">
                OPEN
              </span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {(["Going", "Maybe", "Not going"] as const).map((choice) => (
                <button
                  key={choice}
                  type="button"
                  aria-pressed={rsvpChoice === choice}
                  onClick={() => setRsvpChoice(choice)}
                  className={`min-h-10 rounded-xl px-2 text-xs font-bold transition ${
                    rsvpChoice === choice
                      ? "bg-[#2f694b] text-white"
                      : "border border-[#eadfd8] text-[#806d62] hover:border-[#cbb9ad]"
                  }`}
                >
                  {choice}
                </button>
              ))}
            </div>
            <div className="mt-4 grid gap-2">
              <CountControl label="Kids" value={kids} onChange={setKids} />
              <CountControl label="Adults" value={adults} onChange={setAdults} />
            </div>
            <label className="mt-4 block text-xs font-bold text-[#65544b]">
              Allergy or food notes
              <input
                type="text"
                placeholder="Optional"
                className="mt-2 min-h-11 w-full rounded-xl border border-[#eadfd8] bg-white px-3 text-sm font-normal outline-none transition placeholder:text-[#aa9a91] focus:border-[var(--birthday-accent)]"
              />
            </label>
          </div>
        ) : null}

        {activePanel === "details" ? (
          <div
            id="birthday-demo-panel-details"
            className="space-y-3"
            role="tabpanel"
            aria-labelledby="birthday-demo-tab-details"
          >
            <div className="flex gap-3 rounded-2xl bg-[#fff3eb] p-4">
              <CalendarDays
                className="mt-0.5 h-5 w-5 text-[var(--birthday-accent)]"
                aria-hidden="true"
              />
              <div>
                <p className="font-semibold">Saturday, May 16</p>
                <p className="mt-1 text-sm text-[#806d62]">Rain or shine</p>
              </div>
            </div>
            <div className="flex gap-3 rounded-2xl bg-[#f1f5ed] p-4">
              <Clock3 className="mt-0.5 h-5 w-5 text-[#3c6c4f]" aria-hidden="true" />
              <div>
                <p className="font-semibold">2:00–4:00 PM</p>
                <p className="mt-1 text-sm text-[#667168]">Pickup begins at 3:50</p>
              </div>
            </div>
            <div className="flex gap-3 rounded-2xl border border-[#eadfd8] p-4">
              <MapPin className="mt-0.5 h-5 w-5 text-[var(--birthday-accent)]" aria-hidden="true" />
              <div>
                <p className="font-semibold">Oak Pavilion</p>
                <p className="mt-1 text-sm leading-6 text-[#806d62]">
                  Use the east entrance. Free parking is beside the playground.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {activePanel === "gifts" ? (
          <div
            id="birthday-demo-panel-gifts"
            role="tabpanel"
            aria-labelledby="birthday-demo-tab-gifts"
          >
            <div className="rounded-2xl bg-[#fff3eb] p-5 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white text-[var(--birthday-accent)] shadow-sm">
                <Gift className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className="mt-4 font-semibold">Your presence is the best present</p>
              <p className="mt-2 text-sm leading-6 text-[#806d62]">
                If you would like to bring something, Maya is saving for a new bike.
              </p>
            </div>
            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-[#eadfd8] p-4">
              <Utensils className="h-5 w-5 text-[var(--birthday-accent)]" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold">Pizza and cake are covered</p>
                <p className="text-xs text-[#806d62]">Allergy-friendly options available</p>
              </div>
            </div>
          </div>
        ) : null}

        <Link
          href={primaryHref}
          className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[var(--birthday-ink)] px-5 text-sm font-bold text-white transition hover:bg-[#49372e]"
        >
          Create a page like this
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[10px] font-semibold text-[#8b7a70]">
          <Check className="h-3 w-3" aria-hidden="true" />
          This preview is interactive
        </p>
      </div>
    </div>
  );
}
