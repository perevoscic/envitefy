type GuestChatHistoryEntry = { role: "user" | "assistant"; text: string };

export type GuestChatClientAnswer = {
  answer: string;
  signupSuggested?: boolean;
  handoffSuggested?: boolean;
};

type GuestChatClientOptions = {
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
  firstResponseTimeoutMs?: number;
  inactivityTimeoutMs?: number;
  totalTimeoutMs?: number;
};

const UNAVAILABLE = "Envitefy Concierge is temporarily unavailable. Please try again.";
const TIMED_OUT = "Envitefy Concierge took too long to respond. Please try again.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function responseError(value: unknown) {
  return new Error(isRecord(value) && typeof value.error === "string" ? value.error : UNAVAILABLE);
}

function parseAnswer(value: unknown, streamed = ""): GuestChatClientAnswer {
  if (!isRecord(value) || value.ok !== true) throw responseError(value);
  const answer = (typeof value.answer === "string" ? value.answer : streamed).trim();
  if (!answer) throw new Error(UNAVAILABLE);
  return {
    answer,
    ...(typeof value.signupSuggested === "boolean" ? { signupSuggested: value.signupSuggested } : {}),
    ...(typeof value.handoffSuggested === "boolean" ? { handoffSuggested: value.handoffSuggested } : {}),
  };
}

/** Receive useful text promptly and bound every wait, including stalled response bodies. */
export async function requestGuestChatAnswer(
  params: {
    message: string;
    history: readonly GuestChatHistoryEntry[];
    onDelta?: (text: string) => void;
  },
  options: GuestChatClientOptions = {},
): Promise<GuestChatClientAnswer> {
  if (options.signal?.aborted) throw options.signal.reason || new Error("Guest chat request cancelled.");

  const controller = new AbortController();
  let rejectInterrupted: (error: unknown) => void = () => {};
  const interrupted = new Promise<never>((_, reject) => { rejectInterrupted = reject; });
  // The caller's signal can fire between awaits. Always handle the shared rejection.
  void interrupted.catch(() => {});
  const stop = (reason: unknown) => {
    if (controller.signal.aborted) return;
    controller.abort(reason);
    rejectInterrupted(reason);
  };
  const onAbort = () => stop(options.signal?.reason || new Error("Guest chat request cancelled."));
  options.signal?.addEventListener("abort", onAbort, { once: true });
  const waitFor = <T,>(pending: Promise<T>) => Promise.race([pending, interrupted]);
  const firstTimer = setTimeout(() => stop(new Error(TIMED_OUT)), options.firstResponseTimeoutMs ?? 6000);
  const totalTimer = setTimeout(() => stop(new Error(TIMED_OUT)), options.totalTimeoutMs ?? 12_000);
  let idleTimer: ReturnType<typeof setTimeout> | undefined;
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  const receivedText = () => {
    clearTimeout(firstTimer);
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => stop(new Error(TIMED_OUT)), options.inactivityTimeoutMs ?? 4000);
  };

  try {
    const response = await waitFor((options.fetchImpl ?? fetch)("/api/guest-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      signal: controller.signal,
      body: JSON.stringify({ message: params.message, history: params.history, stream: true }),
    }));

    if (!response.ok || !response.headers.get("content-type")?.includes("ndjson")) {
      const data: unknown = await waitFor(response.json()).catch((error: unknown) => {
        if (controller.signal.aborted) throw controller.signal.reason || error;
        throw new Error(UNAVAILABLE);
      });
      if (!response.ok) throw responseError(data);
      return parseAnswer(data);
    }
    if (!response.body) throw new Error(UNAVAILABLE);

    reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffered = "";
    let streamed = "";
    const readEvent = (line: string): GuestChatClientAnswer | null => {
      if (!line.trim()) return null;
      let event: unknown;
      try { event = JSON.parse(line); } catch { throw new Error(UNAVAILABLE); }
      if (!isRecord(event) || event.ok === false || event.type === "error") throw responseError(event);
      if (event.type === "done") return parseAnswer(event, streamed);
      if (event.type !== "delta" || typeof event.text !== "string") throw new Error(UNAVAILABLE);
      if (event.text) {
        streamed += event.text;
        receivedText();
        params.onDelta?.(event.text);
      }
      return null;
    };

    while (true) {
      const { value, done } = await waitFor(reader.read());
      buffered += decoder.decode(value, { stream: !done });
      let newline = buffered.indexOf("\n");
      while (newline !== -1) {
        const line = buffered.slice(0, newline);
        buffered = buffered.slice(newline + 1);
        const answer = readEvent(line);
        if (answer) return answer;
        newline = buffered.indexOf("\n");
      }
      if (done) {
        // A valid final event need not end with a newline.
        const answer = readEvent(buffered);
        if (answer) return answer;
        throw new Error(UNAVAILABLE);
      }
    }
  } finally {
    clearTimeout(firstTimer);
    clearTimeout(totalTimer);
    clearTimeout(idleTimer);
    options.signal?.removeEventListener("abort", onAbort);
    // Cancellation must not extend a request's deadline if a transport ignores it.
    if (reader) void reader.cancel().catch(() => {});
  }
}
