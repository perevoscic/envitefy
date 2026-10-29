"use client";
import { writeLocalCalendarDefault } from "@/lib/calendar-preference";

import { CONNECTED_CALENDAR_SYNC_ENABLED, CALENDAR_SYNC_PAUSED_MESSAGE } from "@/config/calendar-sync";
import * as Dialog from "@radix-ui/react-dialog";
import {
  CalendarDays,
  Bookmark,
  ArrowLeft,
  Camera,
  Check,
  ChevronRight,
  LockKeyhole,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Sparkles,
  Unplug,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
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
import { MobileActionBar } from "@/components/ui/MobileActionBar";
import AppleCalendarConnection, { type AppleCalendarStatus } from "@/components/AppleCalendarConnection";
import ProfileAccountDeletion from "@/components/account/ProfileAccountDeletion";
import CreationAccessSettings from "@/components/account/CreationAccessSettings";
import { UNIFIED_CREATION_ENABLED } from "@/lib/create/release";
import AppearanceSelector from "@/components/AppearanceSelector";
import CategoryFavoritesSettings from "@/components/account/CategoryFavoritesSettings";
import styles from "./settings-workspace.module.css";

type CalendarProvider = "google" | "microsoft" | "apple";
type ConnectedCalendarProvider = Exclude<CalendarProvider, "apple">;
type SettingsSectionKey = "profile" | "calendars" | "security" | "creation" | "appearance" | "favorites";

const SETTINGS_SECTIONS: Array<{
  id: SettingsSectionKey;
  label: string;
  group: "Account" | "Workspace" | "Connections";
  icon: LucideIcon;
}> = [
  { id: "profile", label: "Profile", group: "Account", icon: UserRound },
  { id: "security", label: "Sign-in & security", group: "Account", icon: ShieldCheck },
  { id: "appearance", label: "Appearance", group: "Workspace", icon: Settings2 },
  { id: "favorites", label: "Favorites", group: "Workspace", icon: Bookmark },
  {
    id: "calendars",
    label: "Calendars",
    group: "Connections",
    icon: CalendarDays,
  },
  {
    id: "creation",
    label: "Creation tools & access",
    group: "Workspace",
    icon: Sparkles,
  },
];
type CalendarConnectionStatus = {
  google: boolean;
  microsoft: boolean;
  apple: boolean;
};

type ApiState<T> = { loading: boolean; error: string | null; data?: T };
type CalendarConnectionMessage = { kind: "success" | "error"; text: string };

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const identity = session?.user?.email || (session?.user as { id?: string } | undefined)?.id || "";
  return <SettingsWorkspace key={`${status}:${identity}`} />;
}

