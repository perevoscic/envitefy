const readPath = (value, path) => path.split(".").reduce((item, key) => item?.[key], value);
const text = (value) =>
  typeof value === "string" ? value.normalize("NFC").replace(/\s+/g, " ").trim() : "";

export function validateEvaluationFixtures(fixtures) {
  if (!Array.isArray(fixtures) || !fixtures.length)
    throw new Error("Provide a nonempty fixture array.");
  const seen = new Set();
  for (const fixture of fixtures) {
    if (
      !fixture ||
      typeof fixture.id !== "string" ||
      !/^[a-z0-9_-]{1,100}$/i.test(fixture.id) ||
      seen.has(fixture.id)
    )
      throw new Error("Every fixture needs a unique, safe ID.");
    seen.add(fixture.id);
    if (!["extraction", "creative_plan"].includes(fixture.workload))
      throw new Error(`Invalid workload in ${fixture.id}.`);
    if (
      fixture.workload === "extraction" &&
      typeof fixture.sourceText !== "string" &&
      typeof fixture.imagePath !== "string"
    )
      throw new Error(`Missing source text or imagePath in ${fixture.id}.`);
    if (
      fixture.workload === "creative_plan" &&
      (!fixture.event ||
        !["live_card", "digital_flyer", "printable_flyer", "event_page"].includes(fixture.product))
    )
      throw new Error(`Missing product/event in ${fixture.id}.`);
    if (!Array.isArray(fixture.checks) || !fixture.checks.length)
      throw new Error(`Missing factual checks in ${fixture.id}.`);
    for (const check of fixture.checks) {
      if (
        !check ||
        typeof check.path !== "string" ||
        !/^[a-zA-Z0-9_.]+$/.test(check.path) ||
        !["exact", "contains", "absent"].includes(check.op) ||
        !("value" in check)
      )
        throw new Error(`Invalid factual check in ${fixture.id}.`);
      if (check.op !== "exact" && (typeof check.value !== "string" || !check.value.trim()))
        throw new Error(`Text checks need a nonempty value in ${fixture.id}.`);
    }
  }
  return fixtures;
}

/** Exact fields, required source wording and forbidden additions are graded separately from schema validity. */
export function scoreCreationOutput(fixture, output, schemaValid, completed = true) {
  const checks = fixture.checks.map((check) => {
    const actual = readPath(output, check.path);
    const passed =
      check.op === "exact"
        ? JSON.stringify(actual) === JSON.stringify(check.value)
        : check.op === "contains"
          ? text(actual).includes(text(check.value))
          : !text(actual).includes(text(check.value));
    return { path: check.path, op: check.op, passed: completed && passed };
  });
  return {
    schemaValid: completed && schemaValid,
    checks,
    factualChecksPassed: checks.filter((check) => check.passed).length,
    factualChecksTotal: checks.length,
    passed: completed && schemaValid && checks.every((check) => check.passed),
  };
}

/** Pricebook values are USD per million tokens supplied with the run, never guessed. */
export function estimateCreationCost(usage, price) {
  if (!usage || !price) return null;
  const input = usage.prompt_tokens ?? usage.input_tokens;
  const output = usage.completion_tokens ?? usage.output_tokens;
  const cached =
    usage.prompt_tokens_details?.cached_tokens ?? usage.input_tokens_details?.cached_tokens;
  if (
    ![input, output, cached, price.input, price.output, price.cachedInput].every(
      (value) => typeof value === "number" && Number.isFinite(value) && value >= 0,
    ) ||
    cached > input
  )
    return null;
  // A cache-write usage bucket needs a separate rate; do not misprice it as ordinary input.
  if (JSON.stringify(usage).match(/cache_write|cache_creation/)) return null;
  return (
    ((input - cached) * price.input + cached * price.cachedInput + output * price.output) /
    1_000_000
  );
}

export function summarizeCreationEvaluation(results) {
  const groups = new Map();
  for (const result of results.filter((item) => item.live)) {
    const key = `${result.workload}:${result.model}:${result.promptVersion}`;
    const rows = groups.get(key) || [];
    rows.push(result);
    groups.set(key, rows);
  }
  const percentile = (values, fraction) =>
    values.length
      ? values.toSorted((a, b) => a - b)[Math.max(0, Math.ceil(values.length * fraction) - 1)]
      : null;
  return [...groups.values()].map((rows) => {
    const passed = rows.filter((row) => row.scores?.passed).length;
    const costKnown = rows.every((row) => typeof row.estimatedCostUsd === "number");
    const cost = costKnown ? rows.reduce((sum, row) => sum + row.estimatedCostUsd, 0) : null;
    const checks = rows.reduce((sum, row) => sum + (row.scores?.factualChecksTotal || 0), 0);
    return {
      model: rows[0].model,
      workload: rows[0].workload,
      promptVersion: rows[0].promptVersion,
      attempted: rows.length,
      passed,
      failedRequests: rows.filter((row) => row.errorCode).length,
      schemaPassRate: rows.filter((row) => row.scores?.schemaValid).length / rows.length,
      factualCheckPassRate: checks
        ? rows.reduce((sum, row) => sum + (row.scores?.factualChecksPassed || 0), 0) / checks
        : null,
      p50LatencyMs: percentile(
        rows.map((row) => row.durationMs),
        0.5,
      ),
      p95LatencyMs: percentile(
        rows.map((row) => row.durationMs),
        0.95,
      ),
      estimatedTotalCostUsd: cost,
      estimatedCostPerPassingResultUsd: cost !== null && passed ? cost / passed : null,
    };
  });
}

export function evaluationOptions(args) {
  const value = (key) => args.find((arg) => arg.startsWith(`--${key}=`))?.slice(key.length + 3);
  const integer = (key, fallback, max) => {
    const raw = value(key);
    const number = raw === undefined ? fallback : Number(raw);
    if (!Number.isInteger(number) || number < 1 || number > max)
      throw new Error(`--${key} must be 1–${max}.`);
    return number;
  };
  const models = (
    value("models") || "gpt-5.6-terra,gpt-5.6-luna,gpt-6-luna,gpt-6.1-sol,gpt-6-astra"
  ).split(",");
  if (
    models.some((model) => !/^gpt-[a-zA-Z0-9.-]{1,80}$/.test(model)) ||
    new Set(models).size !== models.length
  )
    throw new Error("Supply unique model IDs with --models.");
  const promptVersions = (value("prompts") || "v2").split(",");
  if (
    promptVersions.some((version) => !["legacy", "v2"].includes(version)) ||
    new Set(promptVersions).size !== promptVersions.length
  )
    throw new Error("--prompts accepts legacy,v2.");
  return {
    live: args.includes("--live"),
    smoke: args.includes("--smoke"),
    includeOutput: args.includes("--include-output"),
    models,
    promptVersions,
    repeats: integer("repeats", 1, 10),
    maxCalls: integer("max-calls", 40, 1000),
    dataset: value("dataset"),
    output: value("output"),
    pricing: value("pricing"),
  };
}
