import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const stressDir = path.join(root, ".data", "concierge-stress");

function listRunDirs() {
  return fs
    .readdirSync(stressDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(stressDir, entry.name))
    .filter((dir) => fs.existsSync(path.join(dir, "raw-scenarios.json")))
    .sort();
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const runDirs = listRunDirs();
const summaries = runDirs.map((dir) => ({
  run: path.basename(dir),
  file: path.join(dir, "summary.json"),
  summary: readJson(path.join(dir, "summary.json")),
}));
const scenarios = runDirs.flatMap((dir) =>
  readJson(path.join(dir, "raw-scenarios.json")).map((scenario) => ({
    ...scenario,
    run: path.basename(dir),
  })),
);
const turns = scenarios.flatMap((scenario) =>
  scenario.turns.map((turn) => ({
    ...turn,
    run: scenario.run,
    scenario: scenario.id,
    category: scenario.category,
    product: scenario.product,
  })),
);

function count(items, predicate) {
  return items.filter(predicate).length;
}

function pct(value, total) {
  if (!total) return "0.0%";
  return `${((value / total) * 100).toFixed(1)}%`;
}

function assistantText(turn) {
  return String(turn.assistant || "").replace(/\s+/g, " ").trim();
}

const exactReplies = new Map();
for (const turn of turns) {
  const text = assistantText(turn);
  exactReplies.set(text, (exactReplies.get(text) || 0) + 1);
}
const topReplies = [...exactReplies.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);
const latestRun = summaries.at(-1)?.run;
const latestScenarios = scenarios.filter((scenario) => scenario.run === latestRun);
const latestTurns = turns.filter((turn) => turn.run === latestRun);

const detailsReady = (turn) => /^Details are ready\./.test(String(turn.assistant || ""));
const optionalGift = (turn) => /^Optional: do you have/.test(String(turn.assistant || ""));
const vagueLookLessGeneric = (turn) => /Vibe: look less generic/i.test(String(turn.assistant || ""));
const vagueLocationLater = (turn) =>
  /Vibe: I might change the location later/i.test(String(turn.assistant || ""));
const promptEchoTitle = (turn) => /Event: Create a |Event: I need a /.test(String(turn.assistant || ""));

const lines = [];
lines.push("# Concierge Stress UX Analysis");
lines.push("");
lines.push("This analyzes the saved raw dialogs, not just mechanical pass/fail checks.");
lines.push("");
lines.push("## Run Inventory");
lines.push("");
for (const { run, file, summary } of summaries) {
  lines.push(
    `- ${run}: ${file} - total ${summary.total}, passed ${summary.passed}, failed ${summary.failed}, issues ${JSON.stringify(summary.issueCounts || {})}`,
  );
}
lines.push("");
lines.push("## Where The 100 Dialogs Are");
lines.push("");
lines.push(
  "Every run folder contains `raw-scenarios.json` with every scenario and every turn. `report.md` only prints failed samples, so successful dialogs are intentionally absent from that file. The latest run has 100 scenario objects in its raw JSON.",
);
lines.push("");
lines.push("## Mechanical Pass Is Not UX Pass");
lines.push("");
lines.push(`Across ${scenarios.length} scenarios and ${turns.length} turns:`);
lines.push(
  `- Details-ready boilerplate turns: ${count(turns, detailsReady)} (${pct(count(turns, detailsReady), turns.length)})`,
);
lines.push(`- Optional gift prompt turns: ${count(turns, optionalGift)}`);
lines.push(
  `- Scenarios with repeated "Skip gift link": ${count(scenarios, (scenario) => scenario.turns.filter((turn) => /skip gift link/i.test(turn.user || "")).length > 1)}`,
);
lines.push(`- Literal "look less generic" stored as vibe: ${count(turns, vagueLookLessGeneric)}`);
lines.push(
  `- Literal "I might change the location later" stored as vibe: ${count(turns, vagueLocationLater)}`,
);
lines.push(`- Product prompt echoed as event title: ${count(turns, promptEchoTitle)}`);
lines.push("");
lines.push(`Latest run: ${latestRun}`);
lines.push(`- Latest scenarios: ${latestScenarios.length}`);
lines.push(
  `- Latest details-ready boilerplate turns: ${count(latestTurns, detailsReady)} of ${latestTurns.length} (${pct(count(latestTurns, detailsReady), latestTurns.length)})`,
);
lines.push(`- Latest literal "look less generic" as vibe: ${count(latestTurns, vagueLookLessGeneric)}`);
lines.push(`- Latest product prompt echoed as event title: ${count(latestTurns, promptEchoTitle)}`);
lines.push("");
lines.push("## Most Repeated Assistant Replies");
lines.push("");
for (const [reply, amount] of topReplies) {
  lines.push(`- ${amount}x: ${reply}`);
}
lines.push("");
lines.push("## UX Failure Classes");
lines.push("");
lines.push(
  "- Repetition: once a draft is ready, follow-up turns dump the same field-by-field verification instead of acknowledging the user intent briefly.",
);
lines.push(
  '- Vague creative edits: "make it look less generic" is treated as final visual direction instead of asking for a concrete style direction or offering premium options.',
);
lines.push(
  '- Gift prompt loop: "Skip gift link" can be repeated even when the product does not need gift handling or after the skip has already been handled.',
);
lines.push(
  "- Robotic summaries: replies read like debug output: Product, Event, Date, Time, Location, Vibe. Useful for tests, bad as a premium concierge voice.",
);
lines.push(
  '- Title quality: some drafts preserve launcher text like "Create a Smart Sign-up WhatsApp message" instead of a host-facing event name.',
);
lines.push("");
lines.push("## Example Bad Turns");
lines.push("");
for (const turn of turns
  .filter(
    (item) =>
      vagueLookLessGeneric(item) ||
      vagueLocationLater(item) ||
      promptEchoTitle(item) ||
      optionalGift(item) ||
      detailsReady(item),
  )
  .slice(0, 40)) {
  lines.push(`- ${turn.run} ${turn.scenario} ${turn.category}/${turn.product}`);
  lines.push(`  U: ${turn.user}`);
  lines.push(`  A: ${String(turn.assistant || "").replace(/\n/g, " / ")}`);
}

const outputPath = path.join(stressDir, "ux-analysis.md");
fs.writeFileSync(outputPath, lines.join("\n"));
console.log(outputPath);
