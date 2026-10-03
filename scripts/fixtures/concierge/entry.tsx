import { useState } from "react";
import { createRoot } from "react-dom/client";
import ScrollAwareBottomNav from "../../../src/components/navigation/ScrollAwareBottomNav";
import ConciergeSheet from "../../../src/components/navigation/ConciergeSheet";

function Fixture() {
  const [open, setOpen] = useState(false);
  const [signup, setSignup] = useState(false);
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
          <p>Scroll to discover Envitefy Concierge.</p>
          {signup && <p role="status">Sign up selected</p>}
        </section>
      </main>
      <ScrollAwareBottomNav onConciergeSelect={() => setOpen(true)} />
      <ConciergeSheet open={open} onOpenChange={setOpen} onSignupSelect={() => setSignup(true)} />
    </>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("Missing Concierge fixture root");
createRoot(root).render(<Fixture />);
