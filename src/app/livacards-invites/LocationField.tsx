"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Search } from "lucide-react";
import { readLiveCardForm, type LiveCardLocation } from "@/lib/livecard-builder";
import {
  isOnlineEventLocation,
  readBuilderPlace,
  type BuilderPlace,
} from "@/lib/livecard-location";
import styles from "./livecard-builder.module.css";

export default function LocationField({
  location,
  date,
  timezone,
  onChange,
}: {
  location: LiveCardLocation;
  date: string;
  timezone: string;
  onChange: (location: LiveCardLocation) => void;
}) {
  const [query, setQuery] = useState(
    location.query || [location.venue, location.address, location.city].filter(Boolean).join(", "),
  );
  const [candidates, setCandidates] = useState<BuilderPlace[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [manual, setManual] = useState(Boolean(location.address && !location.timezone));
  const [searching, setSearching] = useState(Boolean(location.address && !location.timezone));
  const [zones, setZones] = useState<string[]>([]);
  const [manualAddress, setManualAddress] = useState(location.address);
  const [manualVenue, setManualVenue] = useState(location.venue);
  const [manualZone, setManualZone] = useState(location.timezone || timezone);
  const request = useRef<AbortController | null>(null);
  const attemptedQueries = useRef(new Set<string>());
  const latest = useRef(location);
  latest.current = location;
  const resolved = location.resolution !== "unresolved" && Boolean(location.address);
  useEffect(() => {
    setZones([
      ...new Set([
        timezone,
        ...(typeof Intl.supportedValuesOf === "function"
          ? Intl.supportedValuesOf("timeZone")
          : [
              "UTC",
              "America/New_York",
              "America/Chicago",
              "America/Denver",
              "America/Los_Angeles",
              "Europe/London",
            ]),
      ]),
    ]);
  }, [timezone]);
  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => {
    setQuery(
      location.query ||
        [location.venue, location.address, location.city].filter(Boolean).join(", "),
    );
    setManualAddress(location.address);
    setManualVenue(location.venue);
    setManualZone(location.timezone || timezone);
    setCandidates([]);
  }, [
    location.address,
    location.venue,
    location.query,
    location.city,
    location.timezone,
    timezone,
  ]);

  async function lookup(placeId?: string) {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const captured = latest.current;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/livecard-builder/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          query,
          placeId,
          date,
          timezone,
          id: location.id,
          ...(query ===
          (captured.query ||
            [captured.venue, captured.address, captured.city].filter(Boolean).join(", "))
            ? { venue: captured.venue, address: captured.address, city: captured.city }
            : {}),
        }),
      });
      const raw: unknown = await response.json();
      const result = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
      if (!response.ok)
        throw new Error(
          typeof result.error === "string"
            ? result.error
            : "Location lookup failed. Try again or enter the address manually.",
        );
      if (JSON.stringify(latest.current) !== JSON.stringify(captured)) return;
      setCandidates(
        Array.isArray(result.candidates)
          ? result.candidates
              .map(readBuilderPlace)
              .filter((place): place is BuilderPlace => Boolean(place))
          : [],
      );
      const restored = result.location
        ? readLiveCardForm({ locations: [result.location], timezone })?.locations[0]
        : null;
      if (restored) {
        onChange({
          ...captured,
          ...restored,
          query,
          label: captured.label,
          time: captured.time,
          note: captured.note,
        });
        setManual(!restored.timezone);
        setSearching(!restored.timezone);
      }
      setMessage(
        typeof result.message === "string"
          ? result.message
          : restored && !restored.timezone
            ? "Confirm the local time zone below."
            : "",
      );
    } catch (error) {
      if (!controller.signal.aborted)
        setMessage(
          error instanceof Error ? error.message : "Try again or enter the address manually.",
        );
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }

  const lookupRef = useRef(lookup);
  lookupRef.current = lookup;
  useEffect(() => {
    // Extracted locations go straight to matching venues; the host need not type them twice.
    if (
      location.resolution !== "unresolved" ||
      !location.query ||
      !(location.venue || location.city || location.address)
    )
      return;
    if (attemptedQueries.current.has(location.query)) return;
    attemptedQueries.current.add(location.query);
    void lookupRef.current();
  }, [location.resolution, location.query, location.venue, location.city, location.address]);

  return (
    <div className={styles.locationLookup}>
      {resolved && (
        <div className={styles.resolvedLocation}>
          <MapPin size={18} aria-hidden="true" />
          <div>
            <strong>{location.venue || "Event location"}</strong>
            <p>{location.address}</p>
            {location.timezone && (
              <small>
                {location.resolution === "online"
                  ? "Online event"
                  : `Local time${location.city ? ` in ${location.city}` : " at this location"}`}
              </small>
            )}
          </div>
        </div>
      )}
      {resolved && !searching && (
        <button type="button" className={styles.textButton} onClick={() => setSearching(true)}>
          Change location
        </button>
      )}
      {(!resolved || searching) && (
        <>
          <label htmlFor={`location-${location.id}-address`}>
            {resolved ? "Search for a different location" : "Search venue or address"}
          </label>
          <div className={styles.searchRow}>
            <input
              id={`location-${location.id}-address`}
              value={query}
              maxLength={500}
              placeholder="Venue and city, full address, or meeting link"
              onChange={(event) => {
                request.current?.abort();
                setBusy(false);
                setQuery(event.target.value);
                setCandidates([]);
                setMessage("");
                onChange({
                  ...location,
                  query: event.target.value,
                  venue: "",
                  address: "",
                  city: "",
                  timezone: undefined,
                  placeId: undefined,
                  latitude: undefined,
                  longitude: undefined,
                  resolution: "unresolved",
                });
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void lookup();
                }
              }}
            />
            <button
              type="button"
              className={styles.secondary}
              disabled={busy || query.trim().length < 3}
              onClick={() => void lookup()}
            >
              {busy ? <Loader2 size={17} className={styles.spin} /> : <Search size={17} />}{" "}
              {busy ? "Finding…" : "Find"}
            </button>
          </div>
          {message && (
            <p role="status" className={styles.hint}>
              {message}
            </p>
          )}
          {candidates.length > 0 && !busy && (
            <ul className={styles.placeResults} aria-label="Matching venues">
              {candidates.map((place) => (
                <li key={place.placeId}>
                  <button type="button" onClick={() => void lookup(place.placeId)}>
                    <strong>{place.venue}</strong>
                    <span>{place.address}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            className={styles.textButton}
            onClick={() => setManual(!manual)}
            aria-expanded={manual}
          >
            {manual
              ? "Close manual entry"
              : resolved
                ? "Edit address or local time zone"
                : "Enter address manually"}
          </button>
          {manual && (
            <div className={styles.formStack}>
              <div className={styles.field}>
                <label htmlFor={`venue-${location.id}`}>Venue name (optional)</label>
                <input
                  id={`venue-${location.id}`}
                  value={manualVenue}
                  onChange={(event) => setManualVenue(event.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor={`manual-${location.id}`}>Address or meeting link</label>
                <input
                  id={`manual-${location.id}`}
                  value={manualAddress}
                  onChange={(event) => setManualAddress(event.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor={`zone-${location.id}`}>Local time zone</label>
                <select
                  id={`zone-${location.id}`}
                  value={manualZone}
                  onChange={(event) => setManualZone(event.target.value)}
                >
                  {zones.map((zone) => (
                    <option key={zone} value={zone}>
                      {zone.replaceAll("_", " ").replaceAll("/", " · ")}
                    </option>
                  ))}
                </select>
                <p className={styles.hint}>The time you enter is the local time at your event.</p>
              </div>
              <button
                type="button"
                className={styles.secondary}
                disabled={!manualAddress.trim()}
                onClick={() => {
                  request.current?.abort();
                  setBusy(false);
                  onChange({
                    ...location,
                    venue: manualVenue.trim(),
                    address: manualAddress.trim(),
                    query: manualAddress.trim(),
                    timezone: manualZone,
                    resolution: isOnlineEventLocation(manualAddress.trim()) ? "online" : "manual",
                    placeId: undefined,
                    latitude: undefined,
                    longitude: undefined,
                    city: "",
                  });
                  setManual(false);
                  setSearching(false);
                  setCandidates([]);
                  setMessage("");
                }}
              >
                Confirm location & local time
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
