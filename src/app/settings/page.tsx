"use client";
import {
  CalendarDays,
  Camera,
  ChevronRight,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  isSportsKey,
  TEMPLATE_DEFINITIONS,
  TEMPLATE_KEYS,
  type TemplateKey,
} from "@/config/feature-visibility";
import {
  getCreateActionForSignupIntent,
  normalizeSignupIntent,
  SIGNUP_INTENTS,
  type SignupIntent,
} from "@/lib/signup-intent";
import {
  EMPTY_SPORT_PREFERENCES,
  getSportCreationLabel,
  isSportsCreationEnabled,
  normalizeSportPreferences,
  SPORT_PREFERENCE_OPTIONS,
  syncSportsVisibilityKeys,
  type SportPreferences,
} from "@/lib/sports-preferences";
import { notifyFeatureVisibilityChanged } from "@/hooks/useFeatureVisibility";
import { PROFILE_AVATAR_ACCEPT, validateProfileAvatarMeta } from "@/lib/profile-avatar";

type CalendarProvider = "google" | "microsoft" | "apple";
type SettingsSectionKey = "profile" | "calendars" | "security" | "creation";

const SETTINGS_SECTIONS: Array<{
  id: SettingsSectionKey;
  label: string;
  description: string;
  icon: LucideIcon;
}> = [
  { id: "profile", label: "Profile", description: "Name and account email", icon: UserRound },
  {
    id: "calendars",
    label: "Calendars",
    description: "Connections and defaults",
    icon: CalendarDays,
  },
  {
    id: "security",
    label: "Security",
    description: "Password and account access",
    icon: ShieldCheck,
  },
  {
    id: "creation",
    label: "Event creation",
    description: "Menus, sports and defaults",
    icon: Sparkles,
  },
];
type CalendarConnectionStatus = {
  google: boolean;
  microsoft: boolean;
  apple: boolean;
};

const CALENDAR_DEFAULT_STORAGE_KEY = "envitefy:event-actions:calendar-default:v1";
type ApiState<T> = { loading: boolean; error: string | null; data?: T };