function SettingsWorkspace() {
  const settingsSectionQuery = useSearchParams()?.get("section") || "";
  const { data: session, status: sessionStatus } = useSession();

  // Profile form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [savedProfile, setSavedProfile] = useState({ firstName: "", lastName: "" });
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [profileReload, setProfileReload] = useState(0);
  const [pendingAvatar, setPendingAvatar] = useState<File | null>(null);
  const [avatarRemoved, setAvatarRemoved] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);
  const [avatarState, setAvatarState] = useState<ApiState<{ ok?: boolean }>>({
    loading: false,
    error: null,
  });
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const avatarPreviewObjectUrlRef = useRef<string | null>(null);
  const profileRequestRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  const [mobileSettingsView, setMobileSettingsView] = useState<"list" | "detail">("list");
  const sectionHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const navButtonRefs = useRef<Partial<Record<SettingsSectionKey, HTMLButtonElement | null>>>({});
  const focusSectionRef = useRef(false);
  const [preferredProvider, setPreferredProvider] = useState<string>("");
  const [calendarDefaultLoading, setCalendarDefaultLoading] = useState(true);
  const calendarDefaultSavingRef = useRef(false);
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
  const [appleSubscriptionStatus, setAppleSubscriptionStatus] = useState<AppleCalendarStatus>({ ready: false, connected: false });
  const appleStatusVersionRef = useRef(0);
  const handleAppleStatusChange = useCallback((status: AppleCalendarStatus) => {
    appleStatusVersionRef.current++;
    setAppleSubscriptionStatus(status);
  }, []);
  const [calendarAccountEmails, setCalendarAccountEmails] = useState<
    Record<ConnectedCalendarProvider, string | null>
  >({ google: null, microsoft: null });
  const [connectionsLoading, setConnectionsLoading] = useState(false);
  const [connectionsVerified, setConnectionsVerified] = useState(false);
  const calendarRequestRef = useRef(0);
  const [disconnectingProvider, setDisconnectingProvider] =
    useState<ConnectedCalendarProvider | null>(null);
  const [disconnectPromptProvider, setDisconnectPromptProvider] =
    useState<ConnectedCalendarProvider | null>(null);
  const [disconnectPromptError, setDisconnectPromptError] = useState<string | null>(null);
  const [calendarConnectionMessage, setCalendarConnectionMessage] =
    useState<CalendarConnectionMessage | null>(null);
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
    const profileName = [savedProfile.firstName.trim(), savedProfile.lastName.trim()].filter(Boolean).join(" ");
    return profileName || session?.user?.name || userEmail || "Your account";
  }, [savedProfile, session?.user?.name, userEmail]);
  const settingsInitials = useMemo(() => {
    const parts = settingsDisplayName.split(/\s+/).filter(Boolean);
    if (!parts.length) return "A";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }, [settingsDisplayName]);
  const displayedAvatarUrl = avatarRemoved ? null : avatarPreviewUrl || avatarUrl;
  const profileDirty = firstName !== savedProfile.firstName || lastName !== savedProfile.lastName || Boolean(pendingAvatar) || avatarRemoved;
  const activeSection = SETTINGS_SECTIONS.find((section) => section.id === activeSettingsSection)!;

  const clearAvatarPreview = useCallback(() => {
    if (avatarPreviewObjectUrlRef.current) {
      URL.revokeObjectURL(avatarPreviewObjectUrlRef.current);
      avatarPreviewObjectUrlRef.current = null;
    }
    setAvatarPreviewUrl(null);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      profileRequestRef.current?.abort();
      if (avatarPreviewObjectUrlRef.current) {
        URL.revokeObjectURL(avatarPreviewObjectUrlRef.current);
      }
    };
  }, []);

  const notifyProfileChanged = useCallback((nextAvatarUrl: string | null) => {
    window.dispatchEvent(
      new CustomEvent("envitefy:profile-changed", { detail: { avatarUrl: nextAvatarUrl } }),
    );
  }, []);

  function onAvatarSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const validation = validateProfileAvatarMeta(file);
    if (!validation.ok) {
      setAvatarState({ loading: false, error: validation.error });
      return;
    }
    if (profileState.loading || !profileLoaded) return;
    clearAvatarPreview();
    const previewUrl = URL.createObjectURL(file);
    avatarPreviewObjectUrlRef.current = previewUrl;
    setAvatarPreviewUrl(previewUrl);
    setPendingAvatar(file);
    setAvatarRemoved(false);
    setFailedAvatarUrl(null);
    setAvatarState({ loading: false, error: null });
    setProfileState({ loading: false, error: null });
  }

  function removeAvatar() {
    if (profileState.loading || !profileLoaded) return;
    clearAvatarPreview();
    setPendingAvatar(null);
    setAvatarRemoved(Boolean(avatarUrl));
    setAvatarState({ loading: false, error: null });
    setProfileState({ loading: false, error: null });
  }

  function cancelProfileChanges() {
    if (profileState.loading) return;
    setFirstName(savedProfile.firstName);
    setLastName(savedProfile.lastName);
    setPendingAvatar(null);
    setAvatarRemoved(false);
    clearAvatarPreview();
    setFailedAvatarUrl(null);
    setAvatarState({ loading: false, error: null });
    setProfileState({ loading: false, error: null });
  }

  const selectSettingsSection = useCallback((section: SettingsSectionKey) => {
    setActiveSettingsSection(section);
    setMobileSettingsView("detail");
    focusSectionRef.current = true;
    if (typeof window === "undefined") return;
    const hash = section === "creation" ? "your-sports" : section;
    const url = new URL(window.location.href);
    url.hash = hash;
    window.history.pushState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, []);

  const showSettingsList = () => {
    setMobileSettingsView("list");
    const url = new URL(window.location.href);
    url.hash = "";
    url.searchParams.delete("section");
    window.history.pushState(null, "", `${url.pathname}${url.search}`);
    requestAnimationFrame(() => navButtonRefs.current[activeSettingsSection]?.focus());
  };

  useEffect(() => {
    if (focusSectionRef.current && mobileSettingsView === "detail") {
      sectionHeadingRef.current?.focus({ preventScroll: true });
      focusSectionRef.current = false;
    }
  }, [activeSettingsSection, mobileSettingsView]);

  useEffect(() => {
    const syncSectionFromHash = () => {
      const hash = window.location.hash.replace(/^#/, "") || settingsSectionQuery;
      if (hash === "your-sports" || hash === "creation") {
        setActiveSettingsSection("creation");
        setMobileSettingsView("detail");
      } else if (hash === "calendars" || hash === "security" || hash === "profile" || hash === "appearance" || hash === "favorites") {
        setActiveSettingsSection(hash);
        setMobileSettingsView("detail");
      } else setMobileSettingsView("list");
    };
    syncSectionFromHash();
    window.addEventListener("hashchange", syncSectionFromHash);
    window.addEventListener("popstate", syncSectionFromHash);
    return () => {
      window.removeEventListener("hashchange", syncSectionFromHash);
      window.removeEventListener("popstate", syncSectionFromHash);
    };
  }, [settingsSectionQuery]);

  const normalizeProvider = (value: unknown): CalendarProvider | null => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim().toLowerCase();
    if (trimmed === "google" || trimmed === "microsoft" || trimmed === "apple") {
      return trimmed;
    }
    return null;
  };

  const mirrorLocalCalendarDefault = (provider: CalendarProvider | null) => {
    writeLocalCalendarDefault(provider);
  };

  const normalizedPreferredProvider = normalizeProvider(preferredProvider);
  const preferredProviderInvalid = Boolean(
    normalizedPreferredProvider && !connectedCalendars[normalizedPreferredProvider],
  );

  const fetchConnectedCalendars = useCallback(async () => {
    const requestId = ++calendarRequestRef.current;
    const appleStatusVersion = appleStatusVersionRef.current;
    setConnectionsLoading(true);
    try {
      const res = await fetch("/api/calendars?includeAccounts=1", { credentials: "include", cache: "no-store" });
      if (!res.ok) {
        throw new Error("Calendar connections could not be verified");
      }
      const json = await res.json();
      if (requestId !== calendarRequestRef.current) return;
      // A setup/disconnect completed while this request was pending; keep its newer status.
      if (appleStatusVersion === appleStatusVersionRef.current && json?.appleSubscription) {
        setAppleSubscriptionStatus({
          ready: Boolean(json.appleSubscription.ready),
          connected: Boolean(json.appleSubscription.connected),
        });
      }
      setConnectedCalendars({
        google: Boolean(json?.google),
        microsoft: Boolean(json?.microsoft),
        apple: Boolean(json?.apple),
      });
      setCalendarAccountEmails({
        google: json?.google && typeof json?.accountEmails?.google === "string"
          ? json.accountEmails.google : null,
        microsoft: json?.microsoft && typeof json?.accountEmails?.microsoft === "string"
          ? json.accountEmails.microsoft : null,
      });
      setConnectionsVerified(true);
    } catch {
      if (requestId !== calendarRequestRef.current) return;
      setConnectionsVerified(false);
      setCalendarConnectionMessage({
        kind: "error", text: "Calendar connections could not be checked. Please try Refresh again.",
      });
    } finally {
      if (requestId === calendarRequestRef.current) setConnectionsLoading(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const googleAuth = params.get("googleAuth");
    if (!googleAuth) return;

    setActiveSettingsSection("calendars");
    setMobileSettingsView("detail");
    if (googleAuth === "stored") {
      setCalendarConnectionMessage({
        kind: "success",
        text: "Google Calendar connected. New scanned events can now be added automatically.",
      });
    } else {
      const reason = params.get("googleAuthReason");
      const text =
        reason === "missing-calendar-scope"
          ? "Google Calendar permission was not granted. Reconnect and approve event access."
          : reason === "missing-refresh-token"
            ? "Google did not return offline calendar access. Reconnect and approve access again."
            : "Google Calendar could not be connected. Please reconnect and try again.";
      setCalendarConnectionMessage({ kind: "error", text });
    }

    window.history.replaceState(null, "", `${window.location.pathname}#calendars`);
  }, []);

  const handleCalendarConnect = useCallback(
    (provider: ConnectedCalendarProvider) => {
      if (!CONNECTED_CALENDAR_SYNC_ENABLED) return;
      if (typeof window === "undefined") return;
      if (provider === "google") {
        const next = encodeURIComponent("/settings#calendars");
        window.open(
          `/api/google/auth?consent=1&next=${next}`,
          "_blank",
          "noopener,noreferrer",
        );
      } else if (provider === "microsoft") {
        window.open("/api/outlook/auth?source=settings", "_blank", "noopener,noreferrer");
      }
    },
    [],
  );

  async function disconnectCalendar(provider: ConnectedCalendarProvider) {
    const label = provider === "google" ? "Google Calendar" : "Outlook";
    setDisconnectingProvider(provider);
    setDisconnectPromptError(null);
    setCalendarConnectionMessage(null);
    try {
      const response = await fetch("/api/oauth/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ provider }),
      });
      const payload: { error?: string } = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || `Could not disconnect ${label}`);
      }

      // Discard any older status read so it cannot restore this connection.
      calendarRequestRef.current++;
      setConnectionsLoading(false);
      setConnectedCalendars((current) => ({ ...current, [provider]: false }));
      setCalendarAccountEmails((current) => ({ ...current, [provider]: null }));
      if (preferredProvider === provider) {
        setPreferredProvider("");
        mirrorLocalCalendarDefault(null);
      }
      setCalendarConnectionMessage({
        kind: "success",
        text: `${label} disconnected from this Envitefy account.`,
      });
      setDisconnectPromptProvider(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : `Could not disconnect ${label}`;
      setDisconnectPromptError(message);
      setCalendarConnectionMessage({
        kind: "error",
        text: message,
      });
    } finally {
      setDisconnectingProvider(null);
    }
  }

  async function saveCalendarDefault(provider: ConnectedCalendarProvider | null) {
    if (calendarDefaultSavingRef.current || calendarState.loading || calendarDefaultLoading || connectionsLoading || !connectionsVerified || disconnectingProvider) return;
    if (provider && !connectedCalendars[provider]) return;
    calendarDefaultSavingRef.current = true;
    setCalendarState({ loading: true, error: null });
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferredProvider: provider,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || "Failed to save calendar default");
      }
      mirrorLocalCalendarDefault(provider);
      setPreferredProvider(provider || "");
      autoClearedProviderRef.current = null;
      setCalendarState({ loading: false, error: null, data: { ok: true } });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save calendar default";
      setCalendarState({ loading: false, error: message });
    } finally {
      calendarDefaultSavingRef.current = false;
    }
  }

  useEffect(() => {
    let ignore = false;
    async function loadProfile() {
      if (sessionStatus !== "authenticated") return;
      setProfileState({ loading: false, error: null });
      try {
        const res = await fetch("/api/user/profile", { cache: "no-store" });
        if (!res.ok) throw new Error((await res.json()).error || "Failed to load profile");
        const json = await res.json();
        if (ignore) return;
        setFirstName(json.firstName || "");
        setLastName(json.lastName || "");
        setSavedProfile({ firstName: json.firstName || "", lastName: json.lastName || "" });
        setProfileLoaded(true);
        setAvatarUrl(typeof json.avatarUrl === "string" ? json.avatarUrl : null);
        setPreferredProvider(normalizeProvider(json.preferredProvider) || "");
      } catch (error) {
        if (!ignore) setProfileState({ loading: false, error: error instanceof Error ? error.message : "Failed to load profile" });
      } finally {
        if (!ignore) setCalendarDefaultLoading(false);
      }
    }
    loadProfile();
    return () => {
      ignore = true;
    };
  }, [sessionStatus, profileReload]);

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
    setConnectedCalendars({ google: false, microsoft: false, apple: false });
    appleStatusVersionRef.current++;
    setAppleSubscriptionStatus({ ready: false, connected: false });
    setCalendarAccountEmails({ google: null, microsoft: null });
    setConnectionsVerified(false);
    if (sessionStatus === "authenticated") void fetchConnectedCalendars();
    return () => { calendarRequestRef.current++; };
  }, [fetchConnectedCalendars, sessionStatus, session?.user?.email]);

  useEffect(() => {
    if (connectionsLoading || !connectionsVerified) return;
    const invalidProvider = preferredProviderInvalid ? normalizeProvider(preferredProvider) : null;
    if (!invalidProvider) {
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
  }, [connectionsLoading, connectionsVerified, preferredProvider, preferredProviderInvalid]);

  async function onSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!profileLoaded || !profileDirty || profileRequestRef.current) return;
    const controller = new AbortController();
    profileRequestRef.current = controller;
    setProfileState({ loading: true, error: null });
    try {
      const body = new FormData();
      body.set("firstName", firstName);
      body.set("lastName", lastName);
      body.set("avatarAction", pendingAvatar ? "replace" : avatarRemoved ? "remove" : "keep");
      if (pendingAvatar) body.set("avatar", pendingAvatar);
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        body,
        signal: controller.signal,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to update profile");
      if (!mountedRef.current || controller.signal.aborted) return;
      if (json.ok !== true || (json.avatarUrl !== null && typeof json.avatarUrl !== "string")) {
        throw new Error("Profile save could not be confirmed. Please try again.");
      }
      const nextProfile = { firstName: json.firstName || "", lastName: json.lastName || "" };
      setFirstName(nextProfile.firstName);
      setLastName(nextProfile.lastName);
      setSavedProfile(nextProfile);
      setAvatarUrl(json.avatarUrl);
      setPendingAvatar(null);
      setAvatarRemoved(false);
      clearAvatarPreview();
      setAvatarState({ loading: false, error: null });
      setProfileState({ loading: false, error: null, data: { ok: true } });
      notifyProfileChanged(json.avatarUrl);
    } catch (err: unknown) {
      if (!mountedRef.current || controller.signal.aborted) return;
      const message = err instanceof Error ? err.message : "Failed to update";
      setProfileState({
        loading: false,
        error: message,
      });
    } finally {
      if (profileRequestRef.current === controller) profileRequestRef.current = null;
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
    <main data-mobile-form-surface data-settings-canvas data-settings-view={mobileSettingsView} className={styles.canvas}>
      <div className={styles.workspace}>
        <header className={styles.header}>
          <h1 className={styles.pageTitle}>Settings</h1>
          <div className={styles.account}>
            <span className={styles.accountAvatar} aria-hidden="true">
              {avatarUrl && avatarUrl !== failedAvatarUrl ? (
                <Image src={avatarUrl} alt="" fill sizes="40px" unoptimized className="object-cover" onError={() => setFailedAvatarUrl(avatarUrl)} />
              ) : settingsInitials}
            </span>
            <span className={styles.accountName}>{settingsDisplayName}</span>
          </div>
        </header>

        <div className={styles.layout}>
          <aside className={styles.navigation}>
            <nav aria-label="Settings sections">
              {(["Account", "Workspace", "Connections"] as const).map((group) => (
                <div key={group} className={styles.navGroup}>
                  <h2 className={styles.navGroupTitle}>{group}</h2>
                  {SETTINGS_SECTIONS.filter((section) => section.group === group).map((section) => {
                    const Icon = section.icon;
                    const active = activeSettingsSection === section.id;
                    return (
                      <button key={section.id} type="button" ref={(element) => { navButtonRefs.current[section.id] = element; }}
                        aria-current={active ? "page" : undefined} aria-controls={section.id === "creation" ? "your-sports" : section.id === "appearance" ? "settings-appearance-panel" : section.id}
                        onClick={() => selectSettingsSection(section.id)} className={styles.navButton}>
                        <Icon className={styles.navIcon} aria-hidden="true" />
                        <span className={styles.navLabel}>{section.label}</span>
                        <ChevronRight className={styles.mobileChevron} aria-hidden="true" />
                      </button>
                    );
                  })}
                </div>
              ))}
            </nav>
          </aside>

          <div data-settings-detail className={styles.detail}>
            <button type="button" onClick={showSettingsList} className={`${styles.quietButton} ${styles.backButton}`}>
              <ArrowLeft size={17} aria-hidden="true" />All settings
            </button>
            <h2 ref={sectionHeadingRef} id="settings-section-heading" tabIndex={-1} className={styles.sectionHeading}>{activeSection.label}</h2>

            <section id="favorites" aria-labelledby="settings-section-heading" hidden={activeSettingsSection !== "favorites"}
              className={`${activeSettingsSection === "favorites" ? "block" : "hidden"} ${styles.panel}`}>
              <CategoryFavoritesSettings />
            </section>
            <section id="settings-appearance-panel" aria-labelledby="settings-section-heading" hidden={activeSettingsSection !== "appearance"}
              className={`${activeSettingsSection === "appearance" ? "block" : "hidden"} ${styles.panel}`}>
              <AppearanceSelector />
            </section>

            <section id="profile" aria-labelledby="settings-section-heading" hidden={activeSettingsSection !== "profile"}
              className={`${activeSettingsSection === "profile" ? "block" : "hidden"} ${styles.panel}`}>
              <form onSubmit={onSaveProfile} className={styles.profileForm} aria-busy={profileState.loading}>
                <div className={styles.photoRow}>
                  <span className={styles.profileAvatar}>
                    {displayedAvatarUrl && displayedAvatarUrl !== failedAvatarUrl ? (
                      <Image key={displayedAvatarUrl} src={displayedAvatarUrl} alt={`${settingsDisplayName} profile`} fill sizes="64px" unoptimized className="object-cover" onError={() => setFailedAvatarUrl(displayedAvatarUrl)} />
                    ) : <span role="img" aria-label="Profile initials">{settingsInitials}</span>}
                  </span>
                  <div className={styles.photoCopy}>
                    <h3>Profile photo</h3>
                    <p>JPG, PNG or WebP · Up to 5 MB</p>
                  </div>
                  <input ref={avatarInputRef} type="file" accept={PROFILE_AVATAR_ACCEPT} onChange={onAvatarSelected} className="sr-only" aria-label="Choose profile image" disabled={!profileLoaded || profileState.loading} />
                  <div className={styles.photoActions}>
                    <button type="button" onClick={() => avatarInputRef.current?.click()} disabled={!profileLoaded || profileState.loading} className={styles.button}>
                      <Camera size={16} aria-hidden="true" />Change photo
                    </button>
                    {displayedAvatarUrl ? <button type="button" onClick={removeAvatar} disabled={!profileLoaded || profileState.loading} className={styles.quietButton}>Remove</button> : null}
                  </div>
                </div>
                {avatarState.error ? <p role="alert" className={styles.error}>{avatarState.error}</p> : null}
                <div className={styles.profileFields}>
                  <label className={styles.label} htmlFor="settings-first-name">First name
                    <input id="settings-first-name" name="firstName" autoComplete="given-name" value={firstName} onChange={(event) => { setFirstName(event.target.value); setProfileState({ loading: false, error: null }); }} disabled={!profileLoaded || profileState.loading} className={styles.input} />
                  </label>
                  <label className={styles.label} htmlFor="settings-last-name">Last name
                    <input id="settings-last-name" name="lastName" autoComplete="family-name" value={lastName} onChange={(event) => { setLastName(event.target.value); setProfileState({ loading: false, error: null }); }} disabled={!profileLoaded || profileState.loading} className={styles.input} />
                  </label>
                </div>
                <div className={styles.readOnly}>
                  <div><h3>Sign-in email</h3><p>{userEmail}</p></div>
                  <span><LockKeyhole size={14} aria-hidden="true" />Read only</span>
                </div>
                {profileState.error ? <div role="alert" className={styles.error}><p>{profileState.error}</p>{!profileLoaded ? <button type="button" onClick={() => setProfileReload((current) => current + 1)} className={styles.button}>Retry profile</button> : null}</div> : null}
                <div className={styles.actions}>
                  <p role="status" aria-live="polite" className={styles.feedback}>
                    {profileState.loading ? "Saving profile…" : profileState.data?.ok ? "Profile saved." : profileDirty ? "Unsaved changes" : !profileLoaded && !profileState.error ? "Loading profile…" : ""}
                  </p>
                  <div className={styles.actionButtons}>
                    <button type="button" onClick={cancelProfileChanges} disabled={!profileDirty || profileState.loading} className={styles.quietButton}>Cancel</button>
                    <button type="submit" disabled={!profileLoaded || !profileDirty || profileState.loading} className={styles.primaryButton}>{profileState.loading ? "Saving…" : "Save changes"}</button>
                  </div>
                </div>
              </form>
            </section>

            <section id="calendars" aria-labelledby="settings-section-heading" hidden={activeSettingsSection !== "calendars"}
              className={`${activeSettingsSection === "calendars" ? "block" : "hidden"} ${styles.panel}`}>
              <div className={styles.sectionRow}>
                <h3>Calendar connections</h3>
                <button type="button" onClick={() => void fetchConnectedCalendars()} className={styles.quietButton} disabled={connectionsLoading}>
                  <RefreshCw size={16} aria-hidden="true" className={connectionsLoading ? "animate-spin motion-reduce:animate-none" : ""} />{connectionsLoading ? "Refreshing…" : "Refresh"}
                </button>
              </div>
              {!CONNECTED_CALENDAR_SYNC_ENABLED ? <p className={styles.feedback}>{CALENDAR_SYNC_PAUSED_MESSAGE}</p> : null}
              {calendarConnectionMessage ? <p role={calendarConnectionMessage.kind === "error" ? "alert" : "status"} className={calendarConnectionMessage.kind === "error" ? styles.error : styles.feedback}>{calendarConnectionMessage.text}</p> : null}
              <div className={styles.providerList}>
                {([
                  { key: "google", label: "Google Calendar", connected: connectedCalendars.google },
                  { key: "microsoft", label: "Outlook Calendar", connected: connectedCalendars.microsoft },
                ] as const).map((item) => {
                  const disconnecting = disconnectingProvider === item.key;
                  const isDefault = item.connected && connectionsVerified && !calendarDefaultLoading && normalizedPreferredProvider === item.key;
                  return <div key={item.key} className={styles.providerRow}>
                    <div className={styles.providerInfo}>
                      <h3>{item.label}</h3>
                      <p>{!connectionsVerified ? connectionsLoading ? "Checking connection…" : "Connection not verified" : item.connected ? "Connected" : "Not connected"}</p>
                      {item.connected ? <p className={styles.providerEmail}>{connectionsLoading ? "Checking email…" : calendarAccountEmails[item.key] || "Email unavailable — try Refresh"}</p> : null}
                      {item.connected ? (
                        <button type="button" role="switch" aria-checked={isDefault} aria-label={`Use ${item.label} as default calendar`}
                          disabled={!CONNECTED_CALENDAR_SYNC_ENABLED || calendarDefaultLoading || calendarState.loading || connectionsLoading || !connectionsVerified || Boolean(disconnectingProvider)}
                          onClick={() => void saveCalendarDefault(isDefault ? null : item.key)} className={styles.defaultChoice}>
                          {isDefault ? <Check size={12} aria-hidden="true" /> : null}{isDefault ? "Default" : "Set as default"}
                        </button>
                      ) : null}
                    </div>
                    <div className={styles.providerActions}>
                      {item.connected ? (
                        <button type="button" onClick={() => { setDisconnectPromptError(null); setDisconnectPromptProvider(item.key); }} disabled={disconnecting || calendarState.loading} className={styles.button}>
                          <Unplug size={16} aria-hidden="true" />{disconnecting ? "Disconnecting…" : "Disconnect"}
                        </button>
                      ) : <button type="button" aria-label={`Connect ${item.label}`} onClick={() => handleCalendarConnect(item.key)} disabled={!CONNECTED_CALENDAR_SYNC_ENABLED || !connectionsVerified} className={styles.button}>Connect</button>}
                    </div>
                  </div>;
                })}
                <div className={styles.providerRow}>
                  <AppleCalendarConnection key={userEmail || "apple"} accountKey={userEmail} status={appleSubscriptionStatus} onStatusChange={handleAppleStatusChange} presentation="settings-column" />
                </div>
              </div>
              {calendarState.error ? <p role="alert" className={styles.error}>{calendarState.error}</p> : null}
              <p role="status" className="sr-only">{calendarState.loading ? "Saving calendar default…" : calendarState.data?.ok ? "Calendar default saved." : ""}</p>
            </section>

            <section id="security" aria-labelledby="settings-section-heading" hidden={activeSettingsSection !== "security"}
              className={`${activeSettingsSection === "security" ? "block" : "hidden"} ${styles.panel}`}>
              <form onSubmit={onChangePassword} className={styles.passwordForm}>
                <h3>Change password</h3>
                <label htmlFor="settings-current-password" className={styles.label}>Current password
                  <input id="settings-current-password" name="currentPassword" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className={styles.input} autoComplete="current-password" disabled={pwdState.loading} />
                </label>
                <label htmlFor="settings-new-password" className={styles.label}>New password
                  <input id="settings-new-password" name="newPassword" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className={styles.input} autoComplete="new-password" disabled={pwdState.loading} />
                </label>
                <label htmlFor="settings-confirm-password" className={styles.label}>Confirm new password
                  <input id="settings-confirm-password" name="confirmPassword" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className={styles.input} autoComplete="new-password" disabled={pwdState.loading} />
                </label>
                {pwdState.error ? <p role="alert" className={styles.error}>{pwdState.error}</p> : null}
                {pwdState.data?.ok ? <p role="status" className={styles.feedback}>Password changed.</p> : null}
                <div><button type="submit" disabled={pwdState.loading} className={styles.primaryButton}>{pwdState.loading ? "Saving…" : "Change password"}</button></div>
              </form>
              <ProfileAccountDeletion accountEmail={userEmail} />
            </section>

          <section
            data-settings-surface
            id="your-sports" aria-labelledby="settings-section-heading" hidden={activeSettingsSection !== "creation"}
            className={`${activeSettingsSection === "creation" ? "block" : "hidden"} ${styles.panel}`}
          >
            {UNIFIED_CREATION_ENABLED ? <CreationAccessSettings showHeading={false} /> : <>
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
              id="legacy-sports-preferences"
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

            <MobileActionBar
              label="Event creation settings actions"
              className="flex-col rounded-2xl border border-[#e0d8ed] shadow-[0_14px_35px_rgba(51,38,76,0.12)] sm:flex-row"
            >
              <button
                type="button"
                onClick={saveFeatureVisibility}
                disabled={featureVisibilitySaving}
                className="mobile-touch-target inline-flex w-full items-center justify-center rounded-xl bg-[#33264c] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#473460] disabled:opacity-60 sm:w-auto"
              >
                {featureVisibilitySaving ? "Saving..." : "Save create settings"}
              </button>
              <button
                type="button"
                onClick={resetPersonalization}
                disabled={featureVisibilitySaving}
                className="mobile-touch-target inline-flex w-full items-center justify-center rounded-xl border border-[#d9cdfa] bg-white px-4 py-2.5 text-sm font-semibold text-[#4f3f7a] transition hover:bg-[#f5eeff] disabled:opacity-60 sm:w-auto"
              >
                Reset personalization
              </button>
            </MobileActionBar>
            </>}
          </section>
        </div>
        </div>
      </div>

      <Dialog.Root
        open={Boolean(disconnectPromptProvider)}
        onOpenChange={(open) => {
          if (open || disconnectingProvider) return;
          setDisconnectPromptProvider(null);
          setDisconnectPromptError(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[12990] bg-[#170f24]/55 backdrop-blur-[6px] data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out data-[state=open]:fade-in motion-reduce:animate-none" />
          <Dialog.Content
            onEscapeKeyDown={(event) => {
              if (disconnectingProvider) event.preventDefault();
            }}
            onPointerDownOutside={(event) => {
              if (disconnectingProvider) event.preventDefault();
            }}
            className="fixed inset-x-4 bottom-4 z-[13000] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-[2rem] border border-[#ddd2f5] bg-white px-5 pb-5 pt-7 text-[#2f1d47] shadow-[0_28px_90px_rgba(36,21,58,0.34)] focus:outline-none data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out data-[state=open]:fade-in motion-reduce:animate-none sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[calc(100%-2rem)] sm:max-w-[26rem] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:px-7 sm:pb-7 sm:pt-8"
          >
            <div data-settings-accent-surface className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.35rem] bg-[linear-gradient(145deg,#eee8ff,#e4efff)] text-[#6f5cc4] shadow-[inset_0_0_0_1px_rgba(124,103,190,0.08)]">
              <Unplug className="h-7 w-7" aria-hidden="true" />
            </div>

            <Dialog.Title className="mt-6 text-center font-[family-name:var(--font-playfair),Georgia,serif] text-2xl font-semibold tracking-tight text-[#281c38]">
              Disconnect {disconnectPromptProvider === "google" ? "Google Calendar" : "Outlook"}?
            </Dialog.Title>
            <Dialog.Description className="mx-auto mt-3 max-w-sm text-center text-sm leading-6 text-[#6f6479]">
              New scanned events will stop syncing automatically. Events already added to your
              calendar will stay there.
            </Dialog.Description>

            <div className="mt-5 rounded-2xl border border-[#e7dffc] bg-[#faf8ff] px-4 py-3 text-sm leading-6 text-[#574967]">
              You can reconnect this calendar anytime from Settings.
            </div>

            {disconnectPromptError ? (
              <p
                role="alert"
                className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm leading-5 text-rose-700"
              >
                {disconnectPromptError}
              </p>
            ) : null}

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Dialog.Close asChild>
                <button
                  type="button"
                  disabled={Boolean(disconnectingProvider)}
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#d8cdf0] bg-white px-5 text-sm font-semibold text-[#4f3f7a] transition hover:bg-[#f7f3ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c67be] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Keep connected
                </button>
              </Dialog.Close>
              <button
                type="button"
                onClick={() => {
                  if (disconnectPromptProvider) {
                    void disconnectCalendar(disconnectPromptProvider);
                  }
                }}
                disabled={Boolean(disconnectingProvider)}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#a23c54] px-5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(162,60,84,0.24)] transition hover:bg-[#8f3047] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a23c54] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {disconnectingProvider ? (
                  <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Unplug className="h-4 w-4" aria-hidden="true" />
                )}
                {disconnectingProvider ? "Disconnecting…" : "Disconnect"}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </main>
  );
}
