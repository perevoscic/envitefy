import assert from "node:assert/strict";
import test from "node:test";
import { addAssociation, hasAssociation, normalizeFingerprint } from "./assetlinks.mjs";

const fingerprint = "AB".repeat(32);
const otherFingerprint = "CD".repeat(32);
const legacy = [{ relation: ["delegate_permission/common.handle_all_urls"], target: {
  namespace: "android_app", package_name: "com.snapmydate.twa", sha256_cert_fingerprints: [normalizeFingerprint(fingerprint)],
} }];

test("a legacy package with the same certificate cannot verify the Envitefy app", () => {
  assert.equal(hasAssociation(legacy, fingerprint), false);
});
test("adding the Play certificate preserves legacy and sideload associations without duplicates", () => {
  const local = addAssociation(legacy, fingerprint);
  const play = addAssociation(local, otherFingerprint);
  assert.deepEqual(play[0], legacy[0]);
  assert.equal(legacy.length, 1);
  assert.equal(local[1].target.sha256_cert_fingerprints.length, 1);
  assert.equal(hasAssociation(play, fingerprint), true);
  assert.equal(hasAssociation(play, otherFingerprint), true);
  assert.deepEqual(addAssociation(play, otherFingerprint.toLowerCase()), play);
});
test("invalid and placeholder certificates are rejected", () => {
  for (const value of ["REPLACE_WITH_RELEASE_CERT_SHA256", "AA".repeat(20), "GG".repeat(32), ""]) {
    assert.throws(() => addAssociation(legacy, value), /real SHA-256/);
  }
  assert.throws(() => addAssociation({}, fingerprint), /array/);
});
