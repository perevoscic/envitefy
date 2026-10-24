import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import GuestChatWidget from "../../../src/components/guest-chat/GuestChatWidget";
import ConciergeLauncher from "../../../src/components/navigation/ConciergeLauncher";
import ConciergeSheet from "../../../src/components/navigation/ConciergeSheet";

function Fixture() {
  const [open, setOpen] = useState(false);
  const [signup, setSignup] = useState(false);
  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener("concierge-fixture-close", close);
    return () => window.removeEventListener("concierge-fixture-close", close);
  }, []);
  const widget = new URLSearchParams(window.location.search).has("widget");
  const hasHero = !new URLSearchParams(window.location.search).has("noHero");
  return (
    <>
      <main>
        {hasHero && (
          <section
            id="landing-hero"
            style={{ height: "100vh", padding: "3rem", background: "#f5f0e6" }}
          >
            <h1>Envitefy hero</h1>
          </section>
        )}
        <section
          id="templates"
          style={{ minHeight: "2400px", padding: "3rem", background: "#fffaf7" }}
        >
          <h2>Event templates</h2>
          <p>Envitefy Concierge is available throughout the page.</p>
          <button type="button" style={{ minHeight: 44, padding: "0.5rem 0.75rem" }}>
            Outside page control
          </button>
          {signup && <p role="status">Sign up selected</p>}
        </section>
      </main>
      {widget ? <GuestChatWidget /> : <>
        <ConciergeLauncher open={open} onOpen={() => setOpen((value) => !value)} />
        <ConciergeSheet open={open} onOpenChange={setOpen} onSignupSelect={() => setSignup(true)} />
      </>}
      <button type="button" style={{ minHeight: 44, padding: "0.5rem 0.75rem" }}>
        Following page control
      </button>
    </>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("Missing Concierge fixture root");
createRoot(root).render(<Fixture />);
