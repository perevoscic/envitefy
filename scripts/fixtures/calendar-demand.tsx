import { createRoot } from "react-dom/client";
import { SessionContext } from "next-auth/react";
import CalendarAction from "../../src/components/CalendarAction";

const links = {
  google: "https://calendar.google.com/calendar/render?action=TEMPLATE&text=Meet",
  outlook: "https://outlook.live.com/calendar/0/deeplink/compose?subject=Meet",
  appleInline: "/api/ics?event=meet&disposition=inline",
};

createRoot(document.getElementById("root")!).render(
  <SessionContext.Provider value={{
    data: { user: { email: "calendar-demand@example.test" }, expires: "2099-01-01" },
    status: "authenticated",
    update: async () => null,
  }}>
    <CalendarAction links={links} />
    <CalendarAction links={links} />
  </SessionContext.Provider>,
);
