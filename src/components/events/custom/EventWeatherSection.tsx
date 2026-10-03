"use client";

import { Cloud, CloudRain, CloudSnow, CloudSun, Droplets, Sun, Wind } from "lucide-react";
import { useEffect, useState } from "react";
import type { EventWeatherResult } from "@/lib/event-weather";
import styles from "./custom-event.module.css";

const messages = {
  missing_details: "The forecast will appear once the event has a date and a location.",
  location_unavailable: "The forecast needs a clear city or full street address for this location.",
  outside_window: "The forecast will be available closer to the event, within three days of the date.",
  past: "The forecast is no longer available for this event date.",
  unconfigured: "Weather forecasts are temporarily unavailable.",
  unavailable: "We couldn't load the forecast right now. Please try again shortly.",
};

export default function EventWeatherSection({ eventId, date, time, location, units }: {
  eventId?: string;
  date: string;
  time: string;
  location: string;
  units: "f" | "c";
}) {
  const key = JSON.stringify([eventId, date, time, location]);
  const [state, setState] = useState<{ key: string; result: EventWeatherResult } | null>(null);
  const [retry, setRetry] = useState(0);
  const result = state?.key === key ? state.result : null;
  useEffect(() => {
    if (!date || !location) return;
    const controller = new AbortController();
    setState((previous) => previous?.key === key && previous.result.status === "available" ? previous : null);
    // Keep venue and date edits responsive and ignore results from older field values.
    const timer = setTimeout(() => {
      void fetch("/api/events/weather", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventId ? { eventId } : { date, time, location }),
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20_000)]),
      }).then(async (response) => {
        if (!response.ok) throw new Error("Weather unavailable");
        const weather: EventWeatherResult = await response.json();
        if (!controller.signal.aborted) setState({ key, result: weather });
      }).catch(() => {
        if (!controller.signal.aborted) setState({ key, result: { status: "unavailable" } });
      });
    }, 500);
    const refresh = setInterval(() => setRetry((value) => value + 1), 15 * 60_000);
    return () => { clearTimeout(timer); clearInterval(refresh); controller.abort(); };
  }, [key, date, time, location, eventId, retry]);

  const forecast = result?.status === "available" ? result : null;
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
  const dateLabel = date && Number.isFinite(Date.parse(`${date}T12:00:00Z`))
    ? new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", weekday: "long", month: "long", day: "numeric" }) : "";
  const timeLabel = forecast?.time
    ? new Date(`2000-01-01T${forecast.time}:00Z`).toLocaleTimeString("en-US", { timeZone: "UTC", hour: "numeric", minute: "2-digit" }) : "";
  const status = !date || !location ? "missing_details" : result?.status;
  return (
    <section className={`${styles.section} ${styles.weather}`} aria-label="Event weather">
      <div className={styles.weatherHeading}>
        <div>
          <h2>Weather</h2>
          {dateLabel && <p>{dateLabel}{forecast ? timeLabel ? ` · Near ${timeLabel}` : " · Daily forecast" : ""}</p>}
        </div>
        <CloudSun size={28} strokeWidth={1.5} aria-hidden="true" />
      </div>
      <div aria-live="polite" aria-atomic="true" aria-busy={!status}>
        {forecast ? <>
          <div className={styles.weatherConditions}>
            <Icon size={48} strokeWidth={1.4} aria-hidden="true" />
            <div>
              {temp !== null && <div className={styles.weatherTemperature}>{Math.round(temp)}<span>{degree}</span></div>}
              <p>{summary || "Event forecast"}</p>
            </div>
          </div>
          <p className={styles.weatherLocation}>{forecast.location}</p>
          <dl className={styles.weatherMetrics}>
            {high !== null && low !== null && <div><dt>High / Low</dt><dd>{Math.round(high)}° / {Math.round(low)}{degree}</dd></div>}
            {forecast.rainChance !== null && <div><dt><Droplets size={16} aria-hidden="true" /> Chance of rain</dt><dd>{Math.round(forecast.rainChance)}%</dd></div>}
            {wind !== null && <div><dt><Wind size={16} aria-hidden="true" /> {forecast.time ? "Wind" : "Max wind"}</dt><dd>{Math.round(wind)} {units === "c" ? "km/h" : "mph"}</dd></div>}
          </dl>
          <p className={styles.weatherSource}>
            Forecasts can change. Updated {new Date(forecast.checkedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} · <a href="https://www.weatherapi.com/" target="_blank" rel="noopener noreferrer">WeatherAPI.com</a>
          </p>
        </> : <div className={styles.weatherEmpty}>
          <p>{status && status !== "available" ? messages[status] : "Checking the event forecast…"}</p>
          {(status === "unavailable" || status === "unconfigured" || status === "location_unavailable") && <button type="button" className={styles.weatherRetry} onClick={() => setRetry((value) => value + 1)}>Retry weather</button>}
        </div>}
      </div>
    </section>
  );
}
