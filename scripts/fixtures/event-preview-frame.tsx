import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import EventPreviewViewport from "../../src/components/EventPreviewViewport";
import { applyAppearance } from "../../src/lib/appearance";
import { Eye, Pencil, Share2, UsersRound, Link2, Trash2 } from "lucide-react";
import toolbarStyles from "../../src/components/event-preview-toolbar.module.css";

applyAppearance(new URLSearchParams(location.search).has("dark") ? "dark" : "light", false);

function Fixture() {
  const [closed, setClosed] = useState(false);
  const [lastAction, setLastAction] = useState("");
  const owner = new URLSearchParams(location.search).has("owner");
  const remote = new URLSearchParams(location.search).has("remote");
  return closed ? <output>Preview closed</output> : <div style={{ height: "100dvh" }}>
    <EventPreviewViewport
      title="Harbor Invitational"
      initialDevice={new URLSearchParams(location.search).has("desktop") ? "desktop" : undefined}
      preserveNavigation={owner}
      src={remote ? "/event-fixture" : undefined}
      onClose={owner ? undefined : () => setClosed(true)}
      actions={owner ? <div role="group" aria-label="Event actions" className="flex flex-col lg:flex-row">
        {([
          ["Preview event", "Preview", Eye], ["Edit event", "Edit", Pencil], ["Share event", "Share", Share2],
          ["Manage access", "Manage access", UsersRound], ["Custom URL", "Custom URL", Link2], ["Delete event", "Delete", Trash2],
        ] as const).map(([label, text, Icon]) => <button key={label} type="button" aria-label={label} className={`${toolbarStyles.control} ${toolbarStyles.ownerControl} inline-flex`} onClick={() => setLastAction(label)}>
          <Icon size={21} aria-hidden="true" /><span>{text}</span>
        </button>)}
        <output data-preview-action className="sr-only">{lastAction}</output>
      </div> : undefined}
    >
      <article style={{ minHeight: "100vh", background: "#111b3a", color: "white", padding: 24 }}>
        <div style={{ height: 180, borderRadius: 12, background: "linear-gradient(145deg,#646baf,#db85ab 55%,#d0b98e)" }} />
        <p style={{ marginTop: 24, letterSpacing: 3, fontSize: 12 }}>GYMNASTICS MEET</p>
        <h1 style={{ font: "48px/1.1 Georgia,serif", margin: "20px 0" }}>Harbor Invitational</h1>
        <p>January 15–17, 2027</p>
        <label>Guest name <input aria-label="Guest name" style={{ color: "#111b3a", background: "white" }} /></label>
        <div style={{ height: 1000, paddingTop: 40 }}><h2>Meet details</h2><p>The full event scrolls inside the device screen.</p></div>
        <button type="button" onClick={(event) => { event.currentTarget.textContent = "Response retained"; }}>End of event</button>
      </article>
    </EventPreviewViewport>
  </div>;
}

if (new URLSearchParams(location.search).has("serverMarkup")) {
  // Exercise server HTML without hydrating or measuring a viewport afterward.
  document.getElementById("root")!.innerHTML = renderToStaticMarkup(<Fixture />);
} else {
  createRoot(document.getElementById("root")!).render(<Fixture />);
}
