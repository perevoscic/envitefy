"use client";

import { Cloud, CloudRain, CloudSnow, CloudSun, Droplets, RefreshCw, Sun, Wind } from "lucide-react";
import { useEffect, useState } from "react";
import type { EventWeatherResult } from "@/lib/event-weather";
import styles from "./custom-event.module.css";

type WeatherState = { key: string; result: EventWeatherResult | null; busy: boolean; refreshFailed: boolean };

export default function EventWeatherSection({ eventId, date, time, location, units }: {
  eventId?: string;
  date: string;
  time: string;
  location: string;
  units: "f" | "c";
}) {
  const key = JSON.stringify([eventId, date, time, location]);
  const [state, setState] = useState<WeatherState | null>(null);
  const [request, setRequest] = useState({ key: "", version: 0, refresh: false });
  const result = state?.key === key ? state.result : null;
  const busy = Boolean(date && location && (state?.key !== key || state.busy));
  useEffect(() => {
    if (!date || !location) return;
    const controller = new AbortController();
    const refresh = request.key === key && request.refresh;
    setState((previous) => ({
      key,
      result: previous?.key === key && previous.result?.status === "available" ? previous.result : null,
      busy: true,
      refreshFailed: false,
    }));
    // Debounce edits and reject responses for older event facts. Manual refresh starts immediately.
    const timer = setTimeout(() => {
      void fetch("/api/events/weather", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...(eventId ? { eventId } : { date, time, location }), ...(refresh ? { refresh: true } : {}) }),
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20_000)]),
      }).then(async (response) => {
        if (!response.ok) throw new Error("Weather unavailable");
        const weather: EventWeatherResult = await response.json();
        if (!controller.signal.aborted) setState((previous) => {
          const keepForecast = previous?.key === key && previous.result?.status === "available" &&
            (weather.status === "unavailable" || weather.status === "unconfigured");
          return { key, result: keepForecast ? previous.result : weather, busy: false, refreshFailed: Boolean(keepForecast) };
        });
      }).catch(() => {
        if (!controller.signal.aborted) setState((previous) => {
          const keepForecast = previous?.key === key && previous.result?.status === "available";
          return { key, result: keepForecast ? previous.result : { status: "unavailable" }, busy: false, refreshFailed: Boolean(keepForecast) };
        });
      });
    }, refresh ? 0 : 500);
    const interval = setInterval(() => setRequest((value) => ({ key, version: value.version + 1, refresh: false })), 15 * 60_000);
    return () => { clearTimeout(timer); clearInterval(interval); controller.abort(); };
  }, [key, date, time, location, eventId, request]);

  const forecast = result?.status === "available" ? result : null;
  // Keep checking while hidden so the panel appears when a forecast becomes available.
  if (!forecast) return null;
  const temp = forecast && (units === "c" ? forecast.tempC : forecast.tempF);
  const high = forecast && (units === "c" ? forecast.highC : forecast.highF);
  const low = forecast && (units === "c" ? forecast.lowC : forecast.lowF);
  const wind = forecast && (units === "c" ? forecast.windKph : forecast.windMph);
  const degree = units === "c" ? "°C" : "°F";
  const summary = forecast?.summary || "";
  const Icon = /snow|sleet|ice|blizzard/i.test(summary) ? CloudSnow
    : /rain|drizzle|thunder|shower/i.test(summary) ? CloudRain
    : /partly/i.test(summary) ? CloudSun
    : /sunny|clear/i.test(summary) ? Sun : Cloud;
  const timeLabel = forecast?.time
    ? new Date(`2000-01-01T${forecast.time}:00Z`).toLocaleTimeString("en-US", { timeZone: "UTC", hour: "numeric", minute: "2-digit" }) : "";
  return (
    <section className={styles.weather} aria-label="Event weather">
      <div className={styles.weatherHeading}>
        <h2>Weather</h2>
        <button type="button" className={styles.weatherRefresh} disabled={busy}
          aria-label="Refresh weather" onClick={() => setRequest((value) => ({ key, version: value.version + 1, refresh: true }))}>
          <RefreshCw size={14} aria-hidden="true" />{busy ? "Refreshing…" : "Refresh"}
        </button>
      </div>
      <div aria-live="polite" aria-atomic="true" aria-busy={busy}>
          <div className={styles.weatherConditions}>
            <Icon size={28} strokeWidth={1.5} aria-hidden="true" />
            {temp !== null && <div className={styles.weatherTemperature}>{Math.round(temp)}<span>{degree}</span></div>}
            <div>
              <p className={styles.weatherSummary}>{summary || "Event forecast"}</p>
              <p className={styles.weatherTime}>{timeLabel ? `Near ${timeLabel}` : "Daily forecast"}</p>
            </div>
          </div>
          <dl className={styles.weatherMetrics}>
            {high !== null && low !== null && <div><dt>High / Low</dt><dd>{Math.round(high)}° / {Math.round(low)}{degree}</dd></div>}
            {forecast.rainChance !== null && <div><dt><Droplets size={14} aria-hidden="true" /> Rain</dt><dd>{Math.round(forecast.rainChance)}%</dd></div>}
            {wind !== null && <div><dt><Wind size={14} aria-hidden="true" /> {forecast.time ? "Wind" : "Max wind"}</dt><dd>{Math.round(wind)} {units === "c" ? "km/h" : "mph"}</dd></div>}
          </dl>
          <p className={styles.weatherLocation}>{forecast.location}</p>
          <p className={styles.weatherSource}>
            Updated {new Date(forecast.checkedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} · <a href="https://www.weatherapi.com/" target="_blank" rel="noopener noreferrer">WeatherAPI.com</a>
          </p>
          {state?.key === key && state.refreshFailed && <p className={styles.weatherEmpty}>Couldn't refresh. Showing the last forecast.</p>}
      </div>
    </section>
  );
}
