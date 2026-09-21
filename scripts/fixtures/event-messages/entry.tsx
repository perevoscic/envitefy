import { createRoot } from "react-dom/client";
import EventMessagesPanel from "../../../src/components/EventMessagesPanel";
import UnsavedProgressProvider from "../../../src/components/UnsavedProgressProvider";

const root = document.getElementById("root");
if (!root) throw new Error("Missing fixture root");
createRoot(root).render(
  <UnsavedProgressProvider>
    <div className="mx-auto max-w-3xl p-3 sm:p-6">
      <EventMessagesPanel eventId="qa-event" eventTitle="Livia is turning 10" />
    </div>
  </UnsavedProgressProvider>,
);
