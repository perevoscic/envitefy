import { useState } from "react";
export function useCalendarPreference() {
  const query = new URLSearchParams(window.location.search);
  const connected = (query.get("connected") || "").split(",");
  const [provider, setProvider] = useState(query.get("provider") || null);
  return {
    provider,
    signedIn: true,
    canRemember: (provider: string) => connected.includes(provider),
    remember: async (choice: string) => {
      if (query.has("failDefault")) return false;
      (window as any).__rememberedCalendar = choice;
      setProvider(choice);
      return true;
    },
  };
}
