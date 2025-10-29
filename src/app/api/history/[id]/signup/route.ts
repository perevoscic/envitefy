import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { NextAuthOptions, Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getEventHistoryById,
  getUserIdByEmail,
  isEventSharedWithUser,
  updateEventHistoryData,
  getSignupFormByEventId,
  upsertSignupForm,
} from "@/lib/db";
import {
  sanitizeSignupForm,
  generateSignupId,
  findSignupSlot,
  findSignupResponseForUser,
  normalizeSignupQuantity,
  remainingCapacityForSlot,
  rebalanceSignupWaitlist,
} from "@/utils/signup";
import type {
  SignupForm,
  SignupResponse,
  SignupResponseSlot,
} from "@/types/signup";
import { sendSignupConfirmationEmail } from "@/lib/email";
import { absoluteUrl } from "@/lib/absolute-url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ReservePayload = {
  action: "reserve";
  slots: Array<{
    sectionId: string;
    slotId: string;
    quantity?: number;
  }>;
  name?: string;
  email?: string;
  phone?: string;
  guests?: number;
  note?: string;
  answers?: Array<{ questionId?: string; id?: string; value?: string }>;
  signupId?: string;
};

type CancelPayload = {
  action: "cancel";
  signupId?: string;
};

type RequestPayload = ReservePayload | CancelPayload;

