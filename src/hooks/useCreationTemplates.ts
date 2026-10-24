"use client";

import { useCallback, useEffect, useState } from "react";
import type { CreateGuess } from "@/lib/create/create-intent";
import { cachedCreationCatalog, creationCatalogKey, loadCreationCatalog, type CreationCatalog } from "@/lib/create/creation-template-loader";

const empty: CreationCatalog = { templates: [], previews: {}, themes: {} };
export function useCreationTemplates(guess: CreateGuess | undefined, identity: string) {
  const key = guess ? creationCatalogKey(guess) : "";
  const [attempt, setAttempt] = useState(0);
  const [snapshot, setSnapshot] = useState<{ key: string; identity: string; catalog?: CreationCatalog; error?: string }>({ key: "", identity: "" });
  const active = snapshot.key === key && snapshot.identity === identity ? snapshot : undefined;
  const catalog = guess ? active?.catalog || cachedCreationCatalog(guess) : undefined;
  useEffect(() => {
    if (!guess || !identity) return;
    let current = true;
    setSnapshot({ key, identity, catalog: cachedCreationCatalog(guess) });
    void loadCreationCatalog(guess).then(value => {
      if (current) setSnapshot({ key, identity, catalog: value });
    }).catch(failure => {
      if (current) setSnapshot({ key, identity, error: failure instanceof Error ? failure.message : "Your designs could not be loaded. Please try again." });
    });
    return () => { current = false; };
  }, [key, identity, attempt]);
  const retry = useCallback(() => { setSnapshot({ key, identity }); setAttempt(value => value + 1); }, [key, identity]);
  return { ...(catalog || empty), loading: Boolean(guess && identity && !catalog && !active?.error), error: active?.error, retry };
}
