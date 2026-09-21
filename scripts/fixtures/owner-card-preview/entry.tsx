import { createRoot } from "react-dom/client";
import { SharedStudioCardFrame } from "../../../src/components/studio/SharedStudioCardPage";

const params = new URLSearchParams(window.location.search);
const root = document.getElementById("root");
if (!root) throw new Error("Missing fixture root");
createRoot(root).render(
  <SharedStudioCardFrame
    title="Birthday preview"
    imageUrl="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='900'%3E%3Crect width='600' height='900' fill='%23ede9fe'/%3E%3C/svg%3E"
    embeddedPreview={params.get("mode") === "embedded"}
    previewMode={params.get("mode") === "owner"}
    actionsPlacement={params.get("placement") === "above" ? "above" : "overlay"}
    invitationData={{
      heroTextMode: "image",
      eventDetails: {
        category: "Birthday",
        rsvpName: "Host",
        rsvpContact: params.get("contact") === "email" ? "host@example.test" : "+15555550123",
        ...(params.has("published") ? { eventId: "qa-card", rsvpEnabled: true } : {}),
      },
    }}
  />,
);
