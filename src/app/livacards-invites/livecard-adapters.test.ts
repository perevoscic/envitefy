import { test } from "node:test";
import assert from "node:assert/strict";
import {
  liveCardHistoryPayload,
  liveCardInvitation,
  restoreLiveCardForm,
} from "./livecard-adapters";
import { createLiveCardForm, liveCardDesignKey } from "@/lib/livecard-builder";
test("guided card payloads use current facts and keep disabled guest actions out of public content", () => {
  const form = {
    ...createLiveCardForm("America/Chicago"),
    title: "Movie night",
    eventType: "Birthday" as const,
    design: "Pink",
    overview: "Fresh wording",
    date: "2026-10-04",
    startTime: "18:00",
    hostName: "Mia",
    registryUrl: "https://example.com/gifts",
  };
  const previous = {
    description: "Old wording",
    subtitle: "Old subtitle",
    heroTextMode: "image" as const,
  };
  const invitation = liveCardInvitation(form, previous);
  assert.equal(invitation.description, "Fresh wording");
  assert.equal(liveCardInvitation({ ...form, overview: "" }, previous).description, "");
  const payload = liveCardHistoryPayload(
    form,
    { imageUrl: "/artwork.webp", designKey: liveCardDesignKey(form), invitationData: previous },
    "draft",
  );
  assert.equal(payload.data.status, "draft");
  assert.equal(payload.data.startISO, "2026-10-04T23:00:00.000Z");
  assert.equal(payload.data.rsvpEnabled, false);
  assert.equal(payload.data.studioCard.invitationData.eventDetails.rsvpName, "");
  assert.equal(payload.data.studioCard.invitationData.eventDetails.registryLink, "");
  assert.equal(payload.data.liveCardBuilder.form.hostName, "Mia");
  assert.equal(payload.data.createdVia, "livecard-builder");
});

test("reopening a card retains owner contact edits and deliberately cleared contacts", () => {
  const form = {
    ...createLiveCardForm(),
    rsvpEnabled: true,
    hostName: "Old host",
    hostEmail: "old@example.com",
    hostPhone: "3125550100",
  };
  const restored = restoreLiveCardForm(form, {
    rsvpName: "New host",
    rsvpEmail: "new@example.com",
    rsvpPhone: "",
  });
  assert.equal(restored?.hostName, "New host");
  assert.equal(restored?.hostEmail, "new@example.com");
  assert.equal(restored?.hostPhone, "");
  assert.equal(
    restoreLiveCardForm(
      { ...form, rsvpEnabled: false },
      { rsvpName: "", rsvpEmail: "", rsvpPhone: "" },
    )?.hostEmail,
    "old@example.com",
  );
});
