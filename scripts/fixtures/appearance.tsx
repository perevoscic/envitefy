import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
import ThemeProvider, { useTheme } from "../../src/components/AppearanceProvider";
import AppearanceSelector from "../../src/components/AppearanceSelector";
import ThemeColorSync from "../../src/components/ThemeColorSync";
import EventPreviewViewport from "../../src/components/EventPreviewViewport";

function Workspace() {
  const { theme, preference } = useTheme();
  const [dialog, setDialog] = useState(false);
  const [preview, setPreview] = useState(false);
  return <>
    <ThemeColorSync />
    <main className="appearance-fixture bg-background text-foreground" style={{ padding: 24, minHeight: 1400 }}>
      <h1>Create your Live Card</h1>
      <AppearanceSelector />
      <output data-testid="appearance-state">{preference}:{theme}</output>
      <section className="bg-card text-card-foreground" style={{ marginTop: 24, padding: 24 }}>
        <label htmlFor="unsaved">Event title</label>
        <input id="unsaved" placeholder="Movie Under the Stars" className="border border-input bg-field-background text-foreground" />
        <button onClick={() => setDialog(true)}>Open dialog</button>
        <button onClick={() => setPreview(true)}>Open event preview</button>
      </section>
      <div className="auth-modal"><label htmlFor="auth-email">Account email</label><input id="auth-email" type="email" /></div>
      {preview && <div style={{ height: 480, marginTop: 24 }}>
        <EventPreviewViewport title="Authored iframe" initialDevice="mobile" preserveNavigation>
          <section style={{ background: "#fff0d6", color: "#2b1b16", minHeight: 400 }}><input id="iframe-input" placeholder="Authored placeholder" /><p>Preserved design</p></section>
        </EventPreviewViewport>
      </div>}
      <section data-appearance-scope="authored" id="authored-canvas" style={{ background: "#fff0d6", color: "#2b1b16", padding: 24 }}>
        <h2>Host-selected event design</h2>
        <p className="bg-white text-slate-900 dark:bg-black dark:text-white">Original palette</p>
        <input id="authored-input" placeholder="Event-owned input" />
      </section>
    </main>
    {dialog && createPortal(<div role="dialog" aria-label="Appearance dialog" className="bg-card text-foreground" style={{ position: "fixed", top: 50, left: 50, padding: 24 }}><button onClick={() => setDialog(false)}>Close dialog</button></div>, document.body)}
  </>;
}
createRoot(document.getElementById("root")!).render(<ThemeProvider><Workspace /></ThemeProvider>);
