import { test } from "node:test";
import assert from "node:assert/strict";
import {
  liveCardHistoryPayload,
  liveCardInvitation,
  restoreLiveCardForm,
} from "./livecard-adapters";
import { createLiveCardForm, liveCardDesignKey, sharedCardDesignKey } from "@/lib/livecard-builder";
import { sanitizeInvitationData } from "@/app/studio/studio-workspace-sanitize";

test("layered saved cards retain their background and typography while using the latest facts", () => {
  const form = { ...createLiveCardForm(), title: "Livia's Birthday", headlineIntro: "You're invited", startTime: "19:30", design: "Pink movie night" };
  const sharedDesign = { version: 1 as const, backgroundUrl: "/background.webp", font: "classic" as const, ink: "#552233", accent: "#885522", surface: "#fff4ec" };
  const payload = liveCardHistoryPayload(form, { imageUrl: "/composed.webp", designKey: sharedCardDesignKey(form), invitationData: { sharedDesign } }, "draft");
  assert.equal(payload.data.liveCardBuilder.version, 3);
  assert.equal(payload.data.studioCard.imageUrl, "/composed.webp");
  const saved = payload.data.studioCard.invitationData;
  const restored = sanitizeInvitationData(saved, saved.eventDetails);
  assert.deepEqual(restored?.sharedDesign, { ...sharedDesign, typography: "cinematic" });
  assert.equal(restored?.headlineIntro, "You're invited");
  assert.equal(restored?.eventDetails.startTime, "19:30");
  assert.equal(liveCardInvitation({ ...form, title: "Updated title" }, restored).title, "Updated title");
});
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

test("classic invites preserve printed facts and disable online RSVP tools", () => {
  const form = {
    ...createLiveCardForm("America/New_York"),
    format: "digital_flyer" as const,
    title: "Movie night",
    date: "2026-09-26",
    startTime: "16:00",
    rsvpEnabled: true,
    hostName: "Mia",
    hostEmail: "mia@example.com",
  };
  const payload = liveCardHistoryPayload(
    form,
    { imageUrl: "/invite.webp", designKey: liveCardDesignKey(form) },
    "published",
  );
  assert.equal(payload.data.primaryOutput, "digital_flyer");
  assert.equal(payload.data.productType, "digital_flyer");
  assert.equal(payload.data.publicRenderer, "digital_flyer");
  assert.equal(payload.data.studioCard.invitationData.eventDetails.product, "digital_flyer");
  assert.equal(payload.data.studioCard.invitationData.eventDetails.rsvpContact, "mia@example.com");
  assert.equal(payload.data.rsvpEnabled, false);
  assert.equal(payload.data.rsvpMode, "external");
  assert.equal(payload.data.startISO, "2026-09-26T20:00:00.000Z");
  assert.equal(payload.data.liveCardBuilder.version, 2);
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
