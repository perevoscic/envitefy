import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { writeActivitySummary } from "./lib/maestro-activity-report.mjs";
import { ROOT } from "./lib/maestro-core.mjs";
import { writeReports } from "./lib/maestro-report.mjs";

test("activity reports separate confirmed mismatches, retain failed attempts and protect secrets/HTML", async () => {
  const root = path.resolve(ROOT, "output/maestro/report-tests");
  await mkdir(root, { recursive: true });
  const dir = await mkdtemp(path.join(root, "report-"));
  try {
    await writeFile(
      path.join(dir, "confirmed-findings.json"),
      JSON.stringify([
        {
          id: "time-shift",
          status: "confirmed_observed_mismatch",
          expected: { start: "13:00" },
          actual: { start: "18:00" },
          cause: "unknown",
        },
      ]),
    );
    const report = await writeActivitySummary(
      dir,
      {
        runId: "activity-QA01-1",
        account: "QA01",
        results: [
          { name: "scan", status: "passed", artifactDir: "scan" },
          {
            name: "<script>bad</script>",
            status: "failed",
            message: "private-test-password",
            artifactDir: "attempt",
          },
        ],
      },
      ["private-test-password"],
    );
    assert.deepEqual(report.summary, {
      passedSteps: 1,
      failedOrIncompleteSteps: 1,
      confirmedAppFindings: 1,
    });
    const html = await readFile(path.join(dir, "activity-summary.html"), "utf8");
    assert.ok(html.includes("&lt;script&gt;bad&lt;/script&gt;"));
    assert.ok(!html.includes("private-test-password"));
    assert.ok(html.includes("[REDACTED]"));
    assert.ok(html.includes("unknown"));
    const generic = await writeReports(dir, [], { runId: "activity-QA01-1" });
    assert.equal(generic.summary.confirmedDefects, 1);
    assert.equal(generic.findings[0].classification, "confirmed_app_defect");
    assert.ok((await readFile(path.join(dir, "bugs.md"), "utf8")).includes("Cause: unknown"));
  } finally {
    assert.ok(path.resolve(dir).startsWith(root + path.sep));
    await rm(dir, { recursive: true, force: true });
  }
});
