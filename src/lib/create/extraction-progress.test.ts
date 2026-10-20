import { expect, test } from "bun:test";
import { readCreateExtractionResponse } from "./extraction-progress";

const result = { classification: { category: "sports", sport: "gymnastics", confidence: "high", alternatives: [] }, sourceText: "Championship meet", discoveryEventId: "stored-meet" };
function streamed(chunks: string[]) {
  const encoder = new TextEncoder();
  return new Response(new ReadableStream({ start(controller) { for (const chunk of chunks) controller.enqueue(encoder.encode(chunk)); controller.close(); } }), { headers: { "content-type": "application/x-ndjson" } });
}

test("server stages appear before the result even across split response chunks", async () => {
  const stages: string[] = [];
  const response = streamed(['{"stage":"read', 'ing"}\n{"stage":"storing_source"}\n', JSON.stringify({ result })]);
  expect(await readCreateExtractionResponse(response, stage => stages.push(stage))).toEqual(result);
  expect(stages).toEqual(["reading", "storing_source"]);
});

test("failed or interrupted streams never report a completed import", async () => {
  await expect(readCreateExtractionResponse(streamed(['{"stage":"reading"}\n{"error":"Your source is kept; please retry."}\n']), () => {})).rejects.toThrow("Your source is kept");
  await expect(readCreateExtractionResponse(streamed(['{"stage":"reading"}\n']), () => {})).rejects.toThrow("Retry to resume");
  await expect(readCreateExtractionResponse(streamed(['{"stage":"reading"}\n{"result":']), () => {})).rejects.toThrow("Retry to resume");
});

test("legacy JSON responses and actionable HTTP failures remain supported", async () => {
  expect(await readCreateExtractionResponse(Response.json(result), () => {})).toEqual(result);
  await expect(readCreateExtractionResponse(Response.json({ error: "Request access" }, { status: 403 }), () => {})).rejects.toThrow("Request access");
});
