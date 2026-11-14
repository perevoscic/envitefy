"use client";

import { useEffect, useState } from "react";
import type { VenueWebsitePhoto } from "@/lib/venue-photo-source";
import { readVenuePhotoPermission } from "@/lib/venue-photo-permission";
import styles from "./venue-photo.module.css";

export default function VenuePhoto({ venue, address, photo }: { venue: string; address: string; photo?: VenueWebsitePhoto }) {
  const [failedUrl, setFailedUrl] = useState("");
  const [resolved, setResolved] = useState<{ key: string; photo: VenueWebsitePhoto } | null>(null);
  const requestKey = JSON.stringify([venue, address, photo?.reference || null]);
  useEffect(() => {
    if (!photo?.reference) return;
    const controller = new AbortController();
    void fetch("/api/maps/venue-photo-permission", { method: "POST", signal: controller.signal,
      headers: { "Content-Type": "application/json" }, body: JSON.stringify({ venue, reference: photo.reference }) })
      .then(async response => {
        if (!response.ok) return;
        const { photo: result } = await response.json();
        const permission = result && readVenuePhotoPermission(result.permission, result.sourceUrl, result.imageUrl);
        if (!controller.signal.aborted && permission) setResolved({ key: requestKey, photo: { url: result.imageUrl, sourceUrl: result.sourceUrl, permission } });
      }).catch(() => {});
    return () => controller.abort();
  }, [requestKey, venue]);
  if (!venue || !address) return null;
  const current = photo?.url ? photo : resolved?.key === requestKey ? resolved.photo : undefined;
  const permission = current?.url && readVenuePhotoPermission(current.permission, current.sourceUrl, current.url);
  if (!current?.url || !permission || failedUrl === current.url) return null;
  const imageUrl = current.url;
  return <figure className={styles.photo} data-venue-photo>
    <img src={imageUrl} alt={`${venue} — venue photo`} width={1200} height={700} loading="lazy" onError={() => setFailedUrl(imageUrl)} />
    <figcaption className={styles.caption}>
      <a href={current.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">Photo source · {venue}</a>
      <a href={permission.termsUrl} target="_blank" rel="noopener noreferrer" className="underline">Image use terms</a>
    </figcaption>
  </figure>;
}
