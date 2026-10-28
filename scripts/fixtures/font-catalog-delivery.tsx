import { useState } from "react";
import { hydrateRoot } from "react-dom/client";
import FontCatalogStyles from "@/components/FontCatalogStyles";
import { FontCatalogRoute } from "./font-catalog-runtime";

export function FontCatalogFixture({ initialPath = "/landing", initialStatus = "unauthenticated" }) {
  const [pathname, setPathname] = useState(initialPath);
  const [status, setStatus] = useState(initialStatus);
  const needsCatalog = pathname !== "/landing" && pathname !== "/" || status === "authenticated";
  return <FontCatalogRoute.Provider value={{ pathname, status }}>
    <FontCatalogStyles />
    <button onClick={() => setPathname("/birthdays/templates/customize")}>Open editor</button>
    <button onClick={() => setPathname("/event/saved-custom-font")}>Open saved page</button>
    <button onClick={() => setPathname("/")}>Home</button>
    <button onClick={() => setStatus("authenticated")}>Sign in</button>
    <p data-testid="route">{pathname}:{status}</p>
    <p data-testid="authored" style={{ fontFamily: needsCatalog ? '"Instrument Serif", serif' : "serif", fontSize: 32 }}>
      An invitation with the host’s saved typography
    </p>
  </FontCatalogRoute.Provider>;
}

if (typeof document !== "undefined") {
  hydrateRoot(document.getElementById("root")!, <FontCatalogFixture
    initialPath={document.body.dataset.initialPath}
    initialStatus={document.body.dataset.initialStatus}
  />);
}
