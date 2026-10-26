export function useCalendarPreference() {
  const query = new URLSearchParams(window.location.search);
  const connected = (query.get("connected") || "").split(",");
  return {
    provider: query.get("provider") || null,
    signedIn: true,
    canRemember: (provider: string) => connected.includes(provider),
  };
}
