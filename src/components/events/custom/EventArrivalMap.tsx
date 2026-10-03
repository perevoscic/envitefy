"use client";

import { type MouseEvent, useState } from "react";
import {
  type EventArrivalMap as ArrivalMap,
  type ArrivalMapMarker,
  arrivalMarkerDirections,
} from "@/lib/event-arrival-map";
import styles from "./event-arrival-map.module.css";

export default function EventArrivalMap({
  map,
  showProposed = false,
  onChange,
  onRefresh,
}: {
  map: ArrivalMap;
  showProposed?: boolean;
  onChange?: (map: ArrivalMap) => void;
  onRefresh?: () => Promise<void>;
}) {
  const [selected, setSelected] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState("");
  const canEdit = Boolean(onChange);
  const hasImage = Boolean(map.mapImage && map.view && !imageFailed);
  const showSourceEvidence =
    !showProposed && !canEdit && map.markers.some((marker) => !marker.confirmed);
  const active = map.markers[selected];
  const changeMarker = (patch: Partial<ArrivalMapMarker>) =>
    onChange?.({
      ...map,
      markers: map.markers.map((m, index) => (index === selected ? { ...m, ...patch } : m)),
    });
  const place = (e: MouseEvent<HTMLButtonElement>) => {
    if (!active || !e.detail) return;
    const box = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - box.left) / box.width,
      y = (e.clientY - box.top) / box.height;
    if (x >= 0 && x <= 1 && y >= 0 && y <= 0.9) changeMarker({ point: { x, y }, confirmed: false });
  };
  const image = (
    <>
      <img
        src={map.mapImage}
        alt="Street map of the event area with numbered arrival markers"
        width={map.view?.width}
        height={map.view?.height}
        loading="lazy"
        onError={() => setImageFailed(true)}
      />
      {map.markers.map((marker, index) =>
        marker.point && (marker.confirmed || showProposed || canEdit) ? (
          <span
            key={index}
            className={styles.pin}
            data-confirmed={marker.confirmed}
            aria-hidden="true"
            style={{ left: `${marker.point.x * 100}%`, top: `${marker.point.y * 100}%` }}
          >
            {index + 1}
          </span>
        ) : null,
      )}
    </>
  );
  return (
    <div className={styles.arrival}>
      {hasImage &&
        (canEdit ? (
          <button
            type="button"
            className={styles.map}
            onClick={place}
            aria-label={`Place ${active?.label || "arrival marker"} on the map. Use arrow keys to adjust its position.`}
            onKeyDown={(e) => {
              if (!active || !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key))
                return;
              e.preventDefault();
              const p = active.point || { x: 0.5, y: 0.5 },
                step = e.shiftKey ? 0.002 : 0.01;
              changeMarker({
                point: {
                  x: Math.max(
                    0,
                    Math.min(
                      1,
                      p.x + (e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0),
                    ),
                  ),
                  y: Math.max(
                    0,
                    Math.min(
                      0.9,
                      p.y + (e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0),
                    ),
                  ),
                },
                confirmed: false,
              });
            }}
          >
            {image}
          </button>
        ) : (
          <div className={styles.map}>{image}</div>
        ))}
      <ol className={styles.legend}>
        {map.markers.map((marker, index) => {
          const directions = arrivalMarkerDirections(map, marker);
          return (
            <li key={index}>
              <span className={styles.number} aria-hidden="true">
                {index + 1}
              </span>
              <div>
                <strong>{marker.label}</strong>
                {marker.note && <p>{marker.note}</p>}
                {!marker.confirmed && (
                  <p className={styles.hint}>
                    {showProposed || canEdit
                      ? marker.point
                        ? "Proposed position — confirm against the handout."
                        : "Position needs confirmation against the handout."
                      : "See the source map below for this location."}
                  </p>
                )}
                {directions && (
                  <a href={directions} target="_blank" rel="noopener noreferrer">
                    Directions to {marker.label}
                  </a>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      {canEdit && active && (
        <div className={styles.tools}>
          <label>
            Marker to place
            <select value={selected} onChange={(e) => setSelected(Number(e.target.value))}>
              {map.markers.map((marker, index) => (
                <option key={index} value={index}>
                  {index + 1}. {marker.label}
                </option>
              ))}
            </select>
          </label>
          <p>
            Tap the map to place this marker, or focus the map and use arrow keys. Compare the road
            and parking outlines with the source map before confirming.
          </p>
          <label>
            Marker label
            <input
              value={active.label}
              maxLength={180}
              onChange={(e) => changeMarker({ label: e.target.value })}
            />
          </label>
          <label>
            Arrival instructions
            <textarea
              value={active.note}
              maxLength={1000}
              rows={3}
              onChange={(e) => changeMarker({ note: e.target.value })}
            />
          </label>
          <button
            type="button"
            disabled={!hasImage || !active.point || active.confirmed}
            onClick={() => changeMarker({ confirmed: true })}
          >
            {active.confirmed ? "Position confirmed" : "Confirm marker position"}
          </button>
          <button
            type="button"
            disabled={!active.point}
            onClick={() => changeMarker({ point: null, confirmed: false })}
          >
            Clear position
          </button>
        </div>
      )}
      {canEdit && (
        <div className={styles.tools}>
          <button
            type="button"
            disabled={map.markers.length >= 6}
            onClick={() => {
              setSelected(map.markers.length);
              onChange?.({
                ...map,
                markers: [
                  ...map.markers,
                  {
                    label: "Arrival location",
                    kind: "other",
                    note: "",
                    point: null,
                    confirmed: false,
                  },
                ],
              });
            }}
          >
            Add marker
          </button>
          {onRefresh && (
            <button
              type="button"
              disabled={refreshing}
              onClick={async () => {
                setRefreshing(true);
                setRefreshError("");
                try {
                  await onRefresh();
                  setImageFailed(false);
                } catch (error) {
                  setRefreshError(
                    error instanceof Error
                      ? error.message
                      : "The map could not be refreshed. Please retry.",
                  );
                } finally {
                  setRefreshing(false);
                }
              }}
            >
              {refreshing ? "Refreshing map…" : "Refresh map from event address"}
            </button>
          )}
          {refreshError && <p role="alert">{refreshError}</p>}
          {refreshing && (
            <p role="status">
              Your source map stays available. Refreshed marker positions will need confirmation.
            </p>
          )}
        </div>
      )}
      {!hasImage && (
        <p role="status">
          {map.status === "location_unavailable"
            ? "The map area needs a unique street address. The source map is available below."
            : "The street map is unavailable. The source map and arrival instructions are available below."}
        </p>
      )}
      <details className={styles.source} open={!hasImage || showSourceEvidence}>
        <summary>View source handout map</summary>
        <img
          src={map.sourceImage}
          alt="Original handout map with its parking, drop-off and arrival annotations"
          loading="lazy"
        />
      </details>
      {canEdit && (
        <button
          type="button"
          className={styles.remove}
          onClick={() => onChange?.({ ...map, markers: [] })}
          disabled={!map.markers.length}
        >
          Remove all markers
        </button>
      )}
    </div>
  );
}
