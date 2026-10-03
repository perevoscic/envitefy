import { createRoot } from "react-dom/client";
import EventAccessDialog from "../../../src/components/EventAccessDialog";
import CoHostInvitation from "../../../src/app/cohost-invite/CoHostInvitation";
createRoot(document.getElementById("root")!).render(location.pathname === "/cohost-invite"
  ? <CoHostInvitation />
  : <main className="p-6"><EventAccessDialog eventId="qa-event" eventTitle="Garden party" /></main>);
