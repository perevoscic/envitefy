import assert from "node:assert/strict";
import test from "node:test";
import { appointmentDisplayDetails } from "./appointment-details.ts";
import { filterRenderedOcrFacts } from "./facts.ts";

const facts = [
  { label: "Patient", value: "MAYA SAMPLE" },
  { label: "DOB", value: "05/22/2019" },
  { label: "Patient ID", value: "SAMPLE-12345" },
  { label: "Appointment Provider", value: "JANE EXAMPLE, PA" },
  { label: "Fax", value: "(555) 010-0101" },
  { label: "Host", value: "Sample Clinic" },
];

test("appointments keep five useful cards and omit DOB without modifying source facts", () => {
  const result = appointmentDisplayDetails({ title: "Maya ENT appointment", facts });
  assert.deepEqual(result.facts, facts.filter((fact) => fact.label !== "DOB"));
  assert.equal(facts[1].value, "05/22/2019");
  for (const label of ["D.O.B.", "Date of Birth", "Birth date", "Birthday", "Patient DOB"]) {
    assert.deepEqual(appointmentDisplayDetails({
      title: "Check-up", category: "Appointments", facts: [{ label, value: "05/22/2019" }],
    }).facts, []);
  }
});

test("medical appointment cards distinguish the clinician from the organization", () => {
  for (const category of ["Medical Appointments", "Doctor Appointments", "Dental Appointments"]) {
    const result = appointmentDisplayDetails({ title: "Maya ENT appointment", category, facts });
    assert.deepEqual(result.facts, [
      { label: "Patient", value: "MAYA SAMPLE" },
      { label: "Patient ID", value: "SAMPLE-12345" },
      { label: "Clinician", value: "JANE EXAMPLE, PA" },
      { label: "Fax", value: "(555) 010-0101" },
      { label: "Appointment provider", value: "Sample Clinic" },
    ]);
  }
  assert.equal(facts[3].label, "Appointment Provider");
  assert.equal(facts[5].label, "Host");
});

test("medical appointments keep a known clinic without inventing a clinician", () => {
  const result = appointmentDisplayDetails({
    title: "Lab visit", category: "Medical Appointments",
    facts: [{ label: "Host", value: "Sample Lab" }],
  });
  assert.deepEqual(result.facts, [{ label: "Appointment provider", value: "Sample Lab" }]);
});

test("nonmedical appointments and social events retain their original role labels", () => {
  const roles = facts.filter((fact) => ["Host", "Appointment Provider"].includes(fact.label));
  for (const input of [
    { title: "Salon appointment", category: "Appointments" },
    { title: "Community gathering", category: "General Event" },
  ]) {
    assert.deepEqual(appointmentDisplayDetails({ ...input, facts: roles }).facts, roles);
  }
});

test("generic appointment reminders disappear from both copy and fact cards", () => {
  const result = appointmentDisplayDetails({
    title: "ENT appointment", facts: [...facts,
      { label: "Good to Know", value: "Bring your appointment details with you." }],
    detailCopy: "  Bring your appointment details with you.  ",
  });
  assert.equal(result.detailCopy, "");
  assert.equal(result.facts.length, 5);
});

test("printed preparation instructions survive and birthday events keep their facts", () => {
  const result = appointmentDisplayDetails({
    title: "ENT appointment", facts: [],
    detailCopy: "Arrive 15 minutes early. Bring your appointment details with you. Bring your referral.",
  });
  assert.equal(result.detailCopy, "Arrive 15 minutes early. Bring your referral.");
  const birthday = [{ label: "Birthday", value: "May 22" }];
  assert.deepEqual(appointmentDisplayDetails({ title: "Maya's birthday", facts: birthday }).facts, birthday);
});

test("a saved flattened medical transcription cannot replace the appointment cards", () => {
  const transcription = "Sample Clinic Phone: (555) 010-0100 Fax: (555) 010-0101 MAYA SAMPLE DOB: 05/22/2019 Patient ID: SAMPLE-12345 Date Time Appointment 11/02/2026 08:10 AM JANE EXAMPLE, PA";
  const result = appointmentDisplayDetails({
    title: "Maya ENT appointment", category: "Medical Appointments",
    detailCopy: transcription,
    facts: [...facts, { label: "Good to Know", value: transcription }],
  });
  assert.equal(result.detailCopy, "");
  assert.deepEqual(result.facts.map((fact) => fact.label), [
    "Patient", "Patient ID", "Clinician", "Fax", "Appointment provider", "Phone",
  ]);
  assert.equal(result.facts.find((fact) => fact.label === "Phone")?.value, "(555) 010-0100");
  assert.deepEqual(filterRenderedOcrFacts(result.facts, [
    "Maya ENT appointment", "Sample Clinic", result.detailCopy,
  ]), result.facts);
  assert.equal(facts[1].value, "05/22/2019");
});

test("medical record filtering keeps separate preparation instructions", () => {
  for (const separator of ["\n", ". "]) {
    const result = appointmentDisplayDetails({
      title: "ENT appointment", category: "Medical Appointments", facts,
      detailCopy: `MAYA SAMPLE DOB: 05/22/2019 Patient ID: SAMPLE-12345${separator}Arrive 15 minutes early. Bring your referral.`,
    });
    assert.equal(result.detailCopy, "Arrive 15 minutes early. Bring your referral.");
  }
  const result = appointmentDisplayDetails({
    title: "ENT appointment", category: "Medical Appointments", facts,
    detailCopy: "Bring your patient ID and referral. Confirm your date of birth at check-in.",
  });
  assert.equal(result.detailCopy, "Bring your patient ID and referral. Confirm your date of birth at check-in.");
});
