import assert from "node:assert/strict";
import test from "node:test";
import { normalizeMedicalAppointmentCategory } from "../medical-appointments.ts";
import {
  generatedScanHero,
  resolveScanMediaPolicy,
  withoutMedicalSourceMedia,
} from "./scan-media.ts";

test("paperwork generates artwork; designed invitations always retain their original hero", () => {
  for (const title of ["Appointment", "Travel itinerary", "Soccer schedule"]) {
    assert.equal(resolveScanMediaPolicy({ createdVia: "ocr" }, title).heroMode, "generated");
  }
  const invite = { createdVia: "ocr-birthday-skin", scanSourceKind: "designed" };
  assert.equal(resolveScanMediaPolicy(invite, "Birthday party").heroMode, "original");
  assert.equal(
    resolveScanMediaPolicy({ ...invite, scanHeroMode: "generated" }, "Birthday party").heroMode,
    "original",
  );
  assert.equal(
    resolveScanMediaPolicy({ createdVia: "ocr", scanSourceKind: "paperwork" }, "School activities")
      .heroMode,
    "generated",
  );
});

test("business cards use generated heroes and legacy flyer choices recover the original", () => {
  assert.equal(resolveScanMediaPolicy({ createdVia: "ocr" }, "Business card").heroMode, "generated");
  const data = { createdVia: "ocr", scanHeroMode: "generated", scanSourceKind: "unknown" };
  assert.equal(resolveScanMediaPolicy(data, "Wedding invitation").heroMode, "original");
  assert.equal(resolveScanMediaPolicy({ ...data, fieldsGuess: { scanSourceKind: "designed" } }, "Wedding").heroMode, "original");
  assert.equal(data.scanHeroMode, "generated", "legacy display recovery does not mutate saved data");
});

test("medical sources always use generated artwork, including legacy and manual categories", () => {
  for (const category of ["Doctor Appointments", "Medical Appointments", "doctor_appointment"]) {
    assert.equal(normalizeMedicalAppointmentCategory(category), "Medical Appointments");
    assert.deepEqual(resolveScanMediaPolicy({ category, scanHeroMode: "original" }, "Visit"), {
      sourceKind: "paperwork",
      heroMode: "generated",
      medical: true,
    });
  }
  assert.equal(
    resolveScanMediaPolicy({ createdVia: "ocr", category: "Appointments" }, "Haircut appointment")
      .medical,
    false,
  );
});

test("guest data retains event details and generated artwork but removes the original and DOB", () => {
  const data = {
    createdVia: "ocr",
    category: "Doctor Appointments",
    attachment: { dataUrl: "https://source.example/secret.jpg" },
    thumbnail: "secret-preview",
    fieldsGuess: { personBirthDate: "2019-05-22" },
    ocrText: "patient record",
    ocrFacts: [
      { label: "DOB", value: "2019-05-22" },
      { label: "Patient", value: "Maya" },
      { label: "Patient ID", value: "123" },
    ],
    scanArtwork: {
      version: 1,
      status: "ready",
      imageUrl: "/background.webp",
      heroImageUrl: "/hero.webp",
    },
  };
  const guest = withoutMedicalSourceMedia(data, "ENT appointment");
  assert.doesNotMatch(JSON.stringify(guest), /secret|2019-05-22|patient record/);
  assert.equal(guest.heroImage, "/hero.webp");
  assert.equal(guest.ocrFacts.length, 2);
  assert.equal(data.attachment.dataUrl, "https://source.example/secret.jpg");
  assert.equal(data.ocrFacts.length, 3);
  assert.equal(generatedScanHero(data), "/hero.webp");
});
