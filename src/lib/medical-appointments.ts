export const MEDICAL_APPOINTMENTS = "Medical Appointments";

export function isMedicalAppointmentCategory(category: string | null | undefined): boolean {
  return /^(?:doctor|dr\.?|medical|dental)[\s_-]+appointments?$/i.test((category || "").trim());
}

export function normalizeMedicalAppointmentCategory(category: string | null): string | null {
  return isMedicalAppointmentCategory(category) ? MEDICAL_APPOINTMENTS : category;
}
