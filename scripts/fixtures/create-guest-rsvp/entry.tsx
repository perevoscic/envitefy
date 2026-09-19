import { createRoot } from "react-dom/client";
import EventRsvpPrompt from "../../../src/components/EventRsvpPrompt";
const previewMode = new URL(window.location.href).searchParams.get("preview") === "1";
const root = document.getElementById("root");
if (!root) throw new Error("Missing fixture root");
createRoot(root).render(<EventRsvpPrompt eventId="qa-rsvp" eventTitle="September 23 Reveal" eventCategory="Gender Reveal" rsvpEmail="host@example.test" allowDirectRsvp previewMode={previewMode} />);
