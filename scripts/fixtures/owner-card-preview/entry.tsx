import { applyAppearance } from "../../../src/lib/appearance";
import UnsavedProgressProvider from "../../../src/components/UnsavedProgressProvider";
import { createRoot } from "react-dom/client";
import { SharedStudioCardFrame } from "../../../src/components/studio/SharedStudioCardPage";
import EventOwnerTools from "../../../src/components/EventOwnerTools";

const params = new URLSearchParams(window.location.search);
Object.assign(window, { setOwnerAppearance: (dark: boolean) => applyAppearance(dark ? "dark" : "light", dark) });
if (params.has("dark")) applyAppearance("dark", true);
const root = document.getElementById("root");
if (!root) throw new Error("Missing fixture root");
createRoot(root).render(
  <UnsavedProgressProvider>{  params.get("mode") === "workspace" ? <EventOwnerTools
    eventId="qa-card"
    eventTitle="Home Sweet Home"
    eventHref="/card/home-sweet-home"
    initialTab={params.get("tab") === "messages" ? "messages" : params.get("tab") === "design" ? "design" : params.get("tab") === "dashboard" ? "dashboard" : "rsvps"}
    numberOfGuests={params.has("unknownTarget") ? 0 : 8}
    eventData={{
      status: "published",
      eventDate: params.has("past") ? "2020-01-01" : "2099-01-01",
      date: params.has("past") ? "2020-01-01" : "2099-01-01",
      startTime: "18:30", venue: "The Garden Terrace", location: "123 Garden Lane",
      overview: "An evening of good food, warm conversation and a little celebration. We can’t wait to see you.",
      createdVia: "livecard-builder",
      rsvpEnabled: !params.has("rsvpOff"),
      rsvp: { enabled: !params.has("rsvpOff") },
      publicEvent: { ownerDefaultSurface: params.has("eventPage") ? "event" : "card" },
      studioCard: {
        imageUrl: "/card.webp",
        invitationData: {
          ...(params.has("shared") ? { sharedDesign: { backgroundUrl: "/card.webp", version: 1, font: "classic", ink: "#ffffff", accent: "#e9d5ff", surface: "#201a30" } } : {}),
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
        ...(params.has("rsvpDisabled") ? { rsvpEnabled: false, actionVisibility: { rsvp: true }, rsvpUrl: "/event/qa-card#event-rsvp" } : {}),
      },
    }}
  />}</UnsavedProgressProvider>,
);
