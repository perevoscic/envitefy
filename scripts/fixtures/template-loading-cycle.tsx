import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import TemplateEditorLoading, {
  TEMPLATE_LOADING_PHRASES,
} from "@/components/templates/TemplateEditorLoading";

declare global {
  interface Window {
    templateLoadingCycle: {
      phrases: readonly string[];
      remount: () => void;
      hide: () => void;
      show: () => void;
      fail: () => void;
    };
  }
}

function App() {
  const [mount, setMount] = useState(0);
  const [visible, setVisible] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    window.templateLoadingCycle = {
      phrases: TEMPLATE_LOADING_PHRASES,
      remount: () => flushSync(() => setMount((value) => value + 1)),
      hide: () => flushSync(() => setVisible(false)),
      show: () =>
        flushSync(() => {
          setError(false);
          setVisible(true);
        }),
      fail: () => flushSync(() => setError(true)),
    };
  }, []);
  return (
    <div style={{ display: "flex", height: "100dvh" }}>
      {visible && <TemplateEditorLoading key={mount} error={error} />}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
