export const CAMPAIGN_OPERATION_TIMEOUT_MS = 240_000;

/** Bound observer work without misclassifying an interrupted harness as model output.
 * The underlying operation's eventual rejection stays handled after cancellation.
 */
export function withCampaignTimeout(operation, { timeoutMs = CAMPAIGN_OPERATION_TIMEOUT_MS, label = "Campaign operation", signal } = {}) {
  const observed = Promise.resolve(operation);
  return new Promise((resolve, reject) => {
    let settled = false;
    let timer;
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener("abort", cancel);
      callback(value);
    };
    const fail = (message) => {
      const error = new Error(`harness_interaction: ${label} ${message}`);
      error.code = "harness_interaction";
      finish(reject, error);
    };
    const cancel = () => fail(`cancelled${signal?.reason?.message ? `: ${signal.reason.message}` : ""}`);
    observed.then(value => finish(resolve, value), error => finish(reject, error));
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
      fail("requires a positive finite timeout");
      return;
    }
    if (signal?.aborted) {
      cancel();
      return;
    }
    signal?.addEventListener("abort", cancel, { once: true });
    timer = setTimeout(() => fail(`timed out after ${timeoutMs}ms`), timeoutMs);
  });
}
