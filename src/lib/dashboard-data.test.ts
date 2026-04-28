import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  isInvitedEventLikeRecord,
  normalizeDashboardEventOwnership,
  toDashboardEvent,
} from "./dashboard-data.ts";

test("normalizeDashboardEventOwnership treats explicit invited ownership as invited", () => {
  assert.equal(normalizeDashboardEventOwnership("invited"), "invited");
});

test("normalizeDashboardEventOwnership treats invitedFromScan rows as invited", () => {
  assert.equal(normalizeDashboardEventOwnership("owned", "manual", true), "invited");
  assert.equal(isInvitedEventLikeRecord({ ownership: "owned", invitedFromScan: true }), true);
});

test("normalizeDashboardEventOwnership keeps manual and discovery rows owned", () => {
  assert.equal(normalizeDashboardEventOwnership("owned", "manual", false), "owned");
  assert.equal(normalizeDashboardEventOwnership(null, "url", false), "owned");
});

test("normalizeDashboardEventOwnership does not infer invited from OCR alone", () => {
  assert.equal(normalizeDashboardEventOwnership(null, "ocr", false), "owned");
  assert.equal(isInvitedEventLikeRecord({ ownership: "owned", invitedFromScan: false }), false);
});

test("toDashboardEvent preserves invited ownership from invite markers", () => {
  const event = toDashboardEvent({
    id: "evt_1",
    title: "Birthday Invite",
    created_at: "2026-03-23T12:00:00.000Z",
    data: {
      startAt: "2026-06-01T18:00:00.000Z",
      ownership: "owned",
      invitedFromScan: true,
      createdVia: "ocr",
    },
  });

  assert.ok(event);
  assert.equal(event?.ownership, "invited");
});

test("toDashboardEvent keeps OCR-created rows owned without invite markers", () => {
  const event = toDashboardEvent({
    id: "evt_2",
    title: "Gymnastics Meet",
    created_at: "2026-03-23T12:00:00.000Z",
    data: {
      startAt: "2026-06-02T18:00:00.000Z",
      createdVia: "ocr",
    },
  });

  assert.ok(event);
  assert.equal(event?.ownership, "owned");
});

test("toDashboardEvent groups basketball OCR scans as sport events", () => {
  const event = toDashboardEvent({
    id: "evt_basketball_scan",
    title: "Pickup Basketball Community Open Run",
    created_at: "2026-03-23T12:00:00.000Z",
    data: {
      startAt: "2026-07-12T18:30:00.000Z",
      category: "General Events",
      createdVia: "ocr-basketball-skin",
      ocrSkin: {
        category: "basketball",
      },
    },
  });

  assert.ok(event);
  assert.equal(event?.category, "Sport Events");
});

test("toDashboardEvent marks events without RSVP fields as not RSVP actionable", () => {
  const event = toDashboardEvent({
    id: "evt_no_rsvp",
    title: "Graduation Ceremony",
    created_at: "2026-03-23T12:00:00.000Z",
    data: {
      startAt: "2026-06-02T18:00:00.000Z",
      location: "129 Greenway Trail, Santa Rosa Beach, FL",
      ownership: "invited",
    },
  });

  assert.ok(event);
  assert.equal(event?.hasRsvp, false);
});

test("toDashboardEvent marks direct RSVP signals as actionable", () => {
  const cases = [
    { rsvpEnabled: true },
    { rsvp: "RSVP to host@example.com" },
    { rsvpUrl: "https://example.com/rsvp" },
    { rsvpDeadline: "May 1" },
    { rsvp: { isEnabled: true } },
    { rsvp: { contact: "host@example.com" } },
    { rsvp: { url: "https://example.com/rsvp" } },
    { numberOfGuests: 24 },
  ];

  for (const [index, data] of cases.entries()) {
    const event = toDashboardEvent({
      id: `evt_rsvp_${index}`,
      title: "Birthday Invite",
      created_at: "2026-03-23T12:00:00.000Z",
      data: {
        startAt: "2026-06-02T18:00:00.000Z",
        ...data,
      },
    });

    assert.equal(event?.hasRsvp, true);
  }
});

