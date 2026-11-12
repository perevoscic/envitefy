import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import GymnasticsLauncher from "../../src/components/event-create/GymnasticsLauncher";

function App() {
  const [destination, setDestination] = useState("");
  useEffect(() => {
    const navigate = (event: Event) => setDestination((event as CustomEvent<string>).detail);
    window.addEventListener("fixture-navigation", navigate);
    return () => window.removeEventListener("fixture-navigation", navigate);
  }, []);
  return destination ? <main data-destination={destination}>
    <h1>Editable meet draft</h1><p role="status">Generating your image…</p>
  </main> : <main>
    <button>Before import</button>
    <GymnasticsLauncher variant={new URLSearchParams(location.search).get("variant") === "page" ? "page" : "panel"} forwardQueryString="templateId=moonbeam-balance" />
    <button>After import</button>
  </main>;
}
createRoot(document.getElementById("root")!).render(<App />);
