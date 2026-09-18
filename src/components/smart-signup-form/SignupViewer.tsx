"use client";

import Link from "next/link";
import React, { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import EventGuestPlanningNotes from "@/components/event-templates/EventGuestPlanningNotes";
import TemplateBodyLayout from "@/components/templates/TemplateBodyLayout";
import { signupResponsesCsv } from "@/lib/signup-export";
import {
  type SignupReservationInput,
  signupQuantityLimit,
  validateSignupReservation,
} from "@/lib/signup-reservation-validation";
import { resolveSignupDesign, resolveSignupThemeStyle } from "@/lib/signup-themes";
import { signupWindowMessage } from "@/lib/signup-validation";
import { getTemplateBodyPresentation } from "@/lib/template-body-presentations";
import type { SignupForm, SignupResponse } from "@/types/signup";
import {
  countConfirmedForSlot,
  countWaitlistedForSlot,
  findSignupResponseForUser,
  getSlotCapacity,
  normalizeSignupQuantity,
  remainingCapacityForSlot,
} from "@/utils/signup";
import SignupRecovery from "./SignupRecovery";
import SignupSharing from "./SignupSharing";
import themeStyles from "./signup-theme.module.css";

type ViewerKind = "owner" | "guest" | "readonly";

type Props = {
  eventId: string;
  initialForm: SignupForm;
  viewerKind: ViewerKind;
  viewerId?: string | null;
  viewerName?: string | null;
  viewerEmail?: string | null;
  viewerResponseId?: string | null;
  requiresInvitation?: boolean;
  hideOwnerTools?: boolean;
  interactivePreview?: boolean;
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
  acceptWaitlist?: boolean;
};

type SignupApiResponse = {
  ok?: boolean;
  error?: string;
  signupForm?: SignupForm;
  response?: SignupResponse;
  status?: string;
  myResponseId?: string | null;
};

type SlotSelectionMap = Record<string, number>;

const slotKey = (sectionId: string, slotId: string) => `${sectionId}::${slotId}`;

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

const formatSlotRange = (start?: string | null, end?: string | null): string | null => {
  const startLabel = formatTime(start);
  const endLabel = formatTime(end);
  if (startLabel && endLabel) return `${startLabel} – ${endLabel}`;
  if (startLabel) return `Starts ${startLabel}`;
  if (endLabel) return `Ends ${endLabel}`;
  return null;
};

const formatUsDateTime = (value?: string | null): string => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const summarizeResponseSlots = (form: SignupForm, response: SignupResponse): string => {
  const entries: string[] = [];
  for (const selection of response.slots || []) {
    const section = form.sections.find((candidate) => candidate.id === selection.sectionId);
    const slot = section?.slots.find((candidate) => candidate.id === selection.slotId);
    if (!section || !slot) continue;
    const quantity = normalizeSignupQuantity(selection.quantity ?? 1);
    const range = formatSlotRange(slot.startTime, slot.endTime);
    entries.push(
      `${section.title}: ${slot.label}${quantity > 1 ? ` ×${quantity}` : ""}${
        range ? ` (${range})` : ""
      }`,
    );
  }
  return entries.join("; ");
};

const SignupViewer: React.FC<Props> = ({
  eventId,
  initialForm,
  viewerKind,
  viewerId,
  viewerName,
  viewerEmail,
  viewerResponseId,
  requiresInvitation = false,
  hideOwnerTools = false,
  interactivePreview = false,
}) => {
  const isTestPreview = eventId === "preview" && interactivePreview;
  const SlotControl = eventId === "preview" && !isTestPreview ? "span" : "button";
  const [form, setForm] = useState<SignupForm>(initialForm);
  const [selectedSlots, setSelectedSlots] = useState<SlotSelectionMap>({});
  const [name, setName] = useState<string>(
    ((!isTestPreview &&
      viewerId &&
      initialForm.responses.find((response) => response.userId === viewerId)?.name) ||
      viewerName ||
      "") as string,
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
  const [editingResponse, setEditingResponse] = useState<SignupResponse | null>(null);
  const [removingResponseId, setRemovingResponseId] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [acceptWaitlist, setAcceptWaitlist] = useState(false);
  const [resultStatus, setResultStatus] = useState("confirmed");
  const [testAttempt, setTestAttempt] = useState(0);
  const [myResponseId, setMyResponseId] = useState(viewerResponseId || null);
  useEffect(() => {
    setMyResponseId(viewerResponseId || null);
  }, [viewerResponseId]);

  const feedback = serverMessage;
  const windowMessage = signupWindowMessage(form);
  const canInteract = viewerKind !== "readonly" && !windowMessage;
  useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);
  const [refreshing, setRefreshing] = useState(false);
  const refresh = async () => {
    setRefreshing(true);
    try {
      const result = await fetch(`/api/history/${eventId}/signup`, { cache: "no-store" });
      const data: SignupApiResponse = await result.json();
      if (!result.ok || !data.signupForm)
        throw new Error(data.error || "Unable to refresh availability.");
      setForm(data.signupForm);
      if (data.myResponseId !== undefined) setMyResponseId(data.myResponseId);
      setServerMessage("Availability updated.");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Unable to refresh availability.");
    } finally {
      setRefreshing(false);
    }
  };
  const maxGuests = form.settings.maxGuestsPerSignup || 1;

  const sectionProgress = form.sections
    .filter((section) => section.slots.length)
    .map((section) => {
      const unlimited = section.slots.some((slot) => slot.capacity === null);
      const capacity = section.slots.reduce((sum, slot) => sum + (slot.capacity || 0), 0);
      const confirmed = section.slots.reduce(
        (sum, slot) => sum + countConfirmedForSlot(form, section.id, slot.id),
        0,
      );
      return { section, capacity, confirmed, unlimited };
    });

  const myResponse = useMemo(
    () =>
      isTestPreview
        ? null
        : form.responses.find(
            (response) => response.id === myResponseId && response.status !== "cancelled",
          ) ||
          findSignupResponseForUser(
            form,
            viewerId || undefined,
            viewerEmail || undefined,
            undefined, // phone not available in viewer props initially
          ),
    [form, myResponseId, viewerId, viewerEmail, isTestPreview],
  );

  const lastResponseId = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (editingResponse) return;
    const currentId = myResponse ? `${myResponse.id}:${myResponse.updatedAt}` : null;
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
      slotSelections[slotKey(selection.sectionId, selection.slotId)] = normalizeSignupQuantity(
        selection.quantity ?? 1,
      );
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
    editingResponse,
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

  const canChoose = canInteract && (!myResponse || !!editingResponse);
  const reservation: SignupReservationInput = {
    slots: Object.entries(selectedSlots).map(([key, quantity]) => {
      const [sectionId, slotId] = key.split("::");
      return { sectionId, slotId, quantity };
    }),
    name,
    email,
    phone,
    guests,
    answers: form.questions.map((question) => ({
      questionId: question.id,
      value: answers[question.id] || "",
    })),
    signupId: editingResponse?.id || myResponse?.id,
    acceptWaitlist,
  };
  const validation = validateSignupReservation(form, reservation);
  const fieldError = (field: string) =>
    attempted ? validation.issues.find((issue) => issue.field === field)?.message : undefined;
  const inputProps = (field: string) => ({
    id: `signup-input-${field}`,
    "aria-invalid": !!fieldError(field),
    "aria-describedby": fieldError(field) ? `signup-error-${field}` : undefined,
  });
  const inlineError = (field: string) =>
    fieldError(field) ? (
      <p id={`signup-error-${field}`} className="mt-1 text-sm text-red-700">
        {fieldError(field)}
      </p>
    ) : null;
  const focusIssue = (field: string) => {
    const target = document.getElementById(`signup-input-${field}`);
    target?.scrollIntoView({ block: "center", behavior: "auto" });
    target?.focus({ preventScroll: true });
  };
  useEffect(() => {
    setError(null);
  }, [selectedSlots, name, email, phone, guests, answers, acceptWaitlist]);
  useEffect(() => {
    setAcceptWaitlist(false);
  }, [selectedSlots]);
  const cancelEdit = () => {
    lastResponseId.current = undefined;
    setEditingResponse(null);
    setSelectedSlots({});
    setAttempted(false);
    setAcceptWaitlist(false);
    setError(null);
    if (!myResponse) {
      setName(viewerName || "");
      setEmail(viewerEmail || "");
      setPhone("");
      setGuests(0);
      setNote("");
      setAnswers({});
    }
  };

  const handleToggleSlot = (sectionId: string, slotId: string) => {
    if (!canChoose || loading) return;
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
    if (!canChoose || loading) return;
    setSelectedSlots((prev) => ({ ...prev, [key]: Math.max(1, quantity) }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canChoose || loading) return;
    setAttempted(true);
    setError(null);
    setServerMessage(null);
    if (validation.issues.length) {
      requestAnimationFrame(() => focusIssue(validation.issues[0].field));
      return;
    }
    if (eventId === "preview") {
      setTestAttempt((previous) => previous + 1);
      setServerMessage(
        validation.status === "waitlisted"
          ? "Test result: all selections would be waitlisted. Nothing was submitted."
          : "Test signup complete. Your selections would be confirmed. Nothing was submitted and no places were reserved.",
      );
      return;
    }
    const payload: ReserveRequestPayload = {
      action: "reserve",
      ...reservation,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      note: note.trim(),
    };
    setLoading(true);
    try {
      const res = await fetch(`/api/history/${eventId}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as SignupApiResponse;
      if (!res.ok || !data.signupForm) {
        setError(data.error || "Could not save your signup. Please try again.");
        setErrorOpen(true);
        return;
      }
      lastResponseId.current = undefined;
      if (editingResponse && !myResponse) cancelEdit();
      setForm(data.signupForm);
      setEditingResponse(null);
      if (data.myResponseId !== undefined) setMyResponseId(data.myResponseId);
      setSelectedSlots({});
      setAttempted(false);
      setResultStatus(data.response?.status || data.status || "confirmed");
      setServerMessage(
        data.response?.status === "waitlisted"
          ? "All selections are waitlisted. No places or items are confirmed yet."
          : "Signup confirmed. The saved commitments are shown below.",
      );
      setConfirmOpen(true);
    } catch {
      setError("Could not save your signup. Check your connection and try again.");
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
        setError(data?.error || "Couldn't cancel. Try again or refresh.");
        return;
      }
      setForm(data.signupForm);
      setEditingResponse(null);
      setAttempted(false);
      if (data.myResponseId !== undefined) setMyResponseId(data.myResponseId);
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
        setError(data?.error || "Couldn't remove sign-up. Try again.");
        setErrorOpen(true);
        return;
      }
      setForm(data.signupForm);
      if (editingResponse?.id === responseId) cancelEdit();
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
    setAttempted(false);
    setAcceptWaitlist(false);
    setServerMessage(null);
    requestAnimationFrame(() => focusIssue("slots"));
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

  const [participantSearch, setParticipantSearch] = useState("");
  const visibleResponses = useMemo(
    () =>
      form.responses.filter(
        (response) =>
          !participantSearch.trim() ||
          `${response.name} ${response.email || ""} ${summarizeResponseSlots(form, response)} ${(response.answers || []).map((answer) => answer.value).join(" ")}`
            .toLowerCase()
            .includes(participantSearch.trim().toLowerCase()),
      ),
    [form, participantSearch],
  );
  const exportCsv = () => {
    const url = URL.createObjectURL(
      new Blob([signupResponsesCsv(form)], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "signup-responses.csv";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const setOpen = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetch(`/api/history/${eventId}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set-open", enabled: !form.enabled }),
      });
      const data: SignupApiResponse = await result.json();
      if (!result.ok || !data.signupForm)
        throw new Error(data.error || "Unable to update this signup.");
      setForm(data.signupForm);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Unable to update this signup.");
    } finally {
      setLoading(false);
    }
  };
  const confirmedResponses = useMemo(
    () => visibleResponses.filter((response) => response.status === "confirmed"),
    [visibleResponses],
  );
  const waitlistedResponses = useMemo(
    () => visibleResponses.filter((response) => response.status === "waitlisted"),
    [visibleResponses],
  );
  const cancelledResponses = useMemo(
    () => visibleResponses.filter((response) => response.status === "cancelled"),
    [visibleResponses],
  );

  const responseDetails = (response: SignupResponse) => (
    <details className="mt-3 rounded-lg border border-[var(--signup-border)] p-3">
      <summary className="min-h-11 cursor-pointer font-semibold">Participant details</summary>
      <dl className="space-y-2 break-words text-sm">
        {response.email && (
          <div>
            <dt>Email</dt>
            <dd>{response.email}</dd>
          </div>
        )}
        {response.phone && (
          <div>
            <dt>Phone</dt>
            <dd>{response.phone}</dd>
          </div>
        )}
        {!!response.guests && (
          <div>
            <dt>Extra guests</dt>
            <dd>{response.guests}</dd>
          </div>
        )}
        {form.questions.map((question) => (
          <div key={question.id}>
            <dt className="font-medium">{question.prompt}</dt>
            <dd>
              {response.answers?.find((answer) => answer.questionId === question.id)?.value ||
                "Not provided"}
            </dd>
          </div>
        ))}
        {response.note && (
          <div>
            <dt>Note</dt>
            <dd>{response.note}</dd>
          </div>
        )}
      </dl>
    </details>
  );
  if (!form.sections.length) return null;
  const boardTitle = form.boardTitle ?? "Sign-up board";
  const boardDescription =
    form.boardDescription ??
    "Choose what you can bring or how you can help. Every contribution counts.";

  return (
    <section
      style={resolveSignupThemeStyle(form)}
      data-signup-board={resolveSignupDesign(form.appearance)?.board}
      className={`${themeStyles.board} rounded-2xl border border-[var(--signup-border)] bg-[var(--signup-surface)] p-5 sm:p-6 space-y-5 shadow-sm`}
    >
      {(boardTitle || boardDescription) && (
        <header className="space-y-2">
          {boardTitle && (
            <h2 className="text-xl font-bold text-[var(--signup-text)]">{boardTitle}</h2>
          )}
          {boardDescription && (
            <p className="text-sm text-[var(--signup-muted)]">{boardDescription}</p>
          )}
        </header>
      )}
      <EventGuestPlanningNotes value={form.guestPlanning} />
      {!myResponse && viewerKind !== "owner" && !requiresInvitation && eventId !== "preview" && (
        <SignupRecovery eventId={eventId} />
      )}
      {viewerKind === "owner" && !hideOwnerTools && eventId !== "preview" && (
        <SignupSharing eventId={eventId} requiresInvitation={requiresInvitation} />
      )}

      {feedback && !isTestPreview && (
        <div
          role="status"
          className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600"
        >
          {feedback}
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-600"
        >
          {error}
        </div>
      )}

      {editingResponse && (
        <div className="rounded-md border border-[var(--signup-accent)]/40 bg-blue-500/10 px-3 py-2 text-sm text-blue-600 mb-4">
          <div className="flex items-center justify-between">
            <span>
              Editing sign-up for <strong>{editingResponse.name}</strong>
            </span>
            <button
              type="button"
              onClick={cancelEdit}
              className="text-xs underline hover:no-underline"
            >
              Cancel edit
            </button>
          </div>
        </div>
      )}

      {eventId !== "preview" && (
        <button
          type="button"
          onClick={refresh}
          disabled={refreshing || loading}
          className="text-sm underline text-[var(--signup-accent)]"
        >
          {refreshing ? "Refreshing…" : "Refresh availability"}
        </button>
      )}
      {windowMessage && (
        <p
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
        >
          {windowMessage}
        </p>
      )}
      {viewerKind === "readonly" && eventId !== "preview" && (
        <p className="rounded-xl border border-[var(--signup-border)] p-4 text-sm">
          Invited guests can{" "}
          <Link
            className="underline"
            href={`/api/auth/signin?callbackUrl=${encodeURIComponent(`/smart-signup-form/${eventId}`)}`}
          >
            sign in
          </Link>{" "}
          to claim a slot after accepting their invitation.
        </p>
      )}
      <div id="signup-input-slots" tabIndex={-1}>
        {inlineError("slots")}
        <TemplateBodyLayout
          fallbackClassName="space-y-5"
          presentation={getTemplateBodyPresentation(
            "signup-forms",
            form.appearance?.designId ||
              (form.appearance?.themeId ? `editorial--${form.appearance.themeId}` : undefined),
          )}
        >
          {form.sections.map((section) => (
            <div
              key={section.id}
              className="space-y-3"
              data-signup-section
              data-signup-section-kind={section.kind || "slots"}
            >
              <div>
                <h3
                  data-template-section-title
                  className="text-base font-semibold text-[var(--signup-text)]"
                >
                  {section.title}
                </h3>
                {section.description && (
                  <p className="text-sm text-[var(--signup-muted)] mt-1">{section.description}</p>
                )}
                {section.slots.length > 0 &&
                  (section.maxSelectionsPerPerson || section.unitLabel) && (
                    <p className="mt-1 text-xs text-[var(--signup-muted)]">
                      {section.maxSelectionsPerPerson
                        ? `Choose up to ${section.maxSelectionsPerPerson} ${section.maxSelectionsPerPerson === 1 ? "option" : "options"} in this section. `
                        : ""}
                      {section.unitLabel ? `Quantities count ${section.unitLabel}.` : ""}
                    </p>
                  )}
              </div>
              <div data-signup-slots data-layout={form.appearance?.slotLayout || "rows"}>
                {section.slots.map((slot, slotIndex) => {
                  const key = slotKey(section.id, slot.id);
                  const isSelected = Boolean(selectedSlots[key]);
                  const capacity = getSlotCapacity(slot);
                  const confirmed = countConfirmedForSlot(form, section.id, slot.id);
                  const waitlisted = countWaitlistedForSlot(form, section.id, slot.id);
                  const remaining = remainingCapacityForSlot(
                    form,
                    section.id,
                    slot.id,
                    editingResponse?.id,
                  );
                  const range = formatSlotRange(slot.startTime, slot.endTime);
                  const selectedQuantity = selectedSlots[key] || 1;
                  const isFull = typeof capacity === "number" ? confirmed >= capacity : false;

                  return (
                    <div
                      key={slot.id}
                      data-signup-slot
                      data-selected={isSelected || undefined}
                      className={`rounded-xl border px-4 py-3.5 transition ${
                        isSelected
                          ? "border-[var(--signup-accent)] bg-[var(--signup-soft)] shadow-sm"
                          : "border-[var(--signup-border)] bg-[var(--signup-page)]"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="space-y-1.5">
                          <span className={themeStyles.slotNumber} aria-hidden="true">
                            {String(slotIndex + 1).padStart(2, "0")}
                          </span>
                          <div className="text-sm font-medium text-[var(--signup-text)]">
                            {slot.label}
                          </div>
                          {range && (
                            <div className="text-xs text-[var(--signup-muted)]">{range}</div>
                          )}
                          {slot.notes && (
                            <div className="text-xs text-[var(--signup-muted)]">{slot.notes}</div>
                          )}
                          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--signup-muted)]">
                            {form.settings.showRemainingSpots &&
                              (typeof capacity === "number" ? (
                                <span>
                                  {confirmed}/{capacity} claimed
                                  {` · ${Math.max(0, capacity - confirmed)} open`}
                                </span>
                              ) : (
                                <span>Unlimited capacity</span>
                              ))}
                            {waitlisted > 0 && <span>· Waitlist {waitlisted}</span>}
                            {myResponse?.slots?.some(
                              (entry) => entry.sectionId === section.id && entry.slotId === slot.id,
                            ) && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--signup-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--signup-accent)]">
                                {myResponse?.status === "waitlisted"
                                  ? "Waitlisted — not confirmed"
                                  : "Confirmed"}
                              </span>
                            )}
                            {isFull && (
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
                              max={signupQuantityLimit(form, section)}
                              {...inputProps(`slot-${section.id}-${slot.id}`)}
                              value={selectedQuantity}
                              onChange={(event) =>
                                handleQuantityChange(
                                  key,
                                  Number.parseInt(event.target.value, 10) || 1,
                                )
                              }
                              aria-label={`Quantity for ${slot.label}`}
                              className="w-16 rounded-lg border border-[var(--signup-border)] bg-[var(--signup-surface)] px-2 py-1.5 text-sm text-[var(--signup-text)] transition focus:border-[var(--signup-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--signup-focus)]"
                              disabled={!canChoose || loading}
                            />
                          )}
                          <SlotControl
                            data-signup-select
                            type="button"
                            className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                              isSelected
                                ? "border-[var(--signup-accent)] bg-[var(--signup-accent)] text-[var(--signup-on-accent)] shadow-sm hover:opacity-90"
                                : "border-[var(--signup-border)] bg-[var(--signup-surface)] text-[var(--signup-text)] hover:bg-[var(--signup-page)]"
                            }`}
                            onClick={() => handleToggleSlot(section.id, slot.id)}
                            aria-label={`${isSelected ? "Deselect" : "Select"} ${slot.label}`}
                            aria-pressed={isSelected}
                            disabled={
                              !canChoose ||
                              loading ||
                              (!isSelected && remaining === 0 && !form.settings.waitlistEnabled)
                            }
                          >
                            {isSelected
                              ? "Selected ✓"
                              : remaining === 0
                                ? form.settings.waitlistEnabled
                                  ? "Join waitlist"
                                  : "Full"
                                : "Select"}
                          </SlotControl>
                          {inlineError(`slot-${section.id}-${slot.id}`)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </TemplateBodyLayout>
      </div>

      {canChoose && (
        <form className="space-y-4" noValidate onSubmit={handleSubmit}>
          {(viewerKind === "owner" ||
            Object.keys(selectedSlots).length > 0 ||
            myResponse ||
            editingResponse) && (
            <div className="rounded-xl border border-[var(--signup-border)] bg-[var(--signup-page)] p-5 space-y-4">
              <h3 className="text-base font-semibold text-[var(--signup-text)]">Your details</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-[var(--signup-text)] mb-2">
                    Name (required)
                  </label>
                  <input
                    aria-label="Your name"
                    {...inputProps("name")}
                    autoComplete="name"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="w-full rounded-lg border border-[var(--signup-border)] bg-[var(--signup-surface)] px-4 py-2.5 text-sm text-[var(--signup-text)] placeholder:text-gray-400 transition focus:border-[var(--signup-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--signup-focus)]"
                    disabled={loading}
                  />
                  {inlineError("name")}
                </div>
                {form.settings.collectEmail && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--signup-text)] mb-2">
                      Email for reminders (required)
                    </label>
                    <input
                      aria-label="Email address"
                      {...inputProps("email")}
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="w-full rounded-lg border border-[var(--signup-border)] bg-[var(--signup-surface)] px-4 py-2.5 text-sm text-[var(--signup-text)] placeholder:text-gray-400 transition focus:border-[var(--signup-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--signup-focus)]"
                      disabled={loading}
                    />
                    {inlineError("email")}
                  </div>
                )}
                {form.settings.collectPhone && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--signup-text)] mb-2">
                      Mobile number (required)
                    </label>
                    <input
                      aria-label="Mobile number"
                      {...inputProps("phone")}
                      autoComplete="tel"
                      type="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      className="w-full rounded-lg border border-[var(--signup-border)] bg-[var(--signup-surface)] px-4 py-2.5 text-sm text-[var(--signup-text)] placeholder:text-gray-400 transition focus:border-[var(--signup-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--signup-focus)]"
                      disabled={loading}
                    />
                    {inlineError("phone")}
                  </div>
                )}
                {form.settings.collectGuestCount && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--signup-text)] mb-2">
                      Extra guests (for headcount)
                    </label>
                    <input
                      aria-label="Extra guests"
                      {...inputProps("guests")}
                      type="number"
                      min={0}
                      max={maxGuests}
                      value={guests}
                      onChange={(event) =>
                        setGuests(
                          Math.max(
                            0,
                            Math.min(maxGuests, Number.parseInt(event.target.value, 10) || 0),
                          ),
                        )
                      }
                      className="w-full rounded-lg border border-[var(--signup-border)] bg-[var(--signup-surface)] px-4 py-2.5 text-sm text-[var(--signup-text)] placeholder:text-gray-400 transition focus:border-[var(--signup-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--signup-focus)]"
                      disabled={loading}
                    />
                    {inlineError("guests")}
                  </div>
                )}
              </div>

              {form.questions.length > 0 && (
                <div className="space-y-4">
                  {form.questions.map((question) => {
                    const value = answers[question.id] || "";
                    return (
                      <div key={question.id}>
                        <label className="block text-sm font-medium text-[var(--signup-text)] mb-2">
                          {question.prompt}
                          {question.required && <span className="ml-1 text-red-500">*</span>}
                        </label>
                        {question.multiline ? (
                          <textarea
                            aria-label={question.prompt}
                            {...inputProps(`question-${question.id}`)}
                            aria-required={question.required}
                            value={value}
                            onChange={(event) =>
                              setAnswers((prev) => ({
                                ...prev,
                                [question.id]: event.target.value,
                              }))
                            }
                            rows={3}
                            className="w-full rounded-lg border border-[var(--signup-border)] bg-[var(--signup-surface)] px-4 py-2.5 text-sm text-[var(--signup-text)] placeholder:text-gray-400 transition focus:border-[var(--signup-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--signup-focus)]"
                            disabled={loading}
                          />
                        ) : (
                          <input
                            type="text"
                            aria-label={question.prompt}
                            {...inputProps(`question-${question.id}`)}
                            aria-required={question.required}
                            value={value}
                            onChange={(event) =>
                              setAnswers((prev) => ({
                                ...prev,
                                [question.id]: event.target.value,
                              }))
                            }
                            className="w-full rounded-lg border border-[var(--signup-border)] bg-[var(--signup-surface)] px-4 py-2.5 text-sm text-[var(--signup-text)] placeholder:text-gray-400 transition focus:border-[var(--signup-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--signup-focus)]"
                            disabled={loading}
                          />
                        )}
                        {inlineError(`question-${question.id}`)}
                      </div>
                    );
                  })}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[var(--signup-text)] mb-2">
                  Notes for the host (optional)
                </label>
                <textarea
                  aria-label="Additional note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-[var(--signup-border)] bg-[var(--signup-surface)] px-4 py-2.5 text-sm text-[var(--signup-text)] placeholder:text-gray-400 transition focus:border-[var(--signup-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--signup-focus)]"
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {validation.waitlisted.length > 0 && form.settings.waitlistEnabled && (
            <div className="rounded-xl border border-amber-500 p-4 text-sm">
              <p>
                <strong>Not enough places for: {validation.waitlisted.join(", ")}.</strong>
              </p>
              <p>
                Submitting now puts every selection on the waitlist, including available items.
                Nothing is reserved until all selections fit. Change the unavailable choices to
                confirm the others now.
              </p>
              <label className="mt-3 flex min-h-11 items-center gap-3">
                <input
                  type="checkbox"
                  {...inputProps("waitlist")}
                  checked={acceptWaitlist}
                  onChange={(e) => setAcceptWaitlist(e.target.checked)}
                />
                Put all my selections on the waitlist
              </label>
              {inlineError("waitlist")}
            </div>
          )}
          {attempted && validation.issues.length > 0 && (
            <div role="alert" className="rounded-xl border border-red-400 p-4 text-sm">
              <strong>Check these details</strong>
              <ul>
                {validation.issues.map((issue) => (
                  <li key={issue.field + issue.message}>
                    <button
                      type="button"
                      className="min-h-11 text-left underline"
                      onClick={() => focusIssue(issue.field)}
                    >
                      {issue.message}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          {isTestPreview && feedback && (
            <p
              key={testAttempt}
              role="status"
              className="rounded-xl border border-[var(--signup-border)] p-4"
            >
              {feedback}
            </p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="text-xs text-[var(--signup-muted)]">
              {viewerId
                ? "You can return to this page to view or update your signup."
                : form.settings.collectEmail
                  ? "No account needed. Use the private link in your confirmation email to edit or cancel on any device."
                  : "No account needed. Return using this browser to edit or cancel, or ask the organizer for help."}
            </div>
            <div className="flex items-center gap-2">
              {editingResponse && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="rounded-lg border border-[var(--signup-border)] bg-[var(--signup-surface)] px-4 py-2 text-sm font-semibold text-[var(--signup-text)] transition hover:bg-[var(--signup-page)] disabled:opacity-50"
                  disabled={loading}
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="rounded-lg bg-[var(--signup-accent)] px-5 py-2 text-sm font-bold text-white shadow-lg transition hover:shadow-xl disabled:opacity-60"
                disabled={loading}
              >
                {loading
                  ? editingResponse
                    ? "Updating..."
                    : "Saving..."
                  : editingResponse
                    ? "Update sign-up"
                    : isTestPreview
                      ? "Test signup"
                      : "Save my sign-up"}
              </button>
            </div>
          </div>
        </form>
      )}

      {myResponse && (
        <div
          id="my-signup"
          className="scroll-mt-6 rounded-xl border border-[var(--signup-border)] bg-[var(--signup-page)] p-4"
        >
          <p className="text-sm font-semibold text-[var(--signup-text)]">
            Your status:{" "}
            <span
              className={
                myResponse.status === "confirmed"
                  ? "text-emerald-600"
                  : myResponse.status === "waitlisted"
                    ? "text-amber-600"
                    : "text-[var(--signup-text)]"
              }
            >
              {myResponse.status === "confirmed"
                ? "Confirmed"
                : myResponse.status === "waitlisted"
                  ? "Waitlisted"
                  : "Cancelled"}
            </span>
          </p>
          <p className="mt-2 text-sm">{summarizeResponseSlots(form, myResponse)}</p>
          {myResponse.status === "waitlisted" && (
            <p className="mt-2 text-sm">
              No places or items are reserved yet. Edit your choices to select an available option.
            </p>
          )}
          {!editingResponse && viewerKind !== "readonly" && (
            <div className="mt-3 flex flex-wrap gap-3">
              <button
                type="button"
                className="min-h-11 rounded-lg border px-4"
                disabled={loading || !canInteract}
                onClick={() => handleEditResponse(myResponse)}
              >
                Edit my signup
              </button>
              <button
                type="button"
                className="min-h-11 rounded-lg border px-4 text-red-700"
                disabled={loading}
                onClick={handleCancel}
              >
                Cancel my signup
              </button>
            </div>
          )}
        </div>
      )}

      {viewerKind === "owner" && !hideOwnerTools && (
        <div
          id="signup-host-dashboard"
          className="scroll-mt-6 rounded-2xl border border-[var(--signup-border)] bg-[var(--signup-surface)] p-5 space-y-4 shadow-sm"
        >
          <header className="flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-[var(--signup-text)]">Host dashboard</h3>
          </header>
          <div className="grid gap-3 sm:grid-cols-2">
            {sectionProgress.map(({ section, capacity, confirmed, unlimited }) => (
              <div key={section.id} className="rounded-lg border border-[var(--signup-border)] p-3">
                <h4 className="font-semibold">{section.title}</h4>
                {section.unitLabel && <p className="text-xs">Counted in {section.unitLabel}</p>}
                <p className="text-sm">
                  {confirmed} confirmed
                  {unlimited
                    ? " · Unlimited capacity"
                    : ` · ${Math.max(0, capacity - confirmed)} of ${capacity} remaining`}
                </p>
              </div>
            ))}
          </div>
          <div className="mb-5 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center">
            <input
              aria-label="Search participants"
              placeholder="Search name, email, slot, or answer"
              value={participantSearch}
              onChange={(event) => setParticipantSearch(event.target.value)}
              className="col-span-2 min-h-11 w-full min-w-0 sm:w-auto sm:flex-1 rounded-lg border border-[var(--signup-border)] px-3 py-2"
            />
            <button
              type="button"
              onClick={exportCsv}
              className="rounded-lg border border-[var(--signup-border)] px-3 py-2 text-sm"
            >
              Export CSV
            </button>
            <button
              type="button"
              onClick={setOpen}
              disabled={loading}
              className="rounded-lg border border-[var(--signup-border)] px-3 py-2 text-sm"
            >
              {form.enabled ? "Close signups" : "Reopen signups"}
            </button>
          </div>
          {visibleResponses.length === 0 && (
            <p className="text-sm text-[var(--signup-muted)]">
              {participantSearch
                ? "No participants match your search."
                : "Your first signup will appear here."}
            </p>
          )}
          <div className="space-y-4">
            {confirmedResponses.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--signup-muted)] mb-2">
                  Confirmed
                </h4>
                <div className="space-y-2">
                  {confirmedResponses.map((response) => (
                    <div
                      key={response.id}
                      className="rounded-xl border border-[var(--signup-border)] bg-[var(--signup-page)] px-4 py-3 text-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold text-[var(--signup-text)]">
                          {response.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[var(--signup-muted)]">
                            {formatUsDateTime(response.updatedAt || response.createdAt || "")}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleEditResponse(response)}
                            disabled={loading || removingResponseId === response.id}
                            className="text-xs px-3 py-1.5 rounded-lg border border-[var(--signup-border)] bg-[var(--signup-surface)] text-[var(--signup-text)] hover:bg-[var(--signup-page)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Edit sign-up"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveResponse(response.id)}
                            disabled={loading || removingResponseId === response.id}
                            className="text-xs px-3 py-1.5 rounded-lg border border-red-300 bg-[var(--signup-surface)] text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Remove sign-up"
                          >
                            {removingResponseId === response.id ? "Removing..." : "Remove"}
                          </button>
                        </div>
                      </div>
                      <div className="text-sm text-[var(--signup-muted)] mt-2">
                        {summarizeResponseSlots(form, response) || "No slots selected"}
                      </div>
                      <div className="text-xs text-[var(--signup-muted)] mt-1.5 flex flex-wrap gap-3">
                        {response.email && <span>{response.email}</span>}
                        {response.phone && <span>{response.phone}</span>}
                        {!!response.guests && response.guests > 0 && (
                          <span>{response.guests} guests</span>
                        )}
                      </div>
                      {responseDetails(response)}
                      {response.note && (
                        <div className="mt-2 text-sm text-[var(--signup-muted)] bg-[var(--signup-surface)] rounded-lg px-3 py-2 border border-[var(--signup-border)]">
                          <span className="font-medium">Note:</span> {response.note}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {waitlistedResponses.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--signup-muted)] mb-2">
                  Waitlist
                </h4>
                <div className="space-y-2">
                  {waitlistedResponses.map((response) => (
                    <div
                      key={response.id}
                      className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold text-amber-900">{response.name}</span>
                        <span className="text-xs text-amber-700">
                          {formatUsDateTime(response.updatedAt || response.createdAt || "")}
                        </span>
                      </div>
                      <div className="text-sm text-amber-800 mt-2">
                        {summarizeResponseSlots(form, response) || "No slots selected"}
                      </div>
                      {responseDetails(response)}
                      <div className="mt-3 flex flex-wrap gap-3">
                        <button
                          type="button"
                          className="min-h-11 rounded-lg border px-4"
                          disabled={loading || !canInteract}
                          onClick={() => handleEditResponse(response)}
                        >
                          Edit signup
                        </button>
                        <button
                          type="button"
                          className="min-h-11 rounded-lg border px-4"
                          disabled={loading || removingResponseId === response.id}
                          onClick={() => handleRemoveResponse(response.id)}
                        >
                          Cancel signup
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {cancelledResponses.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--signup-muted)] mb-2">
                  Cancelled (for audit trail)
                </h4>
                <div className="space-y-2 text-sm text-[var(--signup-muted)]">
                  {cancelledResponses.map((response) => (
                    <div
                      key={response.id}
                      className="rounded-lg bg-[var(--signup-page)] px-3 py-2 border border-[var(--signup-border)]"
                    >
                      {response.name} —{" "}
                      {formatUsDateTime(response.updatedAt || response.createdAt || "")}
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
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-[var(--signup-border)] bg-[var(--signup-surface)] shadow-2xl">
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
                  <h3 className="text-lg font-bold text-[var(--signup-text)]">
                    {resultStatus === "waitlisted"
                      ? "You're on the waitlist"
                      : "Sign-up confirmed!"}
                  </h3>
                  <p className="text-sm text-[var(--signup-muted)]">
                    {resultStatus === "waitlisted" ? (
                      <>
                        All your selections are waitlisted. Nothing is reserved yet. You can edit
                        your choices below, or wait until all requested places become available.
                      </>
                    ) : (
                      <>
                        Your signup is confirmed. Your selected slots are saved below. You can
                        return to this page to view or update them.
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="rounded-lg border border-[var(--signup-border)] bg-[var(--signup-surface)] px-5 py-2.5 text-sm font-semibold text-[var(--signup-text)] hover:bg-[var(--signup-page)] transition-colors"
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
          <div className="absolute inset-0 bg-black/40" onClick={() => setErrorOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-red-300 bg-[var(--signup-surface)] shadow-2xl">
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
                  <h3 className="text-lg font-bold text-[var(--signup-text)]">Sign-up failed</h3>
                  <p className="text-sm text-[var(--signup-muted)]">{error}</p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="rounded-lg border border-[var(--signup-border)] bg-[var(--signup-surface)] px-5 py-2.5 text-sm font-semibold text-[var(--signup-text)] hover:bg-[var(--signup-page)] transition-colors"
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
