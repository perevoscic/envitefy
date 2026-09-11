function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/** An explicitly cleared field wins over older copies of the link. */
export function readCardRegistryLink(eventData: unknown): string {
  const data = asRecord(eventData);
  const studioCard = asRecord(data?.studioCard);
  const invitation = asRecord(studioCard?.invitationData);
  for (const source of [
    asRecord(invitation?.eventDetails),
    asRecord(studioCard?.eventDetails),
    asRecord(data?.eventDetails),
    data,
  ]) {
    if (typeof source?.registryLink === "string") return source.registryLink.trim();
  }
  if (typeof data?.giftRegistryLink === "string") return data.giftRegistryLink.trim();
  const registries = Array.isArray(data?.registries) ? data.registries : [];
  const registry = registries
    .map(asRecord)
    .find(
      (entry) =>
        typeof entry?.url === "string" &&
        (typeof entry.label !== "string" ||
          !entry.label.trim() ||
          /registry|gift/i.test(entry.label)),
    );
  return typeof registry?.url === "string" ? registry.url.trim() : "";
}

export function normalizeCardRegistryLink(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`);
    if (url.protocol !== "https:" || !url.hostname || url.username || url.password)
      throw new Error();
    return url.toString();
  } catch {
    throw new Error("Enter a valid registry link starting with https://.");
  }
}

/** Keep registry aliases aligned while preserving unrelated event links and settings. */
export function buildCardRegistryDataPatch(eventData: unknown, registryLink: string) {
  const data = asRecord(eventData);
  const previousLink = readCardRegistryLink(data);
  const registries = Array.isArray(data?.registries) ? data.registries : [];
  const isRegistryEntry = (entry: unknown) => {
    const link = asRecord(entry);
    return (
      typeof link?.url === "string" &&
      (typeof link.label !== "string" || !link.label.trim() || /registry|gift/i.test(link.label))
    );
  };
  const previousIndex = registries.findIndex(
    (entry) => isRegistryEntry(entry) && asRecord(entry)?.url === previousLink,
  );
  const registryIndex = previousIndex >= 0 ? previousIndex : registries.findIndex(isRegistryEntry);
  const nextRegistry = {
    ...asRecord(registries[registryIndex]),
    label: "Registry",
    url: registryLink,
  };
  const nextRegistries = registries.flatMap((entry, index) =>
    index === registryIndex ? (registryLink ? [nextRegistry] : []) : [entry],
  );
  if (registryIndex < 0 && registryLink) nextRegistries.push(nextRegistry);
  const details = asRecord(data?.eventDetails);
  const draft = asRecord(data?.conciergeDraft);
  return {
    registryLink,
    giftRegistryLink: registryLink,
    registries: nextRegistries,
    ...(details ? { eventDetails: { ...details, registryLink } } : {}),
    ...(draft
      ? {
          conciergeDraft: {
            ...draft,
            registryLink: registryLink || null,
            giftRegistryLink: registryLink || null,
          },
        }
      : {}),
  };
}

export function isRegistryOnlyCardEdit(fields: Record<string, string | undefined>): boolean {
  const keys = Object.keys(fields).filter((key) => fields[key] !== undefined);
  return keys.length > 0 && keys.every((key) => key === "registryLink");
}
