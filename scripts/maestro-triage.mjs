import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ARTIFACT_ROOT } from "./lib/maestro-core.mjs";

const [id, classification, severity, ...note] = process.argv.slice(2);
const classifications = [
  "confirmed_defect",
  "suspected_defect",
  "incomplete_check",
  "test_script_problem",
  "environment_failure",
  "environment_or_test_failure",
];
const severities = ["critical", "high", "medium", "low", "untriaged"];
if (
  !id ||
  !classifications.includes(classification) ||
  !severities.includes(severity) ||
  !note.length
) {
  console.error(
    'Usage: npm run maestro:triage -- F-<id> <classification> <severity> "Evidence and reasoning"',
  );
  process.exit(1);
}
const file = path.join(ARTIFACT_ROOT, "findings.json");
const registry = JSON.parse(await readFile(file, "utf8"));
const finding = registry.findings.find((item) => item.id === id);
if (!finding) throw new Error(`Finding ${id} does not exist in the local registry.`);
finding.classification = classification;
finding.severity = severity;
finding.status = classification === "confirmed_defect" ? "open" : "reviewed";
finding.triage = { at: new Date().toISOString(), note: note.join(" ") };
await writeFile(file, JSON.stringify(registry, null, 2));
console.log(
  `${id}: ${classification}, ${severity}. Local registry updated; no external issue was created.`,
);
