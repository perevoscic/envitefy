import { createRoot } from "react-dom/client";
import EventAccessDialog from "../../../src/components/EventAccessDialog";
import CoHostInvitation from "../../../src/app/cohost-invite/CoHostInvitation";
import EventOwnerView from "../../../src/components/EventOwnerView";
const isOwner = new URLSearchParams(location.search).get("role") === "owner";
createRoot(document.getElementById("root")!).render(location.pathname === "/cohost-invite"
  ? <CoHostInvitation />
  : location.pathname === "/event/qa-event" ? <EventOwnerView
    eventId="qa-event" title="Atlanta Centennial Classic"
    publicHref="/event/qa-event" editHref="/event/gymnastics/customize?edit=qa-event"
    canDelete={isOwner} canManageAccess={isOwner} isCoHost={!isOwner}
    backgroundColor="#f5fafc"
  />
  : <main className="p-6"><EventAccessDialog eventId="qa-event" eventTitle="Garden party" /></main>);
