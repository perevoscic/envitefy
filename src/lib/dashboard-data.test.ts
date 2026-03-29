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

test("db projections keep invite marker ownership logic in source", () => {
  const source = readFileSync(new URL("./db.ts", import.meta.url), "utf8");

  assert.match(source, /buildOwnedHistoryOwnershipSql/);
  assert.match(source, /->>'ownership'/);
  assert.match(source, /->>'invitedFromScan'/);
  assert.match(source, /'invitedFromScan', \$\{invitedFromScanSql\}/);
  assert.match(source, /previewImageUrl/);
  assert.match(source, /thumbnailUrl/);
});