export default function SettingsPage() {
  const { data: session } = useSession();

  // Profile form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [avatarState, setAvatarState] = useState<ApiState<{ ok?: boolean }>>({
    loading: false,
    error: null,
  });
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const avatarPreviewObjectUrlRef = useRef<string | null>(null);
  const [preferredProvider, setPreferredProvider] = useState<string>("");
  const [profileState, setProfileState] = useState<ApiState<{ ok?: boolean }>>({
    loading: false,
    error: null,
  });
  const [calendarState, setCalendarState] = useState<ApiState<{ ok?: boolean }>>({
    loading: false,
    error: null,
  });
  const [connectedCalendars, setConnectedCalendars] = useState<CalendarConnectionStatus>({
    google: false,
    microsoft: false,
    apple: false,
  });
  const autoClearedProviderRef = useRef<CalendarProvider | null>(null);
  const [connectionsLoading, setConnectionsLoading] = useState(false);
  const [visibleTemplateKeys, setVisibleTemplateKeys] = useState<TemplateKey[]>([...TEMPLATE_KEYS]);
  const [defaultCreateIntent, setDefaultCreateIntent] = useState<SignupIntent | "">("");
  const [featureVisibilitySaving, setFeatureVisibilitySaving] = useState(false);
  const [sportsCreationEnabled, setSportsCreationEnabled] = useState(true);
  const [sportPreferences, setSportPreferences] = useState<SportPreferences>({
    ...EMPTY_SPORT_PREFERENCES,
  });
  const [featureVisibilityMessage, setFeatureVisibilityMessage] = useState("");
  const [activeSettingsSection, setActiveSettingsSection] =
    useState<SettingsSectionKey>("profile");

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdState, setPwdState] = useState<ApiState<{ ok?: boolean }>>({
    loading: false,
    error: null,
  });

  const userEmail = useMemo(() => (session?.user?.email as string) || "", [session]);
  const settingsDisplayName = useMemo(() => {
    const profileName = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
    return profileName || session?.user?.name || userEmail || "Your account";
  }, [firstName, lastName, session?.user?.name, userEmail]);
  const settingsInitials = useMemo(() => {
    const parts = settingsDisplayName.split(/\s+/).filter(Boolean);
    if (!parts.length) return "A";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }, [settingsDisplayName]);
  const connectedCalendarCount = Object.values(connectedCalendars).filter(Boolean).length;
  const primarySportLabel = getSportCreationLabel(sportPreferences.primarySport);
  const displayedAvatarUrl = avatarPreviewUrl || avatarUrl;

  const clearAvatarPreview = useCallback(() => {
    if (avatarPreviewObjectUrlRef.current) {
      URL.revokeObjectURL(avatarPreviewObjectUrlRef.current);
      avatarPreviewObjectUrlRef.current = null;
    }
    setAvatarPreviewUrl(null);
  }, []);

  useEffect(
    () => () => {
      if (avatarPreviewObjectUrlRef.current) {
        URL.revokeObjectURL(avatarPreviewObjectUrlRef.current);
      }
    },
    [],
  );

  const notifyProfileChanged = useCallback((nextAvatarUrl: string | null) => {
    window.dispatchEvent(
      new CustomEvent("envitefy:profile-changed", { detail: { avatarUrl: nextAvatarUrl } }),
    );
  }, []);

  async function uploadAvatar(file: File) {
    setAvatarState({ loading: true, error: null });
    const previewUrl = URL.createObjectURL(file);
    clearAvatarPreview();
    avatarPreviewObjectUrlRef.current = previewUrl;
    setAvatarPreviewUrl(previewUrl);
    try {
      const body = new FormData();
      body.set("avatar", file);
      const res = await fetch("/api/user/profile/avatar", { method: "POST", body });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to upload profile image");
      const nextAvatarUrl = typeof json.avatarUrl === "string" ? json.avatarUrl : null;
      setAvatarUrl(nextAvatarUrl);
      setAvatarState({ loading: false, error: null, data: { ok: true } });
      notifyProfileChanged(nextAvatarUrl);
    } catch (error) {
      setAvatarState({
        loading: false,
        error: error instanceof Error ? error.message : "Failed to upload profile image",
      });
    } finally {
      clearAvatarPreview();
    }
  }

  function onAvatarSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const validation = validateProfileAvatarMeta(file);
    if (!validation.ok) {
      setAvatarState({ loading: false, error: validation.error });
      return;
    }
    void uploadAvatar(file);
  }

  async function removeAvatar() {
    setAvatarState({ loading: true, error: null });
    try {
      const res = await fetch("/api/user/profile/avatar", { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to remove profile image");
      clearAvatarPreview();
      setAvatarUrl(null);
      setAvatarState({ loading: false, error: null, data: { ok: true } });
      notifyProfileChanged(null);
    } catch (error) {
      setAvatarState({
        loading: false,
        error: error instanceof Error ? error.message : "Failed to remove profile image",
      });
    }
  }

  const selectSettingsSection = useCallback((section: SettingsSectionKey) => {
    setActiveSettingsSection(section);
    if (typeof window === "undefined") return;
    const hash = section === "creation" ? "your-sports" : section;
    window.history.replaceState(null, "", `${window.location.pathname}#${hash}`);
  }, []);

  useEffect(() => {
    const syncSectionFromHash = () => {
      const hash = window.location.hash.replace(/^#/, "");
      if (hash === "your-sports" || hash === "creation") {
        setActiveSettingsSection("creation");
      } else if (hash === "calendars" || hash === "security" || hash === "profile") {
        setActiveSettingsSection(hash);
      }
    };
    syncSectionFromHash();
    window.addEventListener("hashchange", syncSectionFromHash);
    return () => window.removeEventListener("hashchange", syncSectionFromHash);
  }, []);

  const normalizeProvider = (value: unknown): CalendarProvider | null => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim().toLowerCase();
    if (trimmed === "google" || trimmed === "microsoft" || trimmed === "apple") {
      return trimmed;
    }
    return null;
  };

  const mirrorLocalCalendarDefault = (provider: CalendarProvider | null) => {
    if (typeof window === "undefined") return;
    try {
      if (!provider) {
        window.localStorage.removeItem(CALENDAR_DEFAULT_STORAGE_KEY);
        return;
      }
      window.localStorage.setItem(CALENDAR_DEFAULT_STORAGE_KEY, provider);
    } catch {
      // ignore storage failures
    }
  };

  const preferredProviderInvalid =
    (preferredProvider === "google" && !connectedCalendars.google) ||
    (preferredProvider === "microsoft" && !connectedCalendars.microsoft);

  const togglePreferredProvider = (provider: CalendarProvider) => {
    if (provider === "google" && !connectedCalendars.google) return;
    if (provider === "microsoft" && !connectedCalendars.microsoft) return;
    setPreferredProvider((prev) => (prev === provider ? "" : provider));
    setCalendarState((prev) => ({ ...prev, error: null, data: undefined }));
  };

  const fetchConnectedCalendars = useCallback(async () => {
    setConnectionsLoading(true);
    try {
      const res = await fetch("/api/calendars", { credentials: "include" });
      if (!res.ok) {
        setConnectedCalendars({
          google: false,
          microsoft: false,
          apple: false,
        });
        return;
      }
      const json = await res.json().catch(() => ({}));
      setConnectedCalendars({
        google: Boolean(json?.google),
        microsoft: Boolean(json?.microsoft),
        apple: Boolean(json?.apple),
      });
    } catch {
      setConnectedCalendars({
        google: false,
        microsoft: false,
        apple: false,
      });
    } finally {
      setConnectionsLoading(false);
    }
  }, []);

  const handleCalendarConnect = useCallback(
    (provider: CalendarProvider) => {
      if (typeof window === "undefined") return;
      if (provider === "google") {
        window.open("/api/google/auth?source=settings", "_blank", "noopener,noreferrer");
      } else if (provider === "microsoft") {
        window.open("/api/outlook/auth?source=settings", "_blank", "noopener,noreferrer");
      } else {
        window.open(
          "https://support.apple.com/guide/calendar/welcome/mac",
          "_blank",
          "noopener,noreferrer",
        );
      }
      window.setTimeout(() => {
        void fetchConnectedCalendars();
      }, 4000);
    },
    [fetchConnectedCalendars],
  );

  async function saveCalendarDefault() {
    if (preferredProviderInvalid) {
      setCalendarState({
        loading: false,
        error: "Select a connected provider or clear the default.",
      });
      return;
    }
    setCalendarState({ loading: true, error: null });
    const normalized = normalizeProvider(preferredProvider);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferredProvider: normalized || null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || "Failed to save calendar default");
      }
      mirrorLocalCalendarDefault(normalized);
      setPreferredProvider(normalized || "");
      autoClearedProviderRef.current = null;
      setCalendarState({ loading: false, error: null, data: { ok: true } });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save calendar default";
      setCalendarState({ loading: false, error: message });
    }
  }

  useEffect(() => {
    let ignore = false;
    async function loadProfile() {
      try {
        const res = await fetch("/api/user/profile", { cache: "no-store" });
        if (!res.ok) throw new Error((await res.json()).error || "Failed to load profile");
        const json = await res.json();
        if (ignore) return;
        setFirstName(json.firstName || "");
        setLastName(json.lastName || "");
        setAvatarUrl(typeof json.avatarUrl === "string" ? json.avatarUrl : null);
        setPreferredProvider(normalizeProvider(json.preferredProvider) || "");
      } catch {
        // no-op; page still renders
      }
    }
    loadProfile();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    async function loadFeatureVisibility() {
      try {
        const res = await fetch("/api/user/feature-visibility", {
          cache: "no-store",
        });
        if (!res.ok) return;
        const json = await res.json();
        if (ignore) return;
        setVisibleTemplateKeys(
          Array.isArray(json?.visibleTemplateKeys)
            ? (json.visibleTemplateKeys as TemplateKey[])
            : [...TEMPLATE_KEYS],
        );
        setDefaultCreateIntent(normalizeSignupIntent(json?.defaultCreateIntent) || "");
        setSportsCreationEnabled(
          isSportsCreationEnabled(
            Array.isArray(json?.visibleTemplateKeys)
              ? (json.visibleTemplateKeys as TemplateKey[])
              : TEMPLATE_KEYS,
          ),
        );
        setSportPreferences(normalizeSportPreferences(json?.sportPreferences));
      } catch {
        // ignore
      }
    }
    loadFeatureVisibility();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    void fetchConnectedCalendars();
  }, [fetchConnectedCalendars]);

  useEffect(() => {
    const onFocus = () => {
      void fetchConnectedCalendars();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
    };
  }, [fetchConnectedCalendars]);

  useEffect(() => {
    const invalidProvider = preferredProviderInvalid ? normalizeProvider(preferredProvider) : null;
    if (!invalidProvider || invalidProvider === "apple") {
      autoClearedProviderRef.current = null;
      return;
    }
    if (autoClearedProviderRef.current === invalidProvider) return;
    autoClearedProviderRef.current = invalidProvider;

    let cancelled = false;
    setCalendarState({ loading: true, error: null });
    (async () => {
      try {
        const res = await fetch("/api/user/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preferredProvider: null }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json.error || "Failed to clear disconnected default");
        }
        if (cancelled) return;
        setPreferredProvider("");
        mirrorLocalCalendarDefault(null);
        setCalendarState({ loading: false, error: null, data: { ok: true } });
      } catch (err: unknown) {
        if (cancelled) return;
        autoClearedProviderRef.current = null;
        const message = err instanceof Error ? err.message : "Failed to clear disconnected default";
        setCalendarState({ loading: false, error: message });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [preferredProvider, preferredProviderInvalid]);

  async function onSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileState({ loading: true, error: null });
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to update profile");
      setProfileState({ loading: false, error: null, data: { ok: true } });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update";
      setProfileState({
        loading: false,
        error: message,
      });
    }
  }

  async function onChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!currentPassword) {
      setPwdState({ loading: false, error: "Current password is required" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdState({ loading: false, error: "Passwords do not match" });
      return;
    }
    setPwdState({ loading: true, error: null });
    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to change password");
      setPwdState({ loading: false, error: null, data: { ok: true } });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to change password";
      setPwdState({
        loading: false,
        error: message,
      });
    }
  }

  async function saveFeatureVisibility() {
    if (
      sportsCreationEnabled &&
      (!sportPreferences.primarySport ||
        !sportPreferences.enabledSports.includes(sportPreferences.primarySport))
    ) {
      setFeatureVisibilityMessage("Choose Primary for one of your enabled sports before saving.");
      return;
    }
    const normalizedPreferences = normalizeSportPreferences({
      ...sportPreferences,
      setupCompleted: sportsCreationEnabled ? true : sportPreferences.setupCompleted,
    });
    if (sportsCreationEnabled && !normalizedPreferences.setupCompleted) {
      setFeatureVisibilityMessage("Enable at least one sport and choose its Primary option.");
      return;
    }
    const nextVisibleTemplateKeys = syncSportsVisibilityKeys(
      visibleTemplateKeys,
      normalizedPreferences,
      sportsCreationEnabled,
    ) as TemplateKey[];
    setFeatureVisibilitySaving(true);
    setFeatureVisibilityMessage("");
    try {
      const res = await fetch("/api/user/feature-visibility", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visibleTemplateKeys: nextVisibleTemplateKeys,
          defaultCreateIntent: defaultCreateIntent || null,
          sportPreferences: normalizedPreferences,
          sportPreferenceSource: "settings",
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to update feature visibility");
      setVisibleTemplateKeys(nextVisibleTemplateKeys);
      setSportPreferences(normalizedPreferences);
      setFeatureVisibilityMessage("Create settings saved.");
      notifyFeatureVisibilityChanged();
    } catch (error) {
      setFeatureVisibilityMessage(
        error instanceof Error ? error.message : "Failed to update feature visibility",
      );
    } finally {
      setFeatureVisibilitySaving(false);
    }
  }

  async function resetPersonalization() {
    setFeatureVisibilitySaving(true);
    try {
      const res = await fetch("/api/user/feature-visibility", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visibleTemplateKeys: [...TEMPLATE_KEYS],
          defaultCreateIntent: null,
          sportPreferences: EMPTY_SPORT_PREFERENCES,
          sportPreferenceSource: "settings",
        }),
      });
      if (!res.ok) throw new Error("Failed to reset personalization");
      setVisibleTemplateKeys([...TEMPLATE_KEYS]);
      setDefaultCreateIntent("");
      setSportsCreationEnabled(true);
      setSportPreferences({ ...EMPTY_SPORT_PREFERENCES });
      setFeatureVisibilityMessage("Personalization reset. You’ll choose a sport next time.");
      notifyFeatureVisibilityChanged();
    } catch {
      // keep silent in settings UI
    } finally {
      setFeatureVisibilitySaving(false);
    }
  }

  return (
    <main className="min-h-screen w-full bg-[radial-gradient(circle_at_12%_0%,rgba(235,228,255,0.9),transparent_31%),radial-gradient(circle_at_92%_6%,rgba(224,246,255,0.8),transparent_28%)] px-4 py-7 text-foreground sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-6xl">
        <header className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-[linear-gradient(118deg,#251b36_0%,#48357a_58%,#315d73_100%)] p-6 text-white shadow-[0_26px_80px_rgba(47,33,76,0.2)] sm:p-8">
          <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-[#8e7cff]/25 blur-3xl" />
          <div className="absolute -bottom-28 left-1/3 h-52 w-52 rounded-full bg-[#6cdbff]/20 blur-3xl" />
          <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
            <div className="flex items-start gap-4">
              <span className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-white/12 text-lg font-black shadow-inner">
                {displayedAvatarUrl ? (
                  <Image
                    src={displayedAvatarUrl}
                    alt={`${settingsDisplayName} profile`}
                    fill
                    sizes="56px"
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  settingsInitials
                )}
              </span>
              <div>
                <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-white/60">
                  <Settings2 className="h-3.5 w-3.5" /> Account workspace
                </p>
                <h1 className="mt-2 text-3xl font-black tracking-tight !text-white sm:text-4xl">
                  Settings
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-white/70">
                  Keep your profile, calendar connections, security, and event creation preferences
                  organized in one place.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap lg:justify-end">
              <div className="rounded-xl border border-white/15 bg-white/10 px-3.5 py-2 backdrop-blur">
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/50">
                  Account
                </p>
                <p className="mt-0.5 max-w-40 truncate text-xs font-bold">{settingsDisplayName}</p>
              </div>
              <div className="rounded-xl border border-white/15 bg-white/10 px-3.5 py-2 backdrop-blur">
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/50">
                  Calendars
                </p>
                <p className="mt-0.5 text-xs font-bold">
                  {connectedCalendarCount ? `${connectedCalendarCount} connected` : "None connected"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => selectSettingsSection("creation")}
                className="col-span-2 rounded-xl border border-white/15 bg-white/10 px-3.5 py-2 text-left backdrop-blur transition hover:bg-white/15 sm:col-span-1"
              >
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/50">
                  Primary sport
                </p>
                <p className="mt-0.5 text-xs font-bold">
                  {sportPreferences.setupCompleted ? primarySportLabel : "Not selected"}
                </p>
              </button>
            </div>
          </div>
        </header>

        <div className="mt-6 grid items-start gap-5 lg:grid-cols-[15.5rem_minmax(0,1fr)]">
          <aside className="sticky top-4 z-10 rounded-2xl border border-[#e3dcf0] bg-white/90 p-2 shadow-[0_14px_45px_rgba(65,51,92,0.08)] backdrop-blur lg:p-3">
            <nav
              aria-label="Settings sections"
              className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-col"
            >
              {SETTINGS_SECTIONS.map((section) => {
                const Icon = section.icon;
                const active = activeSettingsSection === section.id;
                return (
                  <button
                    key={section.id}
                    type="button"
                    aria-current={active ? "page" : undefined}
                    onClick={() => selectSettingsSection(section.id)}
                    className={`group flex min-w-[9.5rem] items-center gap-3 rounded-xl px-3 py-3 text-left transition lg:min-w-0 ${
                      active
                        ? "bg-[#33264c] text-white shadow-[0_8px_24px_rgba(51,38,76,0.18)]"
                        : "text-[#50475d] hover:bg-[#f5f1fb] hover:text-[#2f2440]"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        active ? "bg-white/12 text-[#dcd4ff]" : "bg-[#f2eef9] text-[#7663a5]"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold">{section.label}</span>
                      <span
                        className={`hidden truncate text-[11px] lg:block ${
                          active ? "text-white/55" : "text-[#90869b]"
                        }`}
                      >
                        {section.description}
                      </span>
                    </span>
                    <ChevronRight
                      className={`hidden h-4 w-4 lg:block ${active ? "text-white/45" : "text-[#c4bbc9]"}`}
                    />
                  </button>
                );
              })}
            </nav>
            <div className="mt-3 hidden rounded-xl bg-[#f7f4fb] p-3 lg:block">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#8c7ea0]">
                Tip
              </p>
              <p className="mt-1 text-xs leading-5 text-[#6a6074]">
                Event creation preferences never hide or remove events you already own.
              </p>
            </div>
          </aside>

          <div className="min-w-0">
          {/* Profile (names) */}
          <section
            className={`${activeSettingsSection === "profile" ? "block" : "hidden"} space-y-6 rounded-[1.75rem] border border-[#e3dcf0] bg-white/95 p-5 shadow-[0_18px_55px_rgba(65,51,92,0.08)] sm:p-7`}
          >
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#7964ad]">
                Account details
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-[#251b32]">Profile</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Keep the name shown across your Envitefy workspace up to date.
              </p>
            </div>
            <div className="flex flex-col gap-4 rounded-2xl border border-[#e2d9f2] bg-[linear-gradient(145deg,#fbf9ff,#fff)] p-4 sm:flex-row sm:items-center sm:p-5">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[1.6rem] border-4 border-white bg-[linear-gradient(135deg,#6f59b1,#527d98)] shadow-[0_12px_30px_rgba(70,52,111,0.18)]">
                {displayedAvatarUrl ? (
                  <Image
                    src={displayedAvatarUrl}
                    alt={`${settingsDisplayName} profile`}
                    fill
                    sizes="96px"
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-2xl font-black text-white">
                    {settingsInitials}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-[#2f2440]">Profile image</h3>
                <p className="mt-1 text-xs leading-5 text-[#7d7387]">
                  Upload a JPG, PNG, or WebP image. We crop it to a square and optimize it for you.
                  Maximum file size: 5 MB.
                </p>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept={PROFILE_AVATAR_ACCEPT}
                  onChange={onAvatarSelected}
                  className="sr-only"
                  aria-label="Choose profile image"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={avatarState.loading}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#33264c] px-3.5 py-2 text-xs font-bold text-white transition hover:bg-[#473460] disabled:cursor-wait disabled:opacity-60"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    {avatarState.loading ? "Uploading…" : avatarUrl ? "Replace image" : "Upload image"}
                  </button>
                  {avatarUrl ? (
                    <button
                      type="button"
                      onClick={() => void removeAvatar()}
                      disabled={avatarState.loading}
                      className="inline-flex items-center gap-2 rounded-xl border border-[#ddd4e8] bg-white px-3.5 py-2 text-xs font-semibold text-[#6c5f76] transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  ) : null}
                </div>
                {avatarState.error ? (
                  <p role="alert" className="mt-2 text-xs font-medium text-red-600">
                    {avatarState.error}
                  </p>
                ) : null}
                {avatarState.data?.ok && !avatarState.error ? (
                  <p className="mt-2 text-xs font-medium text-emerald-700">
                    Profile image updated.
                  </p>
                ) : null}
              </div>
            </div>
            <form onSubmit={onSaveProfile} className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1">First name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full rounded-xl border border-[#d9cdfa] bg-[#fcfaff] px-3.5 py-2.5 text-sm outline-none transition focus:border-[#8f7ac4] focus:ring-4 focus:ring-[#8f7ac4]/10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full rounded-xl border border-[#d9cdfa] bg-[#fcfaff] px-3.5 py-2.5 text-sm outline-none transition focus:border-[#8f7ac4] focus:ring-4 focus:ring-[#8f7ac4]/10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={userEmail}
                  disabled
                  className="w-full cursor-not-allowed rounded-xl border border-[#e3dafd] bg-[#f4eeff] px-3.5 py-2.5 text-sm text-[#746a7d]"
                />
                <p className="mt-1.5 text-xs text-[#8b8292]">
                  Your sign-in email is managed with your account credentials.
                </p>
              </div>
              {profileState.error && <p className="text-sm text-red-600">{profileState.error}</p>}
              {profileState.data?.ok && <p className="text-sm text-green-600">Profile saved.</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={profileState.loading}
                  className="inline-flex items-center justify-center rounded-xl bg-[#33264c] px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(51,38,76,0.18)] transition hover:bg-[#473460] disabled:opacity-60"
                >
                  {profileState.loading ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </section>

          <section
            className={`${activeSettingsSection === "calendars" ? "block" : "hidden"} space-y-6 rounded-[1.75rem] border border-[#e3dcf0] bg-white/95 p-5 shadow-[0_18px_55px_rgba(65,51,92,0.08)] sm:p-7`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#7964ad]">
                  Connected services
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-[#251b32]">
                  Calendars
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Connect providers and choose your default calendar for event quick-add.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void fetchConnectedCalendars()}
                className="inline-flex items-center rounded-xl border border-[#d9cdfa] bg-[#fcfaff] px-3 py-2 text-xs font-semibold text-[#4f3f7a] transition hover:bg-[#f5eeff]"
                disabled={connectionsLoading}
              >
                {connectionsLoading ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                {
                  key: "google" as const,
                  label: "Google",
                  connected: connectedCalendars.google,
                },
                {
                  key: "apple" as const,
                  label: "Apple",
                  connected: connectedCalendars.apple,
                },
                {
                  key: "microsoft" as const,
                  label: "Outlook",
                  connected: connectedCalendars.microsoft,
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className="space-y-3 rounded-2xl border border-[#e5dcff] bg-[linear-gradient(145deg,#fff,#fbf9ff)] p-4 shadow-[0_8px_24px_rgba(80,61,121,0.05)]"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-[#2f1d47]">{item.label}</p>
                    <span
                      className={`text-xs rounded-full px-2 py-0.5 ${
                        item.connected
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-[#f1edff] text-[#6f5ba3]"
                      }`}
                    >
                      {item.connected ? "Connected" : "Not connected"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCalendarConnect(item.key)}
                    className="inline-flex w-full items-center justify-center rounded-xl border border-[#d9cdfa] bg-white px-3 py-2 text-xs font-semibold text-[#4f3f7a] transition hover:bg-[#f5eeff]"
                  >
                    {item.connected ? "Reconnect" : `Connect ${item.label}`}
                  </button>
                </div>
              ))}
            </div>

            <div className="space-y-4 rounded-2xl border border-[#e5dcff] bg-white p-4 sm:p-5">
              <p className="text-sm font-medium text-[#2f1d47]">Default calendar</p>
              <p className="text-xs text-[#7a6ca8]">
                Tap a provider to set default. Tap again to clear.
              </p>
              <div className="flex items-start gap-4">
                {[
                  {
                    key: "google" as const,
                    label: "Google",
                    connected: connectedCalendars.google,
                    glyph: "G",
                  },
                  {
                    key: "apple" as const,
                    label: "Apple",
                    connected: connectedCalendars.apple,
                    glyph: "A",
                  },
                  {
                    key: "microsoft" as const,
                    label: "Outlook",
                    connected: connectedCalendars.microsoft,
                    glyph: "O",
                  },
                ].map((item) => {
                  const isDefault = preferredProvider === item.key;
                  const isDisabled = item.key !== "apple" && !item.connected;
                  return (
                    <div key={item.key} className="flex flex-col items-center gap-1">
                      <button
                        type="button"
                        aria-pressed={isDefault}
                        disabled={isDisabled}
                        onClick={() => togglePreferredProvider(item.key)}
                        title={
                          isDefault
                            ? `Default is ${item.label}. Click to clear default`
                            : isDisabled
                              ? `${item.label} is not connected`
                              : `Set ${item.label} as default`
                        }
                        className={`relative flex h-12 w-12 items-center justify-center rounded-full border-2 text-sm font-semibold transition ${
                          isDefault
                            ? "border-[#b9a7ea] bg-[#f7f3ff] text-[#5a4699] shadow-[0_6px_16px_rgba(119,92,191,0.22)] ring-1 ring-[#d8ccf6]"
                            : isDisabled
                              ? "border-[#ebe5fb] bg-[#f8f6ff] text-[#b2a8d1]"
                              : "border-[#ddd3f5] bg-white text-[#8677b4] hover:border-[#c7b7ee] hover:bg-[#f8f5ff]"
                        }`}
                      >
                        {item.glyph}
                        {isDefault && (
                          <div className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-[#7c67be] flex items-center justify-center border-2 border-white shadow-sm">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 12 12"
                              fill="none"
                              className="h-2.5 w-2.5 text-white"
                              aria-hidden="true"
                            >
                              <path
                                d="M10 3L4.5 8.5L2 6"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                        )}
                      </button>
                      <span
                        className={`text-[11px] ${isDefault ? "text-[#4b3f72]" : "text-[#8f86b3]"}`}
                      >
                        {item.label}
                      </span>
                      {isDefault ? (
                        <span className="rounded-full bg-[#efe9ff] px-1.5 py-0.5 text-[10px] font-medium leading-none text-[#5a4699]">
                          Default
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              {preferredProviderInvalid && (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  Current default is disconnected. Clear or choose a connected provider.
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPreferredProvider("")}
                  className="inline-flex items-center rounded-xl border border-[#d9cdfa] bg-[#fcfaff] px-3 py-2 text-xs font-semibold text-[#4f3f7a] transition hover:bg-[#f5eeff]"
                >
                  Clear default
                </button>
                <button
                  type="button"
                  onClick={() => void saveCalendarDefault()}
                  disabled={calendarState.loading}
                  className="inline-flex items-center rounded-xl bg-[#33264c] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#473460] disabled:opacity-60"
                >
                  {calendarState.loading ? "Saving..." : "Save calendar default"}
                </button>
              </div>

              {calendarState.error && <p className="text-xs text-red-600">{calendarState.error}</p>}
              {calendarState.data?.ok && (
                <p className="text-xs text-green-600">Calendar default saved.</p>
              )}
            </div>
          </section>

          {/* Security */}
          <section
            className={`${activeSettingsSection === "security" ? "block" : "hidden"} space-y-6 rounded-[1.75rem] border border-[#e3dcf0] bg-white/95 p-5 shadow-[0_18px_55px_rgba(65,51,92,0.08)] sm:p-7`}
          >
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#7964ad]">
                Account access
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-[#251b32]">Security</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Use a strong password that you don’t reuse on other services.
              </p>
            </div>
            <form onSubmit={onChangePassword} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1">Current password</label>
                <input
                  name="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-xl border border-[#d9cdfa] bg-[#fcfaff] px-3.5 py-2.5 text-sm outline-none transition focus:border-[#8f7ac4] focus:ring-4 focus:ring-[#8f7ac4]/10"
                  autoComplete="current-password"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1">New password</label>
                  <input
                    name="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-[#d9cdfa] bg-[#fcfaff] px-3.5 py-2.5 text-sm outline-none transition focus:border-[#8f7ac4] focus:ring-4 focus:ring-[#8f7ac4]/10"
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Confirm new password</label>
                  <input
                    name="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-[#d9cdfa] bg-[#fcfaff] px-3.5 py-2.5 text-sm outline-none transition focus:border-[#8f7ac4] focus:ring-4 focus:ring-[#8f7ac4]/10"
                    autoComplete="new-password"
                  />
                </div>
              </div>
              {pwdState.error && <p className="text-sm text-red-600">{pwdState.error}</p>}
              {pwdState.data?.ok && <p className="text-sm text-green-600">Password changed.</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={pwdState.loading}
                  className="inline-flex items-center justify-center rounded-xl bg-[#33264c] px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(51,38,76,0.18)] transition hover:bg-[#473460] disabled:opacity-60"
                >
                  {pwdState.loading ? "Saving..." : "Change password"}
                </button>
              </div>
            </form>
          </section>

          <section
            className={`${activeSettingsSection === "creation" ? "block" : "hidden"} space-y-6 rounded-[1.75rem] border border-[#dcd3ee] bg-gradient-to-br from-white via-[#fcfaff] to-[#f4efff] p-5 shadow-[0_18px_55px_rgba(65,51,92,0.08)] sm:p-7`}
          >
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#7964ad]">
                Workspace preferences
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-[#251b32]">
                Event creation
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Focus your create menu on the event types and sports you actually manage.
              </p>
            </div>
            <label className="block space-y-1">
              <span className="text-sm font-medium text-[#2f1d47]">Default create type</span>
              <select
                value={defaultCreateIntent}
                onChange={(event) =>
                  setDefaultCreateIntent(normalizeSignupIntent(event.target.value) || "")
                }
                className="w-full rounded-xl border border-[#d9cdfa] bg-white px-3.5 py-2.5 text-sm text-[#2f1d47] outline-none transition focus:border-[#8f7ac4] focus:ring-4 focus:ring-[#8f7ac4]/10"
              >
                <option value="">Create Event</option>
                {SIGNUP_INTENTS.filter((intent) => intent !== "snap").map((intent) => {
                  const action = getCreateActionForSignupIntent(intent);
                  if (!action) return null;
                  return (
                    <option key={intent} value={intent}>
                      {action.label}
                    </option>
                  );
                })}
              </select>
            </label>

            <div>
              <h3 className="text-sm font-semibold text-[#2f1d47]">Create menu event types</h3>
              <p className="text-sm text-muted-foreground">
                Choose which event types appear in your create menus.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {TEMPLATE_DEFINITIONS.filter((template) => !isSportsKey(template.key)).map((template) => (
                <label
                  key={template.key}
                  className="flex items-center gap-2.5 rounded-xl border border-[#e5dcff] bg-white px-3 py-2.5 text-sm font-medium text-[#2f1d47] transition hover:border-[#cec1ed] hover:bg-[#fcfaff]"
                >
                  <input
                    type="checkbox"
                    checked={visibleTemplateKeys.includes(template.key)}
                    onChange={(e) => {
                      setVisibleTemplateKeys((prev) => {
                        if (e.target.checked) {
                          if (prev.includes(template.key)) return prev;
                          return [...prev, template.key];
                        }
                        return prev.filter((k) => k !== template.key);
                      });
                    }}
                  />
                  <span>{template.label}</span>
                </label>
              ))}
            </div>

            <div
              id="your-sports"
              className="space-y-4 rounded-2xl border border-[#ddd4f5] bg-white p-4 shadow-[0_10px_30px_rgba(73,58,118,0.05)] sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-[#2f1d47]">Sports creation</h3>
                    <span className="rounded-full bg-[#eee9fb] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] text-[#6c5a96]">
                      {sportPreferences.enabledSports.length} selected
                    </span>
                  </div>
                  <p className="mt-1 max-w-lg text-sm text-muted-foreground">
                    Keep your create menu focused on the sports you manage. This never hides or
                    removes existing events.
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 rounded-full bg-[#f4f1ff] px-3 py-2 text-sm font-semibold text-[#493a76]">
                  <input
                    type="checkbox"
                    checked={sportsCreationEnabled}
                    onChange={(event) => {
                      setSportsCreationEnabled(event.target.checked);
                      setFeatureVisibilityMessage("");
                    }}
                  />
                  {sportsCreationEnabled ? "Sports on" : "Sports off"}
                </label>
              </div>

              <div className={sportsCreationEnabled ? "space-y-3" : "space-y-3 opacity-55"}>
                <div>
                  <h4 className="text-sm font-semibold text-[#2f1d47]">Your sports</h4>
                  <p className="text-xs leading-5 text-muted-foreground">
                    Check every sport you use, then mark exactly one as Primary. Your primary sport
                    is the one shown in Create Event.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {SPORT_PREFERENCE_OPTIONS.map((sport) => {
                    const enabled = sportPreferences.enabledSports.includes(sport.key);
                    const primary = sportPreferences.primarySport === sport.key;
                    return (
                      <div
                        key={sport.key}
                        className={`flex min-h-12 items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-sm transition ${
                          enabled
                            ? "border-[#bfb1e8] bg-[#f7f3ff] text-[#2f1d47] shadow-[0_5px_15px_rgba(86,65,134,0.06)]"
                            : "border-[#e8e2f1] bg-white text-[#62586d] hover:border-[#d3c8e4] hover:bg-[#fcfaff]"
                        }`}
                      >
                        <label className="flex min-w-0 flex-1 items-center gap-2 font-medium">
                          <input
                            type="checkbox"
                            disabled={!sportsCreationEnabled}
                            checked={enabled}
                            onChange={(event) => {
                              setFeatureVisibilityMessage("");
                              setSportPreferences((current) => {
                                if (event.target.checked) {
                                  const enabledSports = current.enabledSports.includes(sport.key)
                                    ? current.enabledSports
                                    : [...current.enabledSports, sport.key];
                                  return {
                                    ...current,
                                    enabledSports,
                                    primarySport: current.primarySport || sport.key,
                                  };
                                }
                                return {
                                  ...current,
                                  enabledSports: current.enabledSports.filter(
                                    (item) => item !== sport.key,
                                  ),
                                  primarySport: primary ? null : current.primarySport,
                                };
                              });
                            }}
                          />
                          <span>{sport.label}</span>
                        </label>
                        {enabled ? (
                          <label className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-[#6558a5]">
                            <input
                              type="radio"
                              name="primary-sport"
                              disabled={!sportsCreationEnabled}
                              checked={primary}
                              onChange={() => {
                                setSportPreferences((current) => ({
                                  ...current,
                                  primarySport: sport.key,
                                }));
                                setFeatureVisibilityMessage("");
                              }}
                            />
                            <span className="hidden 2xl:inline">Primary</span>
                          </label>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
                {!sportsCreationEnabled && sportPreferences.enabledSports.length ? (
                  <p className="text-xs text-[#655b70]">
                    Saved selections: {sportPreferences.enabledSports.map(getSportCreationLabel).join(", ")}.
                  </p>
                ) : null}
              </div>
            </div>

            {featureVisibilityMessage ? (
              <p
                className={`text-sm font-medium ${
                  featureVisibilityMessage.includes("saved") ||
                  featureVisibilityMessage.includes("reset")
                    ? "text-emerald-700"
                    : "text-red-600"
                }`}
              >
                {featureVisibilityMessage}
              </p>
            ) : null}

            <div className="sticky bottom-3 z-10 flex flex-wrap gap-2 rounded-2xl border border-[#e0d8ed] bg-white/90 p-3 shadow-[0_14px_35px_rgba(51,38,76,0.12)] backdrop-blur">
              <button
                type="button"
                onClick={saveFeatureVisibility}
                disabled={featureVisibilitySaving}
                className="inline-flex items-center justify-center rounded-xl bg-[#33264c] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#473460] disabled:opacity-60"
              >
                {featureVisibilitySaving ? "Saving..." : "Save create settings"}
              </button>
              <button
                type="button"
                onClick={resetPersonalization}
                disabled={featureVisibilitySaving}
                className="inline-flex items-center justify-center rounded-xl border border-[#d9cdfa] bg-white px-4 py-2.5 text-sm font-semibold text-[#4f3f7a] transition hover:bg-[#f5eeff] disabled:opacity-60"
              >
                Reset personalization
              </button>
            </div>
          </section>
        </div>
        </div>
      </section>
    </main>
  );
}
