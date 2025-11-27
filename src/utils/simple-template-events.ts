// @ts-nocheck
import { buildEventPath } from "@/utils/event-url";

type OptionWithId = { id?: string } | { id: string };

const hasId = (value: any): value is OptionWithId =>
  typeof value === "object" && value !== null && "id" in value;

const normalizeOption = (
  incoming: string | undefined,
  options: OptionWithId[] | undefined,
  fallback: string | undefined
) => {
  if (!options?.length) return incoming || fallback;
  if (incoming && options.find((o) => o?.id === incoming)) return incoming;
  if (fallback && options.find((o) => o?.id === fallback)) return fallback;
  return options[0]?.id;
};

const extractDateTime = (existing: any) => {
  const startIso = existing?.startISO || existing?.start || existing?.startIso;
  if (!startIso) return {};
  const parsed = new Date(startIso);
  if (Number.isNaN(parsed.getTime())) return {};
  return {
    date: parsed.toISOString().split("T")[0],
    time: parsed.toISOString().slice(11, 16),
  };
};

export const hydrateTemplateFromHistory = async ({
  editEventId,
  themes,
  fonts,
  fontSizes,
  defaultThemeId,
  defaultHero,
  templateFieldKeys = [],
  setData,
  setAdvancedState,
  setThemeId,
  setLoading,
}: {
  editEventId?: string;
  themes: OptionWithId[];
  fonts?: OptionWithId[];
  fontSizes?: OptionWithId[];
  defaultThemeId?: string;
  defaultHero?: string;
  templateFieldKeys?: string[];
  setData: (updater: (prev: any) => any) => void;
  setAdvancedState?: (updater: (prev: any) => any) => void;
  setThemeId?: (id: string) => void;
  setLoading?: (loading: boolean) => void;
}) => {
  if (!editEventId) return;
  setLoading?.(true);
  try {
    const res = await fetch(`/api/history/${editEventId}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("[Edit] Failed to load event", res.status);
      return;
    }
    const json = await res.json();
    const existing = json?.data || {};

    const dateTime = extractDateTime(existing);
    const accessControl = existing?.accessControl || {};
    const mergedExtra = {
      ...(existing?.extra || {}),
      ...(existing?.customFields || {}),
    };
    const incomingAdvanced =
      existing?.advancedSections ||
      existing?.customFields?.advancedSections ||
      existing?.advanced ||
      {};

    const templateFields = Object.fromEntries(
      templateFieldKeys.map((key) => {
        const value =
          existing?.[key] ??
          mergedExtra?.[key] ??
          existing?.customFields?.[key] ??
          undefined;
        return [key, value];
      })
    );

    setData((prev) => ({
      ...prev,
      title: json?.title || existing?.title || prev?.title,
      date: existing?.date || dateTime?.date || prev?.date,
      time: existing?.time || dateTime?.time || prev?.time,
      city: existing?.city ?? prev?.city,
      state: existing?.state ?? prev?.state,
      venue: existing?.venue || existing?.location || prev?.venue,
      address: existing?.address ?? prev?.address,
      details:
        existing?.details || existing?.description || existing?.details || prev?.details,
      hero: existing?.heroImage || existing?.hero || prev?.hero || defaultHero,
      rsvpEnabled:
        typeof existing?.rsvpEnabled === "boolean"
          ? existing.rsvpEnabled
          : prev?.rsvpEnabled,
      rsvpDeadline:
        existing?.rsvpDeadline || existing?.rsvp || prev?.rsvpDeadline,
      fontId: normalizeOption(existing?.fontId, fonts, prev?.fontId),
      fontSize: normalizeOption(existing?.fontSize, fontSizes, prev?.fontSize),
      passcodeRequired:
        accessControl?.requirePasscode ?? prev?.passcodeRequired ?? false,
      passcode: prev?.passcode,
      extra: {
        ...prev?.extra,
        ...mergedExtra,
        ...templateFields,
      },
      ...templateFields,
    }));

    if (setAdvancedState && incomingAdvanced && Object.keys(incomingAdvanced).length) {
      setAdvancedState((prev) => ({ ...prev, ...incomingAdvanced }));
    }

    if (setThemeId && themes?.length) {
      const themeById =
        (existing?.themeId && themes.find((t) => t.id === existing.themeId)) ||
        (existing?.theme?.id && themes.find((t) => t.id === existing.theme?.id));
      const fallback =
        defaultThemeId || themes[0]?.id || (hasId(themes[0]) ? themes[0].id : "");
      setThemeId(themeById?.id || fallback || "default-theme");
    }
  } catch (err) {
    console.error("[Edit] Error loading event", err);
    alert("Failed to load event data. Please refresh and try again.");
  } finally {
    setLoading?.(false);
  }
};

export const prepareTemplatePayload = async ({
  data,
  config,
  advancedState,
  themes,
  fonts,
  fontSizes,
  themeId,
  location,
  defaultHero,
  templateFieldKeys = [],
  createdVia = "simple-template",
  defaultDurationHours = 2,
}: {
  data: any;
  config: any;
  advancedState?: any;
  themes: OptionWithId[];
  fonts?: OptionWithId[];
  fontSizes?: OptionWithId[];
  themeId?: string;
  location?: string;
  defaultHero?: string;
  templateFieldKeys?: string[];
  createdVia?: string;
  defaultDurationHours?: number;
}) => {
  let startISO: string | null = null;
  let endISO: string | null = null;
  if (data?.date) {
    const start = new Date(`${data.date}T${data.time || "14:00"}:00`);
    if (!Number.isNaN(start.getTime())) {
      const end = new Date(start);
      end.setHours(end.getHours() + defaultDurationHours);
      startISO = start.toISOString();
      endISO = end.toISOString();
    }
  }

  let heroToSave = data?.hero || defaultHero;
  if (heroToSave && /^blob:/i.test(heroToSave)) {
    try {
      const response = await fetch(heroToSave);
      const blob = await response.blob();
      const reader = new FileReader();
      heroToSave = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve((reader.result as string) || defaultHero);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.error("Failed to convert hero image", err);
      heroToSave = defaultHero;
    }
  }

  const validThemeId = normalizeOption(themeId, themes, themes?.[0]?.id);
  const resolvedTheme =
    (validThemeId && themes?.find((t) => t.id === validThemeId)) || themes?.[0];
  const resolvedFontId = normalizeOption(
    data?.fontId,
    fonts,
    fonts?.[0]?.id || data?.fontId
  );
  const resolvedFontSize = normalizeOption(
    data?.fontSize,
    fontSizes,
    fontSizes?.[0]?.id || data?.fontSize
  );

  const templateFieldExtras = Object.fromEntries(
    templateFieldKeys
      .map((key) => [key, data?.extra?.[key] ?? data?.[key]])
      .filter(([, value]) => value !== undefined && value !== null)
  );

  const mergedExtra = {
    ...(data?.extra || {}),
    ...templateFieldExtras,
  };

  const payload: any = {
    title: data?.title || config?.displayName,
    data: {
      category: config?.category,
      createdVia,
      createdManually: true,
      startISO,
      endISO,
      location: location || undefined,
      address: data?.address || undefined,
      venue: data?.venue || undefined,
      city: data?.city || undefined,
      state: data?.state || undefined,
      description: data?.details || undefined,
      rsvp: data?.rsvpEnabled ? data?.rsvpDeadline || undefined : undefined,
      rsvpEnabled: data?.rsvpEnabled,
      rsvpDeadline: data?.rsvpDeadline || undefined,
      numberOfGuests: 0,
      templateId: config?.slug,
      customFields: {
        ...mergedExtra,
        advancedSections: advancedState,
      },
      advancedSections: advancedState,
      heroImage: heroToSave || defaultHero,
      themeId: validThemeId,
      theme: resolvedTheme,
      fontId: resolvedFontId,
      fontSize: resolvedFontSize,
      ...(data?.fontFamily ? { fontFamily: data.fontFamily } : {}),
      ...(data?.fontSizeClass ? { fontSizeClass: data.fontSizeClass } : {}),
      ...(data?.time ? { time: data.time } : {}),
      ...(data?.date ? { date: data.date } : {}),
      ...(data?.passcodeRequired && data?.passcode
        ? {
            accessControl: {
              mode: "access-code",
              passcodePlain: data.passcode,
              requirePasscode: true,
            },
          }
        : data?.passcodeRequired === false
        ? {
            accessControl: {
              mode: "public",
              requirePasscode: false,
            },
          }
        : {}),
    },
  };

  return {
    payload,
    resolved: {
      themeId: validThemeId,
      fontId: resolvedFontId,
      fontSize: resolvedFontSize,
      hero: heroToSave,
    },
  };
};

export const saveTemplateEvent = async ({
  payload,
  editEventId,
  router,
  category,
}: {
  payload: any;
  editEventId?: string;
  router: any;
  category?: string;
}) => {
  if (editEventId) {
    const res = await fetch(`/api/history/${editEventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        title: payload.title,
        data: payload.data,
        category: category || payload?.data?.category,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Failed to update event");
    }
    router.push(
      buildEventPath(editEventId, payload.title, { updated: true, t: Date.now() })
    );
  } else {
    const res = await fetch("/api/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    const id = (json as any)?.id as string | undefined;
    if (!id) throw new Error("Failed to create event");
    router.push(buildEventPath(id, payload.title, { created: true }));
  }
};
