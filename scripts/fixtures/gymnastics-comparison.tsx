import { createRoot } from "react-dom/client";
import GymnasticsMeetTransformation from "../../src/components/gymnastics-landing/GymnasticsMeetTransformation";
import marketing from "../../src/components/marketing/marketing.module.css";

createRoot(document.getElementById("root")!).render(
  <main className={marketing.page} data-marketing-tone="sports">
    <GymnasticsMeetTransformation />
    <div id="templates" style={{ minHeight: "100vh" }} />
  </main>,
);
