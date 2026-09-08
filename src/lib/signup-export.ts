import type { SignupForm } from "@/types/signup";

/** Quote all cells and neutralize spreadsheet formulas in guest-provided text. */
export function signupResponsesCsv(form: SignupForm): string {
  const cell = (value: string | number | null | undefined) => {
    const text = String(value ?? "");
    return `"${(/^[\s]*[=+@-]/.test(text) ? `'${text}` : text).replace(/"/g, '""')}"`;
  };
  const rows = [
    [
      "Name",
      "Status",
      "Email",
      "Phone",
      "Guests",
      "Selections",
      "Note",
      ...form.questions.map((question) => question.prompt),
    ],
  ];
  for (const response of form.responses) {
    const selections = response.slots
      .map((selection) => {
        const section = form.sections.find((item) => item.id === selection.sectionId);
        const slot = section?.slots.find((item) => item.id === selection.slotId);
        return `${section?.title || "Section"}: ${slot?.label || "Removed slot"} ×${selection.quantity}`;
      })
      .join("; ");
    rows.push([
      response.name,
      response.status,
      response.email || "",
      response.phone || "",
      String(response.guests || 0),
      selections,
      response.note || "",
      ...form.questions.map(
        (question) =>
          response.answers?.find((answer) => answer.questionId === question.id)?.value || "",
      ),
    ]);
  }
  return `\ufeff${rows.map((row) => row.map(cell).join(",")).join("\r\n")}\r\n`;
}
