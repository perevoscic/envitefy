import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { SidebarProvider } from "../../src/app/sidebar-context";
import { MainContentWrapper } from "../../src/components/MainContentWrapper";
import MobileNavHeader from "../../src/components/navigation/MobileNavHeader";
import { EVENT_SKIN_CONTENT_TOP_PADDING_CLASS } from "../../src/components/event-skin-layout";
import { registerEventPageColor } from "../../src/lib/event-page-chrome";
import { applyAppearance } from "../../src/lib/appearance";
import EventPreviewViewport from "../../src/components/EventPreviewViewport";

function Fixture() {
  const [color, setColor] = useState<string | null>("#111b3a");
  const [menuOpen, setMenuOpen] = useState(false);
  const preview = new URLSearchParams(location.search).has("preview");
  useEffect(() => {
    applyAppearance(document.documentElement.classList.contains("dark") ? "dark" : "light", false);
  }, []);
  useEffect(() => {
    const registration = registerEventPageColor(document.documentElement, color);
    return () => registration.dispose();
  }, [color]);
  return <>
    {!menuOpen ? <MobileNavHeader visible onOpenNavigation={() => setMenuOpen(true)} onHome={event => event.preventDefault()} menuIcon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>} />
      : <aside style={{ position: "fixed", inset: 0, zIndex: 7000, background: "#251f2d", padding: 24 }}><button onClick={() => setMenuOpen(false)}>Close navigation</button></aside>}
    {preview ? <div style={{ height: "100dvh" }}><EventPreviewViewport title="Saved owner event" preserveNavigation
      initialBackground={{ backgroundColor: "#111b3a", color: "white" }}>
      <main style={{ minHeight: 2600, background: "#111b3a", color: "white" }}><h1>Saved owner event content</h1></main>
    </EventPreviewViewport></div> : <MainContentWrapper isAuthenticated reserveSidebarSpace={false} enableProjectBackground={false}>
      <main className={EVENT_SKIN_CONTENT_TOP_PADDING_CLASS} style={{ minHeight: 2600 }}>
        <div data-testid="hero" style={{ height: 330, background: "linear-gradient(145deg,#146779,#efb56e)", color: "white", padding: 20 }}>Event artwork</div>
        <h1>Event navigation fixture</h1>
        <button onClick={() => setColor("#f6f1e7")}>Light event</button>
        <button onClick={() => setColor("#111b3a")}>Dark event</button>
        <button onClick={() => setColor(null)}>Leave event</button>
        <input aria-label="Unsaved event title" defaultValue="Keep this title" />
      </main>
    </MainContentWrapper>}
  </>;
}

createRoot(document.getElementById("root")!).render(<SidebarProvider><Fixture /></SidebarProvider>);
