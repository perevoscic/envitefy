import { useState } from "react";
import { createRoot } from "react-dom/client";
import SignupHostDashboard from "../../src/components/smart-signup-form/SignupHostDashboard";
import type { SignupForm, SignupResponse } from "../../src/types/signup";

const responses: SignupResponse[] = [
  { id: "alex", name: "Alex Justus", email: "alex@example.test", status: "confirmed", createdAt: "2026-10-05T21:30:00Z", updatedAt: "2026-10-05T21:30:00Z", note: "I can bring a cooler.", slots: [{ sectionId: "food", slotId: "dessert", quantity: 2 }], answers: [{ questionId: "allergy", value: "No nuts, please" }] },
  { id: "lauren", name: "Lauren", email: "lauren@example.test", status: "confirmed", createdAt: "2026-10-05T22:16:00Z", updatedAt: "2026-10-05T22:16:00Z", slots: [{ sectionId: "food", slotId: "dessert", quantity: 1 }, { sectionId: "food", slotId: "drinks", quantity: 2 }] },
  { id: "pat", name: "Pat Waitlist", phone: "8505550123", status: "waitlisted", createdAt: "2026-10-05T23:00:00Z", updatedAt: "2026-10-05T23:00:00Z", slots: [{ sectionId: "food", slotId: "dessert", quantity: 1 }] },
  { id: "past", name: "Past signup", status: "cancelled", createdAt: "2026-10-05T20:00:00Z", updatedAt: "2026-10-05T22:00:00Z", slots: [{ sectionId: "food", slotId: "drinks", quantity: 1 }] },
];
const initialForm: SignupForm = {
  version: 1, title: "Fall picnic", enabled: true, timezone: "America/Chicago",
  sections: [{ id: "food", title: "Food", unitLabel: "items", slots: [{ id: "dessert", label: "Pumpkin desserts", capacity: 4, startTime: "12:00", endTime: "13:00" }, { id: "drinks", label: "Small juice boxes", capacity: 6 }] }],
  questions: [{ id: "allergy", prompt: "Allergies?" }], responses,
  settings: { allowMultipleSlotsPerPerson: true, maxGuestsPerSignup: 1, waitlistEnabled: true, lockWhenFull: true, collectPhone: false, collectEmail: true, showRemainingSpots: true, autoRemindersHoursBefore: [] },
};
function App() {
  const [form, setForm] = useState(initialForm);
  const actions: string[] = (window as any).signupActions ||= [];
  return <main style={{ maxWidth: 1100, margin: "auto", padding: 16 }}>
    <SignupHostDashboard eventId="qa-signup" form={form} loading={false} refreshing={false} removingResponseId={null} canEdit={form.enabled}
      onEdit={(response) => actions.push(`edit:${response.id}`)}
      onRemove={(id) => { if (confirm("Are you sure you want to remove this sign-up?")) { actions.push(`remove:${id}`); setForm({ ...form, responses: form.responses.map((response) => response.id === id ? { ...response, status: "cancelled" } : response) }); } }}
      onExport={() => actions.push("export")}
      onSetOpen={() => { actions.push("set-open"); setForm({ ...form, enabled: !form.enabled }); }}
      onRefresh={() => actions.push("refresh")} />
  </main>;
}
createRoot(document.getElementById("root")!).render(<App />);
