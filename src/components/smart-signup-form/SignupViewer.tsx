"use client";

import React, { useEffect, useMemo, useRef, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import EventEditModal from "@/components/EventEditModal";
import EventDeleteModal from "@/components/EventDeleteModal";
import type { SignupForm, SignupResponse } from "@/types/signup";
import {
  countConfirmedForSlot,
  countWaitlistedForSlot,
  findSignupResponseForUser,
  getSlotCapacity,
  normalizeSignupQuantity,
  remainingCapacityForSlot,
} from "@/utils/signup";

type ViewerKind = "owner" | "guest" | "readonly";

type Props = {
  eventId: string;
  initialForm: SignupForm;
  viewerKind: ViewerKind;
  viewerId?: string | null;
  viewerName?: string | null;
  viewerEmail?: string | null;
  ownerEventTitle?: string;
  ownerEventData?: any;
};

type ReserveRequestPayload = {
  action: "reserve";
  slots: Array<{ sectionId: string; slotId: string; quantity: number }>;
  name: string;
  note?: string;
  guests?: number;
  answers?: Array<{ questionId: string; value: string }>;
  email?: string;
  phone?: string;
  signupId?: string;
};

type SignupApiResponse = {
  ok?: boolean;
  error?: string;
  signupForm?: SignupForm;
  response?: SignupResponse;
  status?: string;
};

type SlotSelectionMap = Record<string, number>;

const slotKey = (sectionId: string, slotId: string) =>
  `${sectionId}::${slotId}`;

const formatTime = (value?: string | null): string | null => {
  if (!value) return null;
  const [hourPart, minutePart] = value.split(":");
  const hour = Number.parseInt(hourPart || "0", 10);
  const minute = Number.parseInt(minutePart || "0", 10);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return value;
  const suffix = hour >= 12 ? "PM" : "AM";
  const normalizedHour = ((hour + 11) % 12) + 1;
  const paddedMinute = minute.toString().padStart(2, "0");
  return `${normalizedHour}:${paddedMinute} ${suffix}`;
};

const formatSlotRange = (
  start?: string | null,
  end?: string | null
): string | null => {
  const startLabel = formatTime(start);
  const endLabel = formatTime(end);
  if (startLabel && endLabel) return `${startLabel} – ${endLabel}`;
  if (startLabel) return `Starts ${startLabel}`;
  if (endLabel) return `Ends ${endLabel}`;
  return null;
};

const summarizeResponseSlots = (
  form: SignupForm,
  response: SignupResponse
): string => {
  const entries: string[] = [];
  for (const selection of response.slots || []) {
    const section = form.sections.find(
      (candidate) => candidate.id === selection.sectionId
    );
    const slot = section?.slots.find(
      (candidate) => candidate.id === selection.slotId
    );
    if (!section || !slot) continue;
    const quantity = normalizeSignupQuantity(selection.quantity ?? 1);
    const range = formatSlotRange(slot.startTime, slot.endTime);
    entries.push(
      `${section.title}: ${slot.label}${quantity > 1 ? ` ×${quantity}` : ""}${
        range ? ` (${range})` : ""
      }`
    );
  }
  return entries.join("; ");
};

const useStatusMessage = (message: string | null, timeoutMs: number) => {
  const [value, setValue] = useState(message);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (message) {
      setValue(message);
      timerRef.current = setTimeout(() => {
        setValue(null);
        timerRef.current = null;
      }, timeoutMs);
    } else {
      setValue(null);
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [message, timeoutMs]);

  return value;
};

const SignupViewer: React.FC<Props> = ({
  eventId,
  initialForm,
  viewerKind,
  viewerId,
  viewerName,
  viewerEmail,
  ownerEventTitle,
  ownerEventData,
}) => {
  const router = useRouter();
  const [form, setForm] = useState<SignupForm>(initialForm);
  const [selectedSlots, setSelectedSlots] = useState<SlotSelectionMap>({});
  const [name, setName] = useState<string>(
    (initialForm.responses.find((response) => response.userId === viewerId)
      ?.name ||
      viewerName ||
      "") as string
  );
  const [email, setEmail] = useState<string>(viewerEmail || "");
  const [phone, setPhone] = useState<string>("");
  const [guests, setGuests] = useState<number>(0);
  const [note, setNote] = useState<string>("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const feedback = useStatusMessage(serverMessage, 4000);
  const canInteract = viewerKind !== "readonly";
  const maxGuests = form.settings.maxGuestsPerSignup || 1;

  // Board-level capacity: total, filled (confirmed), remaining
  const { totalCapacity, filledCount, remainingCount, hasUnlimited } =
    useMemo(() => {
      let total = 0;
      let filled = 0;
      let unlimited = false;
      for (const section of form.sections) {
        for (const slot of section.slots) {
          const capacity = getSlotCapacity(slot);
          const confirmed = countConfirmedForSlot(form, section.id, slot.id);
          filled += confirmed;
          if (capacity === null) {
            unlimited = true;
          } else {
            total += capacity;
          }
        }
      }
      const remaining = unlimited
        ? Number.POSITIVE_INFINITY
        : Math.max(0, total - filled);
      return {
        totalCapacity: total,
        filledCount: filled,
        remainingCount: remaining,
        hasUnlimited: unlimited,
      };
    }, [form]);

  const myResponse = useMemo(
    () =>
      findSignupResponseForUser(
        form,
        viewerId || undefined,
        viewerEmail || undefined
      ),
    [form, viewerId, viewerEmail]
  );

  const lastResponseId = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const currentId = myResponse?.id || null;
    if (lastResponseId.current === currentId) return;
    lastResponseId.current = currentId;

    if (!myResponse) {
      setSelectedSlots((prev) => prev);
      setNote((prev) => prev);
      setGuests((prev) => prev);
      if (!name.trim() && viewerName) setName(viewerName);
      if (!email.trim() && viewerEmail) setEmail(viewerEmail);
      if (!canInteract) {
        setSelectedSlots({});
        setNote("");
        setGuests(0);
        setPhone("");
        setAnswers({});
      }
      return;
    }

    const slotSelections: SlotSelectionMap = {};
    for (const selection of myResponse.slots || []) {
      slotSelections[slotKey(selection.sectionId, selection.slotId)] =
        normalizeSignupQuantity(selection.quantity ?? 1);
    }
    setSelectedSlots(slotSelections);
    setName(myResponse.name || viewerName || "");
    if (form.settings.collectEmail) {
      setEmail(myResponse.email || viewerEmail || "");
    }
    if (form.settings.collectPhone) {
      setPhone(myResponse.phone || "");
    }
    setGuests(myResponse.guests || 0);
    setNote(myResponse.note || "");
    const mergedAnswers: Record<string, string> = {};
    for (const answer of myResponse.answers || []) {
      mergedAnswers[answer.questionId] = answer.value;
    }
    setAnswers(mergedAnswers);
  }, [
    myResponse,
    viewerName,
    viewerEmail,
    form.settings.collectEmail,
    form.settings.collectPhone,
    canInteract,
    name,
    email,
  ]);

  useEffect(() => {
    setSelectedSlots((prev) => {
      const valid = new Set<string>();
      for (const section of form.sections) {
        for (const slot of section.slots) {
          valid.add(slotKey(section.id, slot.id));
        }
      }
      const next: SlotSelectionMap = {};
      let changed = false;
      for (const [key, value] of Object.entries(prev)) {
        if (valid.has(key)) {
          next[key] = value;
        } else {
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [form.sections]);

  const selectedEntries = useMemo(() => {
    const entries: Array<{
      key: string;
      sectionId: string;
      slotId: string;
      sectionTitle: string;
      slotLabel: string;
      quantity: number;
      range: string | null;
    }> = [];
    for (const [key, quantity] of Object.entries(selectedSlots)) {
      const [sectionId, slotId] = key.split("::");
      const section = form.sections.find((s) => s.id === sectionId);
      const slot = section?.slots.find((s) => s.id === slotId);
      if (!section || !slot) continue;
      entries.push({
        key,
        sectionId,
        slotId,
        sectionTitle: section.title,
        slotLabel: slot.label,
        quantity,
        range: formatSlotRange(slot.startTime, slot.endTime),
      });
    }
    return entries;
  }, [selectedSlots, form.sections]);

  const handleToggleSlot = (sectionId: string, slotId: string) => {
    if (!canInteract || loading) return;
    const key = slotKey(sectionId, slotId);
    setSelectedSlots((prev) => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
        return next;
      }
      if (!form.settings.allowMultipleSlotsPerPerson) {
        return { [key]: 1 };
      }
      next[key] = 1;
      return next;
    });
  };

  const handleQuantityChange = (key: string, quantity: number) => {
    if (!canInteract || loading) return;
    setSelectedSlots((prev) => ({
      ...prev,
      [key]: Math.max(
        1,
        Math.min(maxGuests, normalizeSignupQuantity(quantity))
      ),
    }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canInteract || loading) return;
    setError(null);
    setServerMessage(null);

    if (Object.keys(selectedSlots).length === 0) {
      setError("Select at least one slot.");
      return;
    }
    if (!name.trim()) {
      setError("Please add the name we should associate with this sign-up.");
      return;
    }
    if (form.settings.collectEmail && !email.trim()) {
      setError("Add the best email for reminders.");
      return;
    }
    if (form.settings.collectPhone && !phone.trim()) {
      setError("Add a mobile number in case plans change.");
      return;
    }
    for (const question of form.questions) {
      if (question.required) {
        const value = answers[question.id]?.trim();
        if (!value) {
          setError("Answer all required questions.");
          return;
        }
      }
    }

    const slotsPayload = Object.entries(selectedSlots).map(
      ([key, quantity]) => {
        const [sectionId, slotId] = key.split("::");
        return { sectionId, slotId, quantity };
      }
    );

    const answersPayload = form.questions
      .map((question) => ({
        questionId: question.id,
        value: answers[question.id]?.trim() || "",
      }))
      .filter((entry) => entry.value);

    const payload: ReserveRequestPayload = {
      action: "reserve",
      slots: slotsPayload,
      name: name.trim(),
    };
    if (note.trim()) payload.note = note.trim();
    if (guests > 0) payload.guests = guests;
    if (answersPayload.length > 0) payload.answers = answersPayload;
    if (form.settings.collectEmail && email.trim())
      payload.email = email.trim();
    if (form.settings.collectPhone && phone.trim())
      payload.phone = phone.trim();
    if (myResponse?.id) payload.signupId = myResponse.id;

    setLoading(true);
    try {
      const res = await fetch(`/api/history/${eventId}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as SignupApiResponse;
      if (!res.ok || !data?.signupForm) {
        setError(
          (data && data.error) || "Could not save your sign-up. Try again."
        );
        return;
      }
      setForm(data.signupForm);
      const status =
        typeof data?.status === "string"
          ? data.status
          : (data?.response?.status as string | undefined);
      if (status === "waitlisted") {
        setServerMessage(
          "You're on the waitlist. We'll promote you automatically if spots open up."
        );
      } else {
        setServerMessage("Saved! We'll send reminders before the event.");
      }
      setConfirmOpen(true);
    } catch (err: unknown) {
      console.error("Failed to submit signup:", err);
      setError("Unexpected error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!myResponse || loading) return;
    setError(null);
    setServerMessage(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/history/${eventId}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", signupId: myResponse.id }),
      });
      const data = (await res.json().catch(() => ({}))) as SignupApiResponse;
      if (!res.ok || !data?.signupForm) {
        setError(
          (data && data.error) || "Couldn't cancel. Try again or refresh."
        );
        return;
      }
      setForm(data.signupForm);
      setServerMessage("Cancelled. Thanks for letting us know!");
      setSelectedSlots({});
      setNote("");
      setGuests(0);
    } catch (err: unknown) {
      console.error("Failed to cancel signup:", err);
      setError("Unexpected error cancelling.");
    } finally {
      setLoading(false);
    }
  };

  const confirmedResponses = useMemo(
    () => form.responses.filter((response) => response.status === "confirmed"),
    [form.responses]
  );
  const waitlistedResponses = useMemo(
    () => form.responses.filter((response) => response.status === "waitlisted"),
    [form.responses]
  );
  const cancelledResponses = useMemo(
    () => form.responses.filter((response) => response.status === "cancelled"),
    [form.responses]
  );

  if (!form.sections.length) return null;

  return (
    <section className="rounded-xl border border-border bg-surface/80 p-4 sm:p-6 space-y-5">
      <header className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">
            Sign-up board
          </h2>
          {viewerKind === "owner" && ownerEventData && (
            <div className="flex items-center gap-2 text-sm font-medium">
              <EventEditModal
                eventId={eventId}
                eventData={ownerEventData}
                eventTitle={ownerEventTitle || "Event"}
              />
              <button
                type="button"
                onClick={() => {
                  try {
                    const originalTitle = ownerEventTitle || "Smart sign-up";
                    const dataCopy: any = { ...(ownerEventData || {}) };
                    if (
                      dataCopy.signupForm &&
                      typeof dataCopy.signupForm === "object"
                    ) {
                      dataCopy.signupForm = {
                        ...dataCopy.signupForm,
                        title: `Copy of ${
                          dataCopy.signupForm.title || originalTitle
                        }`,
                        responses: [],
                      };
                    }
                    if (dataCopy.shared) delete dataCopy.shared;
                    if (dataCopy.sharedOut) delete dataCopy.sharedOut;
                    try {
                      sessionStorage.setItem(
                        "snapmydate:signup-duplicate",
                        JSON.stringify({ originalTitle, dataCopy })
                      );
                    } catch {}
                    router.push(`/smart-signup-form?duplicate=1`);
                  } catch (err: any) {
                    alert(String(err?.message || err || "Could not duplicate"));
                  }
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-foreground/70 hover:text-foreground hover:bg-surface transition-colors"
                title="Duplicate form"
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
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                <span className="hidden sm:inline">Duplicate</span>
              </button>
              <EventDeleteModal
                eventId={eventId}
                eventTitle={ownerEventTitle || "Event"}
              />
            </div>
          )}
        </div>
        <p className="text-sm text-foreground/70">
          Claim a spot, bring supplies, or volunteer for a role. Slots update in
          real time for everyone invited.
        </p>
      </header>

      {feedback && (
        <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600">
          {feedback}
        </div>
      )}
      {error && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {form.sections.map((section) => (
          <div key={section.id} className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {section.title}
              </h3>
              {section.description && (
                <p className="text-xs text-foreground/70 mt-0.5">
                  {section.description}
                </p>
              )}
            </div>
            <div className="space-y-2">
              {section.slots.map((slot) => {
                const key = slotKey(section.id, slot.id);
                const isSelected = Boolean(selectedSlots[key]);
                const capacity = getSlotCapacity(slot);
                const confirmed = countConfirmedForSlot(
                  form,
                  section.id,
                  slot.id
                );
                const waitlisted = countWaitlistedForSlot(
                  form,
                  section.id,
                  slot.id
                );
                const remaining = remainingCapacityForSlot(
                  form,
                  section.id,
                  slot.id,
                  myResponse?.id
                );
                const range = formatSlotRange(slot.startTime, slot.endTime);
                const selectedQuantity = selectedSlots[key] || 1;
                const isFull =
                  typeof capacity === "number" ? confirmed >= capacity : false;

                return (
                  <div
                    key={slot.id}
                    className={`rounded-lg border px-3 py-3 transition ${
                      isSelected
                        ? "border-primary/70 bg-primary/5"
                        : "border-border bg-background"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-foreground">
                          {slot.label}
                        </div>
                        {range && (
                          <div className="text-xs text-foreground/60">
                            {range}
                          </div>
                        )}
                        {slot.notes && (
                          <div className="text-xs text-foreground/60">
                            {slot.notes}
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-foreground/60">
                          {typeof capacity === "number" ? (
                            <span>
                              {confirmed}/{capacity} claimed
                              {remaining !== null && remaining >= 0
                                ? ` · ${remaining} open`
                                : ""}
                            </span>
                          ) : (
                            <span>Unlimited capacity</span>
                          )}
                          {waitlisted > 0 && (
                            <span>· Waitlist {waitlisted}</span>
                          )}
                          {myResponse?.slots?.some(
                            (entry) =>
                              entry.sectionId === section.id &&
                              entry.slotId === slot.id
                          ) && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
                              You&apos;re signed up
                            </span>
                          )}
                          {isFull && remaining === 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] text-amber-700">
                              Currently full
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isSelected && (
                          <input
                            type="number"
                            min={1}
                            max={maxGuests}
                            value={selectedQuantity}
                            onChange={(event) =>
                              handleQuantityChange(
                                key,
                                Number.parseInt(event.target.value, 10) || 1
                              )
                            }
                            className="w-16 rounded-md border border-border bg-background px-2 py-1 text-sm"
                            disabled={!canInteract || loading}
                          />
                        )}
                        <button
                          type="button"
                          className={`rounded-md border px-3 py-1.5 text-sm font-medium transition ${
                            isSelected
                              ? "border-primary/60 bg-primary/10 text-primary hover:bg-primary/20"
                              : "border-border bg-background text-foreground hover:border-foreground/50"
                          }`}
                          onClick={() => handleToggleSlot(section.id, slot.id)}
                          disabled={!canInteract || loading}
                        >
                          {isSelected ? "Remove" : "Select"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {canInteract && (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="rounded-lg border border-border bg-background/70 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              Your details
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs text-foreground/60 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  disabled={loading}
                />
              </div>
              {form.settings.collectEmail && (
                <div>
                  <label className="block text-xs text-foreground/60 mb-1">
                    Email for reminders
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    disabled={loading}
                  />
                </div>
              )}
              {form.settings.collectPhone && (
                <div>
                  <label className="block text-xs text-foreground/60 mb-1">
                    Mobile number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    disabled={loading}
                  />
                </div>
              )}
              {maxGuests > 1 && (
                <div>
                  <label className="block text-xs text-foreground/60 mb-1">
                    Extra guests (for headcount)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={maxGuests}
                    value={guests}
                    onChange={(event) =>
                      setGuests(
                        Math.max(
                          0,
                          Math.min(
                            maxGuests,
                            Number.parseInt(event.target.value, 10) || 0
                          )
                        )
                      )
                    }
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    disabled={loading}
                  />
                </div>
              )}
            </div>

            {form.questions.length > 0 && (
              <div className="space-y-3">
                {form.questions.map((question) => {
                  const value = answers[question.id] || "";
                  return (
                    <div key={question.id}>
                      <label className="block text-xs text-foreground/60 mb-1">
                        {question.prompt}
                        {question.required && (
                          <span className="ml-1 text-red-500">*</span>
                        )}
                      </label>
                      {question.multiline ? (
                        <textarea
                          value={value}
                          onChange={(event) =>
                            setAnswers((prev) => ({
                              ...prev,
                              [question.id]: event.target.value,
                            }))
                          }
                          rows={3}
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                          disabled={loading}
                        />
                      ) : (
                        <input
                          type="text"
                          value={value}
                          onChange={(event) =>
                            setAnswers((prev) => ({
                              ...prev,
                              [question.id]: event.target.value,
                            }))
                          }
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                          disabled={loading}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div>
              <label className="block text-xs text-foreground/60 mb-1">
                Notes for the host (optional)
              </label>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={2}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-foreground/60">
              We’ll auto-manage waitlists, notify you about updates, and remind
              you{" "}
              {form.settings.autoRemindersHoursBefore
                .slice()
                .sort((a, b) => a - b)
                .map((hours) =>
                  hours >= 24
                    ? `${Math.round(hours / 24)} day${
                        hours / 24 === 1 ? "" : "s"
                      }`
                    : `${hours} hour${hours === 1 ? "" : "s"}`
                )
                .join(", ")}{" "}
              before the event.
            </div>
            <div className="flex items-center gap-2">
              {myResponse && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-md border border-red-500/60 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-500/10 disabled:opacity-50"
                  disabled={loading}
                >
                  Cancel my spot
                </button>
              )}
              <button
                type="submit"
                className="rounded-md border border-primary bg-primary px-4 py-1.5 text-sm font-semibold text-white shadow hover:bg-primary/90 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save my sign-up"}
              </button>
            </div>
          </div>
        </form>
      )}

      {myResponse && (
        <div className="rounded-lg border border-border bg-background/70 p-3">
          <p className="text-sm font-semibold text-foreground">
            Your status:{" "}
            <span
              className={
                myResponse.status === "confirmed"
                  ? "text-emerald-600"
                  : myResponse.status === "waitlisted"
                  ? "text-amber-600"
                  : "text-foreground"
              }
            >
              {myResponse.status === "confirmed"
                ? "Confirmed"
                : myResponse.status === "waitlisted"
                ? "Waitlisted"
                : "Cancelled"}
            </span>
          </p>
          {selectedEntries.length > 0 && (
            <ul className="mt-2 text-xs text-foreground/70 space-y-1">
              {selectedEntries.map((entry) => (
                <li key={entry.key}>
                  {entry.sectionTitle}: {entry.slotLabel}
                  {entry.quantity > 1 ? ` ×${entry.quantity}` : ""}{" "}
                  {entry.range ? `(${entry.range})` : ""}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {viewerKind === "owner" && (
        <div className="rounded-lg border border-border bg-background/70 p-4 space-y-3">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-foreground">
              Host dashboard
            </h3>
            <div className="flex items-end gap-5">
              <div className="text-center leading-none">
                <div className="font-mono font-extrabold text-3xl sm:text-4xl text-sky-600">
                  {hasUnlimited ? "∞" : totalCapacity}
                </div>
                <div className="mt-1 text-[10px] sm:text-xs uppercase tracking-wider text-foreground/60">
                  Total
                </div>
              </div>
              <div className="text-center leading-none">
                <div className="font-mono font-extrabold text-3xl sm:text-4xl text-emerald-600">
                  {filledCount}
                </div>
                <div className="mt-1 text-[10px] sm:text-xs uppercase tracking-wider text-foreground/60">
                  Filled
                </div>
              </div>
              <div className="text-center leading-none">
                <div className="font-mono font-extrabold text-3xl sm:text-4xl text-violet-600">
                  {hasUnlimited ? "∞" : remainingCount}
                </div>
                <div className="mt-1 text-[10px] sm:text-xs uppercase tracking-wider text-foreground/60">
                  Remaining
                </div>
              </div>
            </div>
          </header>
          <div className="space-y-3">
            {confirmedResponses.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground/50 mb-2">
                  Confirmed
                </h4>
                <div className="space-y-2">
                  {confirmedResponses.map((response) => (
                    <div
                      key={response.id}
                      className="rounded-md border border-border bg-surface px-3 py-2 text-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium text-foreground">
                          {response.name}
                        </span>
                        <span className="text-xs text-foreground/60">
                          {new Date(
                            response.updatedAt || response.createdAt || ""
                          ).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xs text-foreground/70 mt-1">
                        {summarizeResponseSlots(form, response) ||
                          "No slots selected"}
                      </div>
                      <div className="text-xs text-foreground/50 mt-1 flex flex-wrap gap-3">
                        {response.email && <span>{response.email}</span>}
                        {response.phone && <span>{response.phone}</span>}
                        {response.guests && response.guests > 0 && (
                          <span>{response.guests} guests</span>
                        )}
                      </div>
                      {response.note && (
                        <div className="mt-1 text-xs text-foreground/60">
                          Note: {response.note}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {waitlistedResponses.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground/50 mb-2">
                  Waitlist
                </h4>
                <div className="space-y-2">
                  {waitlistedResponses.map((response) => (
                    <div
                      key={response.id}
                      className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium text-amber-700">
                          {response.name}
                        </span>
                        <span className="text-xs text-amber-700/70">
                          {new Date(
                            response.updatedAt || response.createdAt || ""
                          ).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xs text-amber-700/80 mt-1">
                        {summarizeResponseSlots(form, response) ||
                          "No slots selected"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {cancelledResponses.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground/50 mb-2">
                  Cancelled (for audit trail)
                </h4>
                <div className="space-y-1 text-xs text-foreground/50">
                  {cancelledResponses.map((response) => (
                    <div key={response.id}>
                      {response.name} —{" "}
                      {new Date(
                        response.updatedAt || response.createdAt || ""
                      ).toLocaleString()}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setConfirmOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-xl border border-border bg-background shadow-lg">
            <div className="p-4 sm:p-5 space-y-3">
              <h3 className="text-base sm:text-lg font-semibold text-foreground">
                {feedback?.includes("waitlist")
                  ? "You're on the waitlist"
                  : "Sign-up saved"}
              </h3>
              <p className="text-sm text-foreground/70">
                {feedback?.includes("waitlist")
                  ? "We'll promote you automatically if spots open up."
                  : `We've saved your sign-up${
                      form.settings.collectEmail &&
                      (email?.trim() || myResponse?.email)
                        ? ` and sent a confirmation to ${(
                            email ||
                            myResponse?.email ||
                            ""
                          ).trim()}.`
                        : "."
                    }`}
              </p>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                  onClick={() => setConfirmOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default SignupViewer;
