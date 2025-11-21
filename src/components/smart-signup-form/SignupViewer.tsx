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
  const [errorOpen, setErrorOpen] = useState(false);
  const [editingResponse, setEditingResponse] = useState<SignupResponse | null>(
    null
  );
  const [removingResponseId, setRemovingResponseId] = useState<string | null>(
    null
  );

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
        viewerEmail || undefined,
        undefined // phone not available in viewer props initially
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
        const errorMessage =
          (data && data.error) || "Could not save your sign-up. Try again.";
        setError(errorMessage);
        setErrorOpen(true);
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
      const errorMessage = "Unexpected error. Please try again.";
      setError(errorMessage);
      setErrorOpen(true);
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

  const handleRemoveResponse = async (responseId: string) => {
    if (removingResponseId || loading) return;
    if (!confirm("Are you sure you want to remove this sign-up?")) return;

    setRemovingResponseId(responseId);
    setError(null);
    try {
      const res = await fetch(`/api/history/${eventId}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", signupId: responseId }),
      });
      const data = (await res.json().catch(() => ({}))) as SignupApiResponse;
      if (!res.ok || !data?.signupForm) {
        setError((data && data.error) || "Couldn't remove sign-up. Try again.");
        setErrorOpen(true);
        return;
      }
      setForm(data.signupForm);
    } catch (err: unknown) {
      console.error("Failed to remove signup:", err);
      setError("Unexpected error removing sign-up.");
      setErrorOpen(true);
    } finally {
      setRemovingResponseId(null);
    }
  };

  const handleEditResponse = (response: SignupResponse) => {
    setEditingResponse(response);
    // Pre-populate selected slots
    const slotsMap: SlotSelectionMap = {};
    for (const slot of response.slots || []) {
      const key = slotKey(slot.sectionId, slot.slotId);
      slotsMap[key] = normalizeSignupQuantity(slot.quantity ?? 1);
    }
    setSelectedSlots(slotsMap);
    setName(response.name || "");
    setEmail(response.email || "");
    setPhone(response.phone || "");
    setGuests(response.guests || 0);
    setNote(response.note || "");
    const answersMap: Record<string, string> = {};
    for (const answer of response.answers || []) {
      answersMap[answer.questionId] = answer.value;
    }
    setAnswers(answersMap);
  };

  const handleSaveEdit = async () => {
    if (!editingResponse || loading) return;

    const slotsPayload = Object.entries(selectedSlots).map(
      ([key, quantity]) => {
        const [sectionId, slotId] = key.split("::");
        return { sectionId, slotId, quantity };
      }
    );

    if (slotsPayload.length === 0) {
      setError("Select at least one slot.");
      setErrorOpen(true);
      return;
    }

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
      signupId: editingResponse.id,
    };
    if (note.trim()) payload.note = note.trim();
    if (guests > 0) payload.guests = guests;
    if (answersPayload.length > 0) payload.answers = answersPayload;
    if (form.settings.collectEmail && email.trim())
      payload.email = email.trim();
    if (form.settings.collectPhone && phone.trim())
      payload.phone = phone.trim();

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/history/${eventId}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as SignupApiResponse;
      if (!res.ok || !data?.signupForm) {
        const errorMessage =
          (data && data.error) || "Could not update sign-up. Try again.";
        setError(errorMessage);
        setErrorOpen(true);
        return;
      }
      setForm(data.signupForm);
      setEditingResponse(null);
      setSelectedSlots({});
      setName("");
      setEmail("");
      setPhone("");
      setNote("");
      setGuests(0);
      setAnswers({});
      setServerMessage("Sign-up updated successfully!");
      setConfirmOpen(true);
    } catch (err: unknown) {
      console.error("Failed to update signup:", err);
      setError("Unexpected error updating sign-up.");
      setErrorOpen(true);
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
    <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 space-y-5 shadow-sm">
      <header className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-gray-900">Sign-up board</h2>
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
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
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
        <p className="text-sm text-gray-600">
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

      {editingResponse && (
        <div className="rounded-md border border-blue-500/40 bg-blue-500/10 px-3 py-2 text-sm text-blue-600 mb-4">
          <div className="flex items-center justify-between">
            <span>
              Editing sign-up for <strong>{editingResponse.name}</strong>
            </span>
            <button
              type="button"
              onClick={() => {
                setEditingResponse(null);
                setSelectedSlots({});
                setName("");
                setEmail("");
                setPhone("");
                setNote("");
                setGuests(0);
                setAnswers({});
              }}
              className="text-xs underline hover:no-underline"
            >
              Cancel edit
            </button>
          </div>
        </div>
      )}

      <div className="space-y-5">
        {form.sections.map((section) => (
          <div key={section.id} className="space-y-3">
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                {section.title}
              </h3>
              {section.description && (
                <p className="text-sm text-gray-600 mt-1">
                  {section.description}
                </p>
              )}
            </div>
            <div className="space-y-3">
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
                    className={`rounded-xl border px-4 py-3.5 transition ${
                      isSelected
                        ? "border-blue-300 bg-blue-50/50 shadow-sm"
                        : "border-gray-200 bg-gray-50/50"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="space-y-1.5">
                        <div className="text-sm font-medium text-gray-900">
                          {slot.label}
                        </div>
                        {range && (
                          <div className="text-xs text-gray-600">{range}</div>
                        )}
                        {slot.notes && (
                          <div className="text-xs text-gray-600">
                            {slot.notes}
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
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
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                              You&apos;re signed up
                            </span>
                          )}
                          {isFull && remaining === 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
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
                            className="w-16 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            disabled={!canInteract || loading}
                          />
                        )}
                        <button
                          type="button"
                          className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                            isSelected
                              ? "border-blue-500 bg-blue-500 text-white shadow-sm hover:bg-blue-600"
                              : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
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

      {canInteract && (!myResponse || editingResponse) && (
        <form
          className="space-y-4"
          onSubmit={
            editingResponse
              ? (e) => {
                  e.preventDefault();
                  handleSaveEdit();
                }
              : handleSubmit
          }
        >
          {(viewerKind === "owner" ||
            Object.keys(selectedSlots).length > 0 ||
            myResponse ||
            editingResponse) && (
            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-5 space-y-4">
              <h3 className="text-base font-semibold text-gray-900">
                Your details
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    disabled={loading}
                  />
                </div>
                {form.settings.collectEmail && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email for reminders
                    </label>
                    <input
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      disabled={loading}
                    />
                  </div>
                )}
                {form.settings.collectPhone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mobile number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      disabled={loading}
                    />
                  </div>
                )}
                {maxGuests > 1 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      disabled={loading}
                    />
                  </div>
                )}
              </div>

              {form.questions.length > 0 && (
                <div className="space-y-4">
                  {form.questions.map((question) => {
                    const value = answers[question.id] || "";
                    return (
                      <div key={question.id}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
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
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            disabled={loading}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes for the host (optional)
                </label>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  disabled={loading}
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="text-xs text-gray-600">
              We'll auto-manage waitlists, notify you about updates, and remind
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
              {myResponse && !editingResponse && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                  disabled={loading}
                >
                  Cancel my spot
                </button>
              )}
              {editingResponse && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingResponse(null);
                    setSelectedSlots({});
                    setName("");
                    setEmail("");
                    setPhone("");
                    setNote("");
                    setGuests(0);
                    setAnswers({});
                  }}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                  disabled={loading}
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-5 py-2 text-sm font-bold text-white shadow-lg transition hover:shadow-xl disabled:opacity-60"
                disabled={loading}
              >
                {loading
                  ? editingResponse
                    ? "Updating..."
                    : "Saving..."
                  : editingResponse
                  ? "Update sign-up"
                  : "Save my sign-up"}
              </button>
            </div>
          </div>
        </form>
      )}

      {myResponse && (
        <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4">
          <p className="text-sm font-semibold text-gray-900">
            Your status:{" "}
            <span
              className={
                myResponse.status === "confirmed"
                  ? "text-emerald-600"
                  : myResponse.status === "waitlisted"
                  ? "text-amber-600"
                  : "text-gray-900"
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
            <ul className="mt-2 text-sm text-gray-600 space-y-1">
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
        <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4 shadow-sm">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-gray-900">Host dashboard</h3>
            <div className="flex items-end gap-6">
              <div className="text-center leading-none">
                <div className="font-mono font-extrabold text-3xl sm:text-4xl text-sky-600">
                  {hasUnlimited ? "∞" : totalCapacity}
                </div>
                <div className="mt-1.5 text-xs uppercase tracking-wider font-semibold text-gray-600">
                  Total
                </div>
              </div>
              <div className="text-center leading-none">
                <div className="font-mono font-extrabold text-3xl sm:text-4xl text-emerald-600">
                  {filledCount}
                </div>
                <div className="mt-1.5 text-xs uppercase tracking-wider font-semibold text-gray-600">
                  Filled
                </div>
              </div>
              <div className="text-center leading-none">
                <div className="font-mono font-extrabold text-3xl sm:text-4xl text-violet-600">
                  {hasUnlimited ? "∞" : remainingCount}
                </div>
                <div className="mt-1.5 text-xs uppercase tracking-wider font-semibold text-gray-600">
                  Remaining
                </div>
              </div>
            </div>
          </header>
          <div className="space-y-4">
            {confirmedResponses.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                  Confirmed
                </h4>
                <div className="space-y-2">
                  {confirmedResponses.map((response) => (
                    <div
                      key={response.id}
                      className="rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold text-gray-900">
                          {response.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600">
                            {new Date(
                              response.updatedAt || response.createdAt || ""
                            ).toLocaleString()}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleEditResponse(response)}
                            disabled={
                              loading || removingResponseId === response.id
                            }
                            className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Edit sign-up"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveResponse(response.id)}
                            disabled={
                              loading || removingResponseId === response.id
                            }
                            className="text-xs px-3 py-1.5 rounded-lg border border-red-300 bg-white text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Remove sign-up"
                          >
                            {removingResponseId === response.id
                              ? "Removing..."
                              : "Remove"}
                          </button>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 mt-2">
                        {summarizeResponseSlots(form, response) ||
                          "No slots selected"}
                      </div>
                      <div className="text-xs text-gray-500 mt-1.5 flex flex-wrap gap-3">
                        {response.email && <span>{response.email}</span>}
                        {response.phone && <span>{response.phone}</span>}
                        {response.guests && response.guests > 0 && (
                          <span>{response.guests} guests</span>
                        )}
                      </div>
                      {response.note && (
                        <div className="mt-2 text-sm text-gray-600 bg-white rounded-lg px-3 py-2 border border-gray-200">
                          <span className="font-medium">Note:</span>{" "}
                          {response.note}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {waitlistedResponses.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                  Waitlist
                </h4>
                <div className="space-y-2">
                  {waitlistedResponses.map((response) => (
                    <div
                      key={response.id}
                      className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold text-amber-900">
                          {response.name}
                        </span>
                        <span className="text-xs text-amber-700">
                          {new Date(
                            response.updatedAt || response.createdAt || ""
                          ).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm text-amber-800 mt-2">
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
                <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                  Cancelled (for audit trail)
                </h4>
                <div className="space-y-2 text-sm text-gray-500">
                  {cancelledResponses.map((response) => (
                    <div
                      key={response.id}
                      className="rounded-lg bg-gray-50 px-3 py-2 border border-gray-200"
                    >
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
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl">
            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 text-emerald-600"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="text-lg font-bold text-gray-900">
                    {feedback?.includes("waitlist")
                      ? "You're on the waitlist"
                      : "Sign-up confirmed!"}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {feedback?.includes("waitlist") ? (
                      <>
                        Your sign-up went through successfully! We'll promote
                        you automatically if spots open up.
                      </>
                    ) : (
                      <>
                        Your sign-up went through successfully!
                        {form.settings.collectEmail &&
                        (email?.trim() || myResponse?.email) ? (
                          <>
                            {" "}
                            We'll send you an email with the details at{" "}
                            <strong>
                              {(email || myResponse?.email || "").trim()}
                            </strong>
                            .
                          </>
                        ) : (
                          " Your sign-up has been saved."
                        )}
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setConfirmOpen(false)}
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {errorOpen && error && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setErrorOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-red-300 bg-white shadow-2xl">
            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 text-red-600"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="text-lg font-bold text-gray-900">
                    Sign-up failed
                  </h3>
                  <p className="text-sm text-gray-600">{error}</p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    setErrorOpen(false);
                    setError(null);
                  }}
                >
                  Got it
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
