/** Freeze the selected queue before infrastructure or paid requests start. */
export function selectCampaignQueue({
  scenarios,
  selectedId = null,
  selectedIds = [],
  all = false,
  startAt = null,
  untestedOnly = false,
  attemptedCaseIds = [],
}) {
  if (selectedId && selectedIds.length) throw new Error("Use either --case or --cases, not both");
  if (new Set(selectedIds).size !== selectedIds.length) throw new Error("Duplicate selected case ids");
  const selected = selectedIds.length
    ? selectedIds.map(id => {
        const scenario = scenarios.find(candidate => candidate.id === id);
        if (!scenario) throw new Error(`Unknown selected case: ${id}`);
        return scenario;
      })
    : scenarios.filter((scenario) =>
        selectedId ? scenario.id === selectedId : all || scenario.pilotOrder !== null,
      );
  const startIndex = startAt ? selected.findIndex((scenario) => scenario.id === startAt) : 0;
  if (startIndex < 0) throw new Error(`Unknown starting case: ${startAt}`);
  const candidates = selected.slice(startIndex);
  const attempted = new Set(attemptedCaseIds);
  const skippedAttemptedCaseIds = untestedOnly
    ? candidates.filter((scenario) => attempted.has(scenario.id)).map((scenario) => scenario.id)
    : [];
  const cases = candidates.filter((scenario) => !untestedOnly || !attempted.has(scenario.id));
  return Object.freeze({
    cases: Object.freeze(cases),
    skippedAttemptedCaseIds: Object.freeze(skippedAttemptedCaseIds),
    untestedOnly,
  });
}

/** The durable ledger is authoritative; a refused increase never changes the manifest. */
export function syncManifestBudget(manifest, ledger) {
  if (ledger.budgetUsd < manifest.budgetUsd)
    throw new Error("Manifest budget exceeds the accepted ledger budget");
  if (ledger.budgetUsd === manifest.budgetUsd) return manifest;
  const changes = ledger.budgetChanges.filter(
    (change) => change.budgetNanos / 1e9 > manifest.budgetUsd,
  );
  let previousUsd = manifest.budgetUsd;
  for (const change of changes) {
    if (change.previousBudgetNanos / 1e9 !== previousUsd)
      throw new Error("Ledger authorization history does not match the manifest budget");
    previousUsd = change.budgetNanos / 1e9;
  }
  if (previousUsd !== ledger.budgetUsd)
    throw new Error("Ledger has no authorization for the requested manifest budget");
  return {
    ...manifest,
    budgetUsd: ledger.budgetUsd,
    budgetAuthorizations: [
      ...(manifest.budgetAuthorizations || []),
      ...changes.map((change) => ({
        fromUsd: change.previousBudgetNanos / 1e9,
        toUsd: change.budgetNanos / 1e9,
        at: change.at,
        reason: change.reason,
      })),
    ],
  };
}
