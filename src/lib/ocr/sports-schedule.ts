import { normalizeScanSchedule, type ScanSchedule } from "../scan-schedule.ts";
import { openAiChatCompatibilityParams } from "../openai-chat-params.ts";
import { resolveOcrModel } from "./constants.ts";

export function hasSportsScheduleText(source: string): boolean {
  return (
    /\b(schedule|fixtures|timetable)\b/i.test(source) &&
    /\b(practice|training|team|games?|matches|football|soccer|basketball|baseball|softball|volleyball|hockey|gymnastics|lacrosse|rugby|tennis)\b/i.test(
      source,
    )
  );
}

export function sportsSchedulePrompt(timezone: string): string {
  return [
    "Extract EVERY row of this sports practice/game schedule as JSON. Return {title, timeframe, timezone, items:[]}.",
    "Each item has type (practice or game), title, group, day (MO/TU/WE/TH/FR/SA/SU or null), date (YYYY-MM-DD or null), startTime, endTime, locationText, opponent, homeAway (home/away/null), notes, status.",
    "Preserve every group, weekday, game, opponent, location, season/date range, cancellation and note. Mixed schedules include both practices and games. Each recurring weekday is its own row. OFF/closed cells are not sessions; do not merge or shift cells.",
    "Use 24-hour times only when the source establishes AM/PM. Otherwise append (AM/PM unspecified) to the printed time text. Missing values are null; never invent a date, year, next occurrence, end time, venue, opponent, or recurrence end. Preserve partial dates in notes when a year is missing. Do not turn a weekly practice into a guessed dated event. Keep the printed season/date range in timeframe.",
    "Return an empty items array only if there are no schedule rows. JSON only. Timezone fallback: " +
      timezone,
  ].join("\n");
}

export async function extractSportsSchedule(
  source: string,
  timezone: string,
  timeoutMs: number,
): Promise<ScanSchedule | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || timeoutMs < 3000) return null;
  const model = resolveOcrModel();
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + apiKey },
    signal: AbortSignal.timeout(timeoutMs),
    body: JSON.stringify({
      model,
      ...openAiChatCompatibilityParams(model, { temperature: 0 }),
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: sportsSchedulePrompt(timezone) },
        { role: "user", content: source },
      ],
    }),
  });
  if (!response.ok) throw new Error("Schedule analysis failed. Please retry the upload.");
  const result = (await response.json()) as {
    choices?: Array<{ finish_reason?: string; message?: { content?: string } }>;
  };
  const choice = result.choices?.[0];
  if (choice?.finish_reason === "length")
    throw new Error("The schedule is too long to read completely. Upload it in smaller sections.");
  const content = choice?.message?.content;
  if (!content) return null;
  const parsed: unknown = JSON.parse(content);
  return normalizeScanSchedule(parsed);
}