test("toDashboardEvent marks OCR RSVP fields as actionable", () => {
  const event = toDashboardEvent({
    id: "evt_ocr_rsvp",
    title: "Wedding Invite",
    created_at: "2026-03-23T12:00:00.000Z",
    data: {
      startAt: "2026-06-02T18:00:00.000Z",
      fieldsGuess: {
        rsvpDeadline: "May 1",
      },
    },
  });

  assert.ok(event);
  assert.equal(event?.hasRsvp, true);
});

test("toDashboardEvent excludes studio-only cards from dashboard collections", () => {
  const event = toDashboardEvent({
    id: "evt_studio",
    title: "Studio Card",
    created_at: "2026-03-23T12:00:00.000Z",
    data: {
      startAt: "2026-06-02T18:00:00.000Z",
      createdVia: "studio",
    },
  });

  assert.equal(event, null);
});

test("toDashboardEvent uses image attachment urls as dashboard covers", () => {
  const event = toDashboardEvent({
    id: "evt_3",
    title: "Image Flyer",
    created_at: "2026-03-23T12:00:00.000Z",
    data: {
      startAt: "2026-06-03T18:00:00.000Z",
      attachment: {
        type: "image/webp",
        dataUrl: "https://blob.example.com/display.webp",
      },
    },
  });

  assert.equal(event?.coverImageUrl, "https://blob.example.com/display.webp");
});

test("toDashboardEvent uses pdf preview urls instead of pdf source urls as covers", () => {
  const event = toDashboardEvent({
    id: "evt_4",
    title: "PDF Flyer",
    created_at: "2026-03-23T12:00:00.000Z",
    data: {
      startAt: "2026-06-04T18:00:00.000Z",
      attachment: {
        type: "application/pdf",
        dataUrl: "https://blob.example.com/source.pdf",
        previewImageUrl: "https://blob.example.com/display.webp",
      },
    },
  });

  assert.equal(event?.coverImageUrl, "https://blob.example.com/display.webp");
});

test("toDashboardEvent preserves and clamps valid dashboard thumbnail focus", () => {
  const event = toDashboardEvent({
    id: "evt_focus",
    title: "Graduation Invite",
    created_at: "2026-03-23T12:00:00.000Z",
    data: {
      startAt: "2026-06-05T18:00:00.000Z",
      thumbnailFocus: {
        target: "face",
        x: 1.2,
        y: -0.1,
        confidence: 1.5,
      },
    },
  });

  assert.deepEqual(event?.thumbnailFocus, {
    target: "face",
    x: 1,
    y: 0,
    confidence: 1,
  });
});

test("toDashboardEvent ignores invalid dashboard thumbnail focus", () => {
  const event = toDashboardEvent({
    id: "evt_bad_focus",
    title: "Graduation Invite",
    created_at: "2026-03-23T12:00:00.000Z",
    data: {
      startAt: "2026-06-05T18:00:00.000Z",
      thumbnailFocus: {
        target: "pet",
        x: 0.5,
        y: 0.5,
      },
    },
  });

  assert.equal(event?.thumbnailFocus, null);
});

test("db projections keep invite marker ownership logic in source", () => {
  const source = readFileSync(new URL("./db.ts", import.meta.url), "utf8");

  assert.match(source, /buildOwnedHistoryOwnershipSql/);
  assert.match(source, /->>'ownership'/);
  assert.match(source, /->>'invitedFromScan'/);
  assert.match(source, /'invitedFromScan', \$\{invitedFromScanSql\}/);
  assert.match(source, /previewImageUrl/);
  assert.match(source, /thumbnailUrl/);
  assert.match(source, /thumbnailFocus/);
  assert.match(source, /thumbnail_focus/);
  assert.match(source, /rsvpEnabled/);
  assert.match(source, /rsvpUrl/);
  assert.match(source, /fields_guess_rsvp/);
});
