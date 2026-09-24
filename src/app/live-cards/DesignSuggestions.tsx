"use client";

import { Check, Shuffle } from "lucide-react";
import { useEffect, useState } from "react";
import type { LiveCardEventType } from "@/lib/livecard-builder";
import {
  type LiveCardDesignSuggestion,
  pickLiveCardDesignSuggestions,
} from "@/lib/livecard-design-suggestions";
import styles from "./livecard-builder.module.css";

export default function DesignSuggestions({
  category,
  design,
  onChoose,
}: {
  category: LiveCardEventType;
  design: string;
  onChoose: (prompt: string) => void;
}) {
  const [ideas, setIdeas] = useState<LiveCardDesignSuggestion[]>([]);

  // Randomize after hydration; typing into the form never reshuffles the ideas.
  useEffect(() => {
    setIdeas(pickLiveCardDesignSuggestions(category));
  }, [category]);

  return (
    <section className={styles.designSuggestions} aria-label={`${category} design ideas`}>
      <div className={styles.suggestionHeading}>
        <h3>Try a starting idea</h3>
        <button
          type="button"
          className={styles.shuffleSuggestions}
          aria-label="Shuffle design ideas"
          onClick={() => {
            setIdeas(
              pickLiveCardDesignSuggestions(
                category,
                ideas.map((idea) => idea.id),
              ),
            );
          }}
        >
          <Shuffle size={15} aria-hidden="true" /> Shuffle
        </button>
      </div>
      <ul className={styles.suggestionList} aria-live="polite" aria-relevant="additions">
        {ideas.map((idea) => (
          <li key={idea.id}>
            <button
              type="button"
              className={styles.suggestion}
              aria-pressed={design === idea.prompt}
              title={idea.prompt}
              onClick={() => {
                onChoose(idea.prompt);
                document.getElementById("livecard-design")?.focus();
              }}
            >
              <span>
                <strong>{idea.title}</strong>
                <span>{idea.summary}</span>
              </span>
              {design === idea.prompt && <Check size={16} aria-hidden="true" />}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