const normalizeSlots = (
  form: SignupForm,
  raw: ReservePayload["slots"]
): SignupResponseSlot[] => {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const slots: SignupResponseSlot[] = [];
  for (const entry of raw) {
    const sectionId =
      typeof entry?.sectionId === "string" ? entry.sectionId.trim() : "";
    const slotId = typeof entry?.slotId === "string" ? entry.slotId.trim() : "";
    if (!sectionId || !slotId) continue;
    if (!findSignupSlot(form, sectionId, slotId)) continue;
    const key = `${sectionId}::${slotId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    slots.push({
      sectionId,
      slotId,
      quantity: normalizeSignupQuantity(entry?.quantity ?? 1),
    });
  }
  return slots;
};

const normalizeAnswers = (
  form: SignupForm,
  raw: ReservePayload["answers"]
): Array<{ questionId: string; value: string }> => {
  if (!Array.isArray(raw)) return [];
  const validIds = new Set(form.questions.map((question) => question.id));
  const answers: Array<{ questionId: string; value: string }> = [];
  for (const entry of raw) {
    const questionId =
      typeof entry?.questionId === "string"
        ? entry.questionId.trim()
        : typeof entry?.id === "string"
        ? entry.id.trim()
        : "";
    if (!questionId || !validIds.has(questionId)) continue;
    const value =
      typeof entry?.value === "string" ? entry.value.trim() : "";
    if (!value) continue;
    answers.push({ questionId, value });
  }
  return answers;
};

const buildDefaultName = (
  sessionUser: Session["user"] | null | undefined
): string => {
  const baseName =
    (typeof sessionUser?.name === "string" && sessionUser.name.trim()) || "";
  if (baseName) return baseName;
  const email = (sessionUser?.email as string | undefined) || "";
  if (email && email.includes("@")) {
    return email.split("@")[0] || "Guest";
  }
  return "Guest";
};

const clampGuests = (maxGuests: number, value?: number | null): number | null => {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const normalized = Math.max(0, Math.min(maxGuests, Math.round(value)));
  return normalized > 0 ? normalized : null;
};

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions as NextAuthOptions);
    const sessionUser: Session["user"] | null = session?.user ?? null;
    const sessionEmail = (sessionUser?.email as string | undefined) || null;
    const userId = sessionEmail ? await getUserIdByEmail(sessionEmail) : null;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as RequestPayload | null;
    if (!body || typeof body.action !== "string") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const row = await getEventHistoryById(id);
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const ownerId = row.user_id || null;
    const isOwner = Boolean(ownerId && ownerId === userId);
    let allowed = isOwner;
    if (!allowed) {
      const shared = await isEventSharedWithUser(id, userId);
      allowed = shared === true;
    }
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const existingData = (row.data ?? null) as Record<string, unknown> | null;
    const tableRow = await getSignupFormByEventId(id);
    const rawFormSource = tableRow?.form || (existingData?.["signupForm"] as any);
    if (!rawFormSource || typeof rawFormSource !== "object") {
      return NextResponse.json(
        { error: "Sign-up form is not enabled for this event." },
        { status: 400 }
      );
    }
    const form = sanitizeSignupForm({
      ...(rawFormSource as SignupForm),
      enabled: true,
    });
    // Best-effort backfill to normalized table only when legacy JSON exists and looks valid
    if (!tableRow && Array.isArray((rawFormSource as any).sections) && typeof (rawFormSource as any).version === "number") {
      try {
        await upsertSignupForm(id, form);
      } catch {}
    }
    if (!form.sections.length) {
      return NextResponse.json(
        { error: "Sign-up form is missing sections." },
        { status: 400 }
      );
    }

    if (body.action === "reserve") {
      const settings = form.settings;
      const normalizedSlots = normalizeSlots(form, body.slots);
      if (!normalizedSlots.length) {
        return NextResponse.json(
          { error: "Pick at least one slot." },
          { status: 400 }
        );
      }
      if (
        !settings.allowMultipleSlotsPerPerson &&
        normalizedSlots.length > 1
      ) {
        return NextResponse.json(
          {
            error:
              "This form allows one slot per person. Deselect extra slots and try again.",
          },
          { status: 400 }
        );
      }

      const providedName =
        typeof body.name === "string" ? body.name.trim() : "";
      const defaultName = buildDefaultName(sessionUser);
      const name = providedName || defaultName;
      if (!name) {
        return NextResponse.json(
          { error: "Tell us who is signing up." },
          { status: 400 }
        );
      }

      const answers = normalizeAnswers(form, body.answers);
      const requiredIds = form.questions
        .filter((question) => question.required)
        .map((question) => question.id);
      const missingRequired = requiredIds.filter(
        (id) => !answers.some((answer) => answer.questionId === id)
      );
      if (missingRequired.length > 0) {
        return NextResponse.json(
          { error: "Answer the required questions before submitting." },
          { status: 400 }
        );
      }

      const signupId =
        typeof body.signupId === "string" ? body.signupId.trim() : "";
      const existingResponse =
        (signupId
          ? form.responses.find((response) => response.id === signupId)
          : null) ||
        findSignupResponseForUser(form, userId, sessionEmail);

      const remainingBaseForm: SignupForm = {
        ...form,
        responses: existingResponse
          ? form.responses.filter((response) => response.id !== existingResponse.id)
          : [...form.responses],
      };

      let shouldWaitlist = false;
      for (const slotSelection of normalizedSlots) {
        const slotMeta = findSignupSlot(
          form,
          slotSelection.sectionId,
          slotSelection.slotId
        );
        if (!slotMeta) {
          return NextResponse.json(
            { error: "One of the selected slots no longer exists." },
            { status: 400 }
          );
        }
        const capacity = remainingCapacityForSlot(
          remainingBaseForm,
          slotSelection.sectionId,
          slotSelection.slotId
        );
        if (capacity === null) continue; // unlimited
        if (slotSelection.quantity > capacity) {
          if (settings.waitlistEnabled) {
            shouldWaitlist = true;
          } else if (settings.lockWhenFull) {
            return NextResponse.json(
              {
                error:
                  "That slot is already full. Pick a different slot or try again later.",
              },
              { status: 409 }
            );
          } else {
            shouldWaitlist = true;
          }
        }
      }

      const nowIso = new Date().toISOString();
      const guests = clampGuests(settings.maxGuestsPerSignup, body.guests);
      const email =
        settings.collectEmail &&
        typeof body.email === "string" &&
        body.email.trim()
          ? body.email.trim()
          : settings.collectEmail
          ? sessionEmail
          : null;
      const phone = settings.collectPhone
        ? typeof body.phone === "string" && body.phone.trim()
          ? body.phone.trim()
          : existingResponse?.phone || null
        : null;
      const note =
        typeof body.note === "string" && body.note.trim()
          ? body.note.trim()
          : null;

      const newResponse: SignupResponse = {
        id: existingResponse?.id || generateSignupId(),
        userId,
        name,
        email: email || null,
        phone: phone || null,
        guests,
        note,
        slots: normalizedSlots,
        answers,
        status: shouldWaitlist ? "waitlisted" : "confirmed",
        createdAt: existingResponse?.createdAt || nowIso,
        updatedAt: nowIso,
      };

      const responsesNext = existingResponse
        ? [
            ...form.responses.filter(
              (response) => response.id !== existingResponse.id
            ),
            newResponse,
          ]
        : [...form.responses, newResponse];

      const nextForm: SignupForm = rebalanceSignupWaitlist({
        ...form,
        responses: responsesNext,
      });
      const normalizedNext = sanitizeSignupForm({
        ...nextForm,
        enabled: true,
      });

      const mergedData: Record<string, unknown> = {
        ...(existingData ?? {}),
        signupForm: normalizedNext,
      };
      const updatedRow = await updateEventHistoryData(id, mergedData);
      try {
        await upsertSignupForm(id, normalizedNext);
      } catch {}
      const updatedData = (updatedRow?.data ?? null) as
        | Record<string, unknown>
        | null;
      const persistedCandidate = updatedData?.["signupForm"];
      const persistedForm =
        persistedCandidate && typeof persistedCandidate === "object"
          ? sanitizeSignupForm({
              ...(persistedCandidate as SignupForm),
              enabled: true,
            })
          : normalizedNext;
      const latestResponse =
        persistedForm.responses.find(
          (response) => response.id === newResponse.id
        ) || newResponse;
      const signupFormUrl = await absoluteUrl(`/smart-signup-form/${id}`);
      // Fire-and-forget: email confirmation to participant when we have an email
      (async () => {
        try {
          const toEmail = (latestResponse.email || (sessionEmail as string | null)) as string | undefined;
          if (toEmail) {
            await sendSignupConfirmationEmail({
              toEmail,
              userName: latestResponse.name || null,
              eventTitle: row.title || "Smart sign-up",
              eventUrl: signupFormUrl,
              form: persistedForm,
              response: latestResponse,
            });
          }
        } catch (err) {
          console.error("[signup] failed to send confirmation email", err);
        }
      })();

      return NextResponse.json({
        ok: true,
        status: latestResponse.status,
        signupForm: persistedForm,
        response: latestResponse,
      });
    }

    if (body.action === "cancel") {
      const signupId =
        typeof body.signupId === "string" ? body.signupId.trim() : "";
      if (!signupId) {
        return NextResponse.json(
          { error: "Missing signup ID." },
          { status: 400 }
        );
      }

      const target = form.responses.find(
        (response) => response.id === signupId
      );
      if (!target) {
        return NextResponse.json(
          { error: "Sign-up entry not found." },
          { status: 404 }
        );
      }
      if (!isOwner && target.userId && target.userId !== userId) {
        return NextResponse.json(
          {
            error: "You can only cancel your own sign-up.",
          },
          { status: 403 }
        );
      }

      const nowIso = new Date().toISOString();
      const responsesNext = form.responses.map((response) =>
        response.id === signupId
          ? { ...response, status: "cancelled" as "cancelled", updatedAt: nowIso }
          : response
      );
      const nextForm: SignupForm = rebalanceSignupWaitlist({
        ...form,
        responses: responsesNext,
      });
      const normalizedNext = sanitizeSignupForm({
        ...nextForm,
        enabled: true,
      });

      const cancelMerged: Record<string, unknown> = {
        ...(existingData ?? {}),
        signupForm: normalizedNext,
      };
      const updatedRow = await updateEventHistoryData(id, cancelMerged);
      try {
        await upsertSignupForm(id, normalizedNext);
      } catch {}
      const updatedData = (updatedRow?.data ?? null) as
        | Record<string, unknown>
        | null;
      const persistedCandidate = updatedData?.["signupForm"];
      const persistedForm =
        persistedCandidate && typeof persistedCandidate === "object"
          ? sanitizeSignupForm({
              ...(persistedCandidate as SignupForm),
              enabled: true,
            })
          : normalizedNext;
      return NextResponse.json({
        ok: true,
        signupForm: persistedForm,
      });
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch (error: unknown) {
    console.error("[signup] API error", error);
    return NextResponse.json(
      { error: "Unexpected error processing signup request." },
      { status: 500 }
    );
  }
}
