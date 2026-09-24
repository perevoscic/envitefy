"use client";

import { useId, useState } from "react";
import styles from "./font-gallery.module.css";

export type FontPairOption<Id extends string = string> = {
  id: Id;
  name: string;
  heading: string;
  body: string;
  kind?: "font";
  category?: string;
};

function familyName(stack: string) {
  return stack
    .split(",")[0]
    .replace(/["']/g, "")
    .replace("var(--font-playfair)", "Playfair Display");
}

export function FontPairingSelect<Id extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly FontPairOption<Id>[];
  value: Id;
  onChange: (value: Id) => void;
}) {
  const searchId = useId();
  const [search, setSearch] = useState("");
  const [collection, setCollection] = useState<"curated" | "all">("curated");
  const [visibleCount, setVisibleCount] = useState(18);
  const library = options.filter((option) => option.kind === "font");
  const activeOptions = search.trim()
    ? options
    : options.filter((option) =>
        collection === "all" ? option.kind === "font" : option.kind !== "font",
      );
  const selected = options.find((option) => option.id === value);
  const filtered = activeOptions.filter((option) =>
    `${option.name} ${familyName(option.heading)} ${familyName(option.body)} ${option.category || ""}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );

  return (
    <div className={styles.gallery}>
      <p className={styles.help}>Expressive titles paired with easy-to-read content.</p>
      {library.length > 0 && (
        <div className={styles.collections} role="group" aria-label="Font collection">
          {(["curated", "all"] as const).map((choice) => (
            <button
              key={choice}
              type="button"
              aria-pressed={collection === choice}
              onClick={() => {
                setCollection(choice);
                setSearch("");
                setVisibleCount(18);
              }}
            >
              {choice === "curated" ? "Curated pairs" : `All ${library.length} fonts`}
            </button>
          ))}
        </div>
      )}
      <label className={styles.searchLabel} htmlFor={searchId}>
        Search styles or fonts
      </label>
      <input
        className={styles.search}
        id={searchId}
        type="search"
        value={search}
        placeholder="Try romantic, Lora or modern"
        onChange={(event) => {
          setSearch(event.target.value);
          setVisibleCount(18);
        }}
      />
      {selected && <p className={styles.help}>Selected: {selected.name}</p>}
      <div className={styles.options} role="group" aria-label="Title and content font pairings">
        {filtered.slice(0, visibleCount).map((option) => (
          <button
            className={styles.option}
            type="button"
            key={option.id}
            aria-pressed={option.id === value}
            aria-label={`${option.name}: ${familyName(option.heading)} titles and ${familyName(option.body)} content`}
            onClick={() => onChange(option.id)}
          >
            <span className={styles.name}>{option.name}</span>
            <span className={styles.title} style={{ fontFamily: option.heading }}>
              A beautiful gathering
            </span>
            <span className={styles.body} style={{ fontFamily: option.body }}>
              Good people. Great memories.
            </span>
            <span className={styles.families}>
              {familyName(option.heading)} + {familyName(option.body)}
            </span>
          </button>
        ))}
      </div>
      {filtered.length > visibleCount && (
        <button
          className={styles.more}
          type="button"
          onClick={() => setVisibleCount((count) => count + 18)}
        >
          Show more fonts ({Math.min(visibleCount, filtered.length)} of {filtered.length})
        </button>
      )}
      {!filtered.length && (
        <p className={styles.help} role="status">
          No matching fonts. Try another name or style.
        </p>
      )}
    </div>
  );
}
