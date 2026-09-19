import { CAMPAIGN_OPERATION_TIMEOUT_MS, withCampaignTimeout } from "./create-campaign-timeout.mjs";

const capturedPaths = new Set(["/api/creation/intake", "/api/creation/intake/stream", "/api/studio/generate", "/api/creation/draft"]);

/** Chromium's default inspector body cache can evict streamed image JSON. Capture
 * from the same dedicated Network session whose large buffers we configure.
 */
export async function createCampaignResponseCapture(context, page, { timeoutMs = CAMPAIGN_OPERATION_TIMEOUT_MS } = {}) {
  const session = await withCampaignTimeout(context.newCDPSession(page), { timeoutMs, label: "CDP session creation" });
  const controller = new AbortController();
  const cancelBodies = () => controller.abort(new Error("Campaign response capture closed"));
  session.on("close", cancelBodies);
  page.on("close", cancelBodies);
  let closePromise;
  const requests = new Map();
  const ordered = [];
  session.on("Network.requestWillBeSent", event => {
    if (!capturedPaths.has(new URL(event.request.url).pathname) || event.request.method === "GET") return;
    let resolveBody, rejectBody;
    const body = withCampaignTimeout(new Promise((resolve, reject) => { resolveBody = resolve; rejectBody = reject; }), { timeoutMs, signal: controller.signal, label: `Response body ${new URL(event.request.url).pathname}` });
    // A cancelled request may never reach a consumer; keep its rejection handled.
    void body.catch(() => {});
    const item = { id: event.requestId, url: event.request.url, method: event.request.method, body, resolveBody, rejectBody };
    requests.set(event.requestId, item);
    ordered.push(item);
  });
  session.on("Network.loadingFinished", event => {
    const item = requests.get(event.requestId);
    if (!item) return;
    void session.send("Network.getResponseBody", { requestId: event.requestId }).then(response => {
      item.resolveBody(response.base64Encoded ? Buffer.from(response.body, "base64").toString("utf8") : response.body);
    }).catch(item.rejectBody);
  });
  session.on("Network.loadingFailed", event => requests.get(event.requestId)?.rejectBody(new Error(`Campaign response interrupted: ${event.errorText}`)));
  await withCampaignTimeout(session.send("Network.enable", { maxTotalBufferSize: 256 * 1024 * 1024, maxResourceBufferSize: 128 * 1024 * 1024, maxPostDataSize: 1024 * 1024 }), { timeoutMs, signal: controller.signal, label: "CDP Network.enable" });
  return {
    async text(response) {
      // Use the matching latest request: the journey intentionally serializes
      // creation calls, so same-URL requests never overlap within one case.
      let item;
      for (let index = 0; index < 20; index++) {
        item = ordered.findLast(entry => entry.url === response.url() && entry.method === response.request().method());
        if (item) break;
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      return item ? item.body : withCampaignTimeout(response.text(), { timeoutMs, signal: controller.signal, label: `Fallback response body ${new URL(response.url()).pathname}` });
    },
    close() {
      // Reject pending bodies before awaiting detach: detach itself may fail or
      // stall after a dev-server reload. Repeated cleanup shares one operation.
      cancelBodies();
      page.off("close", cancelBodies);
      closePromise ||= withCampaignTimeout(session.detach(), { timeoutMs: Math.min(timeoutMs, 10_000), label: "CDP session detach" });
      return closePromise;
    },
  };
}
