type CardEditRequest = {
  action: "preview" | "save";
  fields: Record<string, string>;
  imageDataUrl?: string;
};

function recoveryMessage(action: CardEditRequest["action"]): string {
  return action === "preview"
    ? "The card preview connection was interrupted. Your changes are still here. Please try Preview again."
    : "The save connection was interrupted. Your preview is still here. Please try Save again.";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export async function requestCardEdit(
  eventId: string,
  request: CardEditRequest,
): Promise<Record<string, unknown>> {
  let response: Response;
  try {
    response = await fetch(`/api/events/${encodeURIComponent(eventId)}/card/edit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(request),
    });
  } catch {
    throw new Error(recoveryMessage(request.action));
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    if (response.status === 401) throw new Error("Please sign in again to edit this card.");
    if (response.status === 413) {
      throw new Error("The card image is too large to save. Please generate a new Preview and try again.");
    }
    throw new Error(recoveryMessage(request.action));
  }
  if (!isRecord(payload)) throw new Error(recoveryMessage(request.action));
  // A streaming response has already sent HTTP 200 before generation can fail.
  if (!response.ok || payload.ok !== true) {
    const message = typeof payload.error === "string" ? payload.error.trim() : "";
    if (!message || /failed to fetch|fetch failed|load failed|networkerror/i.test(message)) {
      throw new Error(recoveryMessage(request.action));
    }
    if (response.status === 401) throw new Error("Please sign in again to edit this card.");
    throw new Error(message);
  }
  return payload;
}
