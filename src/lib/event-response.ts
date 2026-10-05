/** Keep platform error pages out of event editor messages. */
export async function readEventResponse(response: Response): Promise<any> {
  try {
    const result = await response.json();
    if (result && typeof result === "object" && !Array.isArray(result)) return result;
  } catch {
    // Hosting failures can return text or HTML instead of the application's JSON.
  }
  throw new Error(
    `The server could not confirm this request (${response.status}). Your edits are still here. Please retry; if it keeps failing, reopen the latest event before saving.`,
  );
}
