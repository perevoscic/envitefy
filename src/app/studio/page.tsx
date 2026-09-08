import { permanentRedirect } from "next/navigation";
import { buildLandingShowcasePath, resolveLandingShowcaseSnapshot } from "@/lib/landing-showcase";

export default async function StudioPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = props.searchParams ? await props.searchParams : undefined;
  const showcase = params?.showcase;
  const snapshot = resolveLandingShowcaseSnapshot(
    (Array.isArray(showcase) ? showcase[0] : showcase) || "",
  );
  if (snapshot) permanentRedirect(buildLandingShowcasePath(snapshot.slug));

  // Keep old owner bookmarks pointed at the saved event after retiring Studio.
  const editEvent = params?.editEvent;
  const eventId = (Array.isArray(editEvent) ? editEvent[0] : editEvent)?.trim();
  if (eventId) permanentRedirect(`/event/${encodeURIComponent(eventId)}`);

  permanentRedirect("/envitefy-concierge");
}
