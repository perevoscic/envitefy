import { Suspense, useEffect } from "react";
import { hydrateRoot } from "react-dom/client";
import AppearanceProvider, { useTheme } from "../../src/components/AppearanceProvider";
import AppearanceSelector from "@/components/AppearanceSelector";

let releaseHydration: (() => void) | undefined;
let hydrationReleased = false;
const hydrationGate = new Promise<void>((resolve) => {
  releaseHydration = () => {
    hydrationReleased = true;
    resolve();
  };
});

function DeferredSelector() {
  // Keep the server-rendered switch pending while the outer provider's mount
  // effect resolves browser appearance, matching delayed AppShell hydration.
  if (typeof window !== "undefined" && !hydrationReleased) throw hydrationGate;
  useEffect(() => {
    document.documentElement.dataset.switchHydrated = "true";
  }, []);
  return <AppearanceSelector compact />;
}

function AppearanceProbe() {
  const { theme, preference } = useTheme();
  return <output data-testid="appearance-state">{preference}:{theme}</output>;
}

export function AppearanceHydrationFixture() {
  return <AppearanceProvider>
    <AppearanceProbe />
    <Suspense fallback={<p>Loading switch</p>}>
      <DeferredSelector />
    </Suspense>
  </AppearanceProvider>;
}

if (typeof window !== "undefined") {
  (window as any).releaseAppearanceHydration = releaseHydration;
  (window as any).recoverableErrors = [];
  hydrateRoot(document.getElementById("root")!, <AppearanceHydrationFixture />, {
    onRecoverableError: (error) => (window as any).recoverableErrors.push(String(error)),
  });
}
