"use client";

import { useState } from "react";
import { arrivalMapFraming, type EventArrivalMap as ArrivalMap } from "@/lib/event-arrival-map";
import styles from "./event-arrival-map.module.css";

export default function EventArrivalMap({ map }: { map: ArrivalMap }) {
  const [failedImage, setFailedImage] = useState<string>();
  const hasImage = Boolean(map.mapImage && map.view && failedImage !== map.mapImage);
  const framing = arrivalMapFraming(map);
  return (
    <div className={styles.arrival}>
      {hasImage ? (
        <div className={styles.map} data-arrival-map>
          <div
            className={styles.viewport}
            style={{ aspectRatio: `${map.view?.width} / ${map.view?.height}` }}
          >
            <img
              src={map.mapImage}
              alt="Street map of the event area with numbered arrival locations"
              aria-description={
                map.markers
                  .flatMap((marker, index) =>
                    marker.point ? [`${index + 1}: ${marker.label}`] : [],
                  )
                  .join(". ") || undefined
              }
              width={map.view?.width}
              height={map.view?.height}
              loading="lazy"
              style={{
                width: `${framing.scale * 100}%`,
                left: `${(0.5 - framing.scale * framing.centerX) * 100}%`,
                top: `${(0.5 - framing.scale * framing.centerY) * 100}%`,
              }}
              onError={() => setFailedImage(map.mapImage)}
            />
            {map.markers.map(
              (marker, index) =>
                marker.point && (
                  <span
                    key={index}
                    className={styles.pin}
                    aria-hidden="true"
                    style={{
                      left: `${(0.5 + framing.scale * (marker.point.x - framing.centerX)) * 100}%`,
                      top: `${(0.5 + framing.scale * (marker.point.y - framing.centerY)) * 100}%`,
                    }}
                  >
                    {index + 1}
                  </span>
                ),
            )}
          </div>
          {framing.scale > 1 && map.view && (
            <div
              className={styles.attribution}
              aria-hidden="true"
              style={{
                backgroundImage: `url("${map.mapImage}")`,
                aspectRatio: `${map.view.width} / ${Math.min(28, map.view.height)}`,
              }}
            />
          )}
        </div>
      ) : (
        <p role="status">
          The parking map screenshot is unavailable. Follow the arrival instructions.
        </p>
      )}
      {map.markers.length > 0 && (
        <ol className={styles.legend} aria-label="Arrival locations">
          {map.markers.map((marker, index) => (
            <li key={index}>
              <span className={styles.number} aria-hidden="true">
                {index + 1}
              </span>
              <div className={styles.location}>
                <strong>{marker.label}</strong>
                {marker.note && <p>{marker.note}</p>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
