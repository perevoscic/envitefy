"use client";
import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export default function PwaInstallButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault?.();
      const bip = e as BeforeInstallPromptEvent;
      setDeferred(bip);
      setCanInstall(true);
    };
    window.addEventListener(
      "beforeinstallprompt",
      onBeforeInstallPrompt as any
    );
    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        onBeforeInstallPrompt as any
      );
    };
  }, []);

  useEffect(() => {
    const onInstalled = () => setCanInstall(false);
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, []);

  if (!canInstall) return null;

  return (
    <button
      onClick={async () => {
        if (!deferred) return;
        await deferred.prompt();
        try {
          await deferred.userChoice;
        } finally {
          setDeferred(null);
          setCanInstall(false);
        }
      }}
      className="fixed bottom-4 right-4 z-50 rounded-full bg-primary text-primary-foreground px-4 py-2 shadow-lg"
    >
      Install app
    </button>
  );
}
