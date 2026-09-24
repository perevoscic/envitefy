"use client";

import { MapPin } from "lucide-react";
import { useState } from "react";
import type { LiveCardLocation } from "@/lib/livecard-builder";
import type { BuilderPlace, LocationPreparationIssue } from "@/lib/livecard-location";
import styles from "./livecard-builder.module.css";

export default function LocationField({
  location,
  issue,
  onChange,
  onChoose,
}: {
  location: LiveCardLocation;
  issue?: LocationPreparationIssue;
  onChange: (location: LiveCardLocation) => void;
  onChoose: (place: BuilderPlace) => void;
}) {
  const [editing, setEditing] = useState(false);
  const resolved = location.resolution !== "unresolved" && Boolean(location.address);
  const query = location.query || location.venue || location.address;
  const currentIssue = issue?.query === query ? issue : undefined;
  return (
    <div className={styles.locationLookup}>
      {resolved && !editing ? (
        <>
          <div className={styles.resolvedLocation}>
            <MapPin size={18} aria-hidden="true" />
            <div>
              <strong>{location.venue || "Event location"}</strong>
              <p>{location.address}</p>
            </div>
          </div>
          <button type="button" className={styles.textButton} onClick={() => setEditing(true)}>
            Change location
          </button>
        </>
      ) : (
        <>
          <label htmlFor={`location-${location.id}-address`}>
            {resolved ? "Change venue" : "Venue name"}
          </label>
          <input
            id={`location-${location.id}-address`}
            value={query}
            maxLength={500}
            placeholder="e.g. AMC Grand Boulevard"
            aria-describedby={currentIssue ? `location-${location.id}-hint` : undefined}
            onChange={(event) =>
              onChange({
                ...location,
                query: event.target.value,
                venue: "",
                address: "",
                city: "",
                timezone: undefined,
                placeId: undefined,
                sourceUrl: undefined,
                timezoneSourceUrl: undefined,
                latitude: undefined,
                longitude: undefined,
                resolution: "unresolved",
              })
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") event.preventDefault();
            }}
          />
          {currentIssue && (
            <p id={`location-${location.id}-hint`} role="status" className={styles.hint}>
              {currentIssue.message}
            </p>
          )}
          {Boolean(currentIssue?.candidates.length) && (
            <ul className={styles.placeResults} aria-label="Matching venues">
              {currentIssue?.candidates.map((place) => (
                <li key={place.placeId}>
                  <button type="button" onClick={() => onChoose(place)}>
                    <strong>{place.venue}</strong>
                    <span>{place.address}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
