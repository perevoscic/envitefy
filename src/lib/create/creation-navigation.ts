import { normalizeCreateCategory, normalizeCreateSport, type CreateGuess } from "./create-intent";

function sportFromRoute(value?: string | null): string | null {
  const key = value?.trim().toLowerCase().replaceAll("_", "-");
  return normalizeCreateSport(
    key === "dance-ballet" ? "dance" : key === "football-season" ? "football" : key,
  );
}

/** Legacy editor URLs can encode a different occasion than their route segment. */
export function creationGuessFromHref(href: string): CreateGuess | null {
  let url: URL;
  try {
    url = new URL(href, "https://envitefy.com");
  } catch {
    return null;
  }
  const [, root, segment] = url.pathname.split("/");
  if (root !== "event") return null;
  if (segment === "baby-showers" && url.searchParams.get("occasion") === "bridal-shower") {
    return { category: "bridal-showers", sport: null };
  }
  if (segment === "sport-events")
    return { category: "sports", sport: sportFromRoute(url.searchParams.get("sport")) };
  const sport = sportFromRoute(segment);
  if (sport) return { category: "sports", sport };
  const category = normalizeCreateCategory(segment);
  return category ? { category, sport: null } : null;
}

/** Keep one choice per actual event type, preserving the preferred order. */
export function creationChoicesFromLinks<T extends { href: string }>(
  links: readonly T[],
): Array<T & { guess: CreateGuess }> {
  const seen = new Set<string>();
  const choices: Array<T & { guess: CreateGuess }> = [];
  for (const link of links) {
    const guess = creationGuessFromHref(link.href);
    if (!guess) continue;
    const key = `${guess.category}:${guess.sport}`;
    if (seen.has(key)) continue;
    seen.add(key);
    choices.push({ ...link, guess });
  }
  return choices;
}
