import { createRoot } from "react-dom/client";
import { SharedStudioCardFrame } from "../../../src/components/studio/SharedStudioCardPage";
import EventOwnerTools from "../../../src/components/EventOwnerTools";

const params = new URLSearchParams(window.location.search);
const root = document.getElementById("root");
if (!root) throw new Error("Missing fixture root");
createRoot(root).render(
  params.get("mode") === "workspace" ? <EventOwnerTools
    eventId="qa-card"
    eventTitle="Home Sweet Home"
    eventHref="/card/home-sweet-home"
    initialTab="rsvps"
    numberOfGuests={8}
    eventData={{
      createdVia: "livecard-builder",
      rsvpEnabled: true,
      rsvp: { enabled: true },
      publicEvent: { ownerDefaultSurface: params.has("eventPage") ? "event" : "card" },
      studioCard: {
        imageUrl: "/card.webp",
        invitationData: {
          title: "Home Sweet Home",
          heroTextMode: "image",
          eventDetails: { product: "live_card", rsvpEnabled: true, rsvpName: "Host", rsvpContact: "+15555550123" },
        },
      },
    }}
  /> :
  <SharedStudioCardFrame
    title="Birthday preview"
    canDownload={params.get("mode") === "owner"}
    onClose={params.get("product") === "invite" ? () => {} : undefined}
    imageUrl="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='900'%3E%3Crect width='600' height='900' fill='%23ede9fe'/%3E%3C/svg%3E"
    embeddedPreview={params.get("mode") === "embedded"}
    previewMode={params.get("mode") === "owner"}
    actionsPlacement={params.get("placement") === "above" ? "above" : "overlay"}
    fitToViewport={params.get("product") === "invite"}
    shareUrl={params.get("product") === "invite" ? "http://owner-preview.test/" : undefined}
    invitationData={{
      heroTextMode: "image",
      eventDetails: {
        product: params.get("product") === "invite" ? "digital_flyer" : "live_card",
        category: "Birthday",
        rsvpName: "Host",
        rsvpContact: params.get("contact") === "email" ? "host@example.test" : "+15555550123",
        ...(params.has("published") ? { eventId: "qa-card", rsvpEnabled: true } : {}),
      },
    }}
  />,
);
