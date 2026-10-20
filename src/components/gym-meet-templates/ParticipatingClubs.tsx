"use client";

import { useId, useState } from "react";
import type { WebsiteClub } from "@/lib/discovery/event-website";

export default function ParticipatingClubs({
  clubs,
  year,
  cardClass,
  linkClass,
}: {
  clubs: WebsiteClub[];
  year: number | null;
  cardClass: string;
  linkClass: string;
}) {
  const searchId = useId();
  const [search, setSearch] = useState("");
  const matching = clubs.filter((club) =>
    `${club.name} ${club.location}`.toLowerCase().includes(search.trim().toLowerCase()),
  );
  return (
    <div className="space-y-4">
      <label className="block text-sm font-semibold" htmlFor={searchId}>
        Search participating clubs{year ? ` (${year})` : ""}
      </label>
      <input
        id={searchId}
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="min-h-11 w-full rounded-xl border border-current/20 bg-transparent px-4 text-base focus-visible:outline-2 focus-visible:outline-offset-2"
        placeholder="Club, city or state"
      />
      <p className="text-sm" aria-live="polite">
        {matching.length} {matching.length === 1 ? "club" : "clubs"}
      </p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {matching.map((club) => (
          <li key={`${club.name}|${club.location}`} className={`${cardClass} p-4`}>
            <p className="font-semibold">{club.name}</p>
            <p className="mt-1 text-sm">{club.location}</p>
          </li>
        ))}
      </ul>
      {!matching.length ? <p className="text-sm">No clubs match your search.</p> : null}
      {[...new Set(clubs.map((club) => club.sourceUrl))].map((url) => (
        <a
          key={url}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={`${linkClass} inline-flex min-h-11 items-center focus-visible:outline-2 focus-visible:outline-offset-2`}
        >
          Official competing teams
        </a>
      ))}
    </div>
  );
}
