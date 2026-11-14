import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import AppearanceProvider, { useTheme } from "../../src/components/AppearanceProvider";
import ThemeColorSync from "../../src/components/ThemeColorSync";
import { registerEventPageColor } from "../../src/lib/event-page-chrome";

function Workspace() {
  const { preference, theme, setPreference } = useTheme();
  const [paper, setPaper] = useState<string | null>(null);
  useEffect(() => {
    if (!paper) return;
    const registration = registerEventPageColor(document.documentElement, paper);
    return () => registration.dispose();
  }, [paper]);
  return <>
    <ThemeColorSync />
    <output>{preference}:{theme}</output>
    <button onClick={() => setPreference("light")}>Light</button>
    <button onClick={() => setPreference("dark")}>Dark</button>
    <button onClick={() => setPreference("system")}>System</button>
    <button onClick={() => setPaper("#111b3a")}>Dark event</button>
    <button onClick={() => setPaper("#f6f1e7")}>Light event</button>
    <button onClick={() => setPaper(null)}>Leave event</button>
    <section data-appearance-scope="authored" data-theme-color="#ff0000" style={{ background: "#111b3a", color: "#faf0dc" }}>
      <input aria-label="Unsaved event title" defaultValue="Retained title" />
    </section>
  </>;
}

createRoot(document.getElementById("root")!).render(<AppearanceProvider><Workspace /></AppearanceProvider>);
