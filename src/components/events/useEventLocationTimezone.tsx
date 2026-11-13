"use client";

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { eventTimezoneLocation, validEventTimeZone } from "@/lib/event-location-timezone";

const cache = new Map<string, string>();

export function useEventLocationTimezone({
  data,
  setData,
  enabled = true,
  saved,
}: {
  data: Record<string, any>;
  setData: Dispatch<SetStateAction<any>>;
  enabled?: boolean;
  saved?: Record<string, any>;
}) {
  const location = eventTimezoneLocation(data);
  const update = useRef(setData);
  update.current = setData;
  const [status, setStatus] = useState<"finding" | "resolved" | "unconfirmed">("unconfirmed");
  const source = data.timezoneSource;
  const manual = source === "manual" && data.timezoneLocation === location.key;
  const hydrated = useRef(false);
  useEffect(() => {
    if (!enabled || !saved || hydrated.current) return;
    hydrated.current = true;
    const timezone = validEventTimeZone(saved.timezone);
    if (!timezone) return;
    update.current((previous: Record<string, any>) => previous.timezoneSource || saved.timezoneLocation && saved.timezoneLocation !== eventTimezoneLocation(previous).key
      ? previous : { ...previous, timezone, timezoneSource: saved.timezoneSource, timezoneLocation: saved.timezoneLocation });
  }, [enabled, saved]);
  useEffect(() => {
    if (!enabled) return;
    if (data.timezoneLocation && data.timezoneLocation !== location.key) {
      update.current((previous: Record<string, any>) => ({ ...previous, timezone: "", timezoneSource: undefined, timezoneLocation: undefined }));
      setStatus("unconfirmed");
      return;
    }
    if (manual || !location.key) return;
    if (source === "location" && data.timezoneLocation === location.key && validEventTimeZone(data.timezone)) {
      cache.set(location.key, data.timezone);
      setStatus("resolved");
      return;
    }
    const controller = new AbortController();
    let active = true;
    const apply = (timezone: string) => {
      if (!active) return;
      setStatus(timezone ? "resolved" : "unconfirmed");
      if (timezone)
        update.current((previous: Record<string, any>) => {
          if (
            eventTimezoneLocation(previous).key !== location.key ||
            (previous.timezoneSource === "manual" && previous.timezoneLocation === location.key)
          )
            return previous;
          return previous.timezone === timezone &&
            previous.timezoneSource === "location" &&
            previous.timezoneLocation === location.key
            ? previous
            : { ...previous, timezone, timezoneSource: "location", timezoneLocation: location.key };
        });
    };
    setStatus("finding");
    const timer = window.setTimeout(async () => {
      const saved = cache.get(location.key);
      if (saved) {
        apply(saved);
        return;
      }
      try {
        const response = await fetch("/api/events/timezone", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: location.query }),
          signal: controller.signal,
        });
        const result = response.ok ? await response.json() : null;
        const timezone = validEventTimeZone(result?.timezone);
        if (timezone) cache.set(location.key, timezone);
        apply(timezone);
      } catch {
        apply("");
      }
    }, 600);
    return () => {
      active = false;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [location.key, location.query, enabled, manual, source, data.timezoneLocation, data.timezone]);
  return { status };
}
