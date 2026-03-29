"use client";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TEMPLATE_DEFINITIONS, TEMPLATE_KEYS, type TemplateKey } from "@/config/feature-visibility";

type CalendarProvider = "google" | "microsoft" | "apple";
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
  const [featureVisibilitySaving, setFeatureVisibilitySaving] = useState(false);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdState, setPwdState] = useState<ApiState<{ ok?: boolean }>>({
    loading: false,
    error: null,
  });

  const userEmail = useMemo(() => (session?.user?.email as string) || "", [session]);

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
    if (visibleTemplateKeys.length === 0) return;
    setFeatureVisibilitySaving(true);
    try {
      const res = await fetch("/api/user/feature-visibility", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visibleTemplateKeys,
        }),
      });
      if (!res.ok) throw new Error("Failed to update feature visibility");
    } catch {
      // keep silent in settings UI
    } finally {
      setFeatureVisibilitySaving(false);
    }
  }

  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-[#f6f2ff] via-white to-[#f7f3ff] text-foreground flex items-center justify-center p-6 pt-15">
      <section className="w-full max-w-2xl">
        <div className="rounded-3xl bg-white/95 backdrop-blur-sm p-8 border border-[#e5dcff] shadow-[0_20px_60px_rgba(127,140,255,0.12)]">
          <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight text-center mb-1">
            Account
          </h1>
          <p className="text-sm text-muted-foreground mb-6 text-center">
            Manage your profile and security settings.
          </p>
          {/* Profile (names) */}
          <section className="space-y-6 mt-8 border-t border-[#ece4ff] pt-6">
            <h2 className="text-base font-semibold">Profile</h2>
            <form onSubmit={onSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">First name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full rounded-md border border-[#d9cdfa] bg-[#fcfaff] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full rounded-md border border-[#d9cdfa] bg-[#fcfaff] px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={userEmail}
                  disabled
                  className="w-full rounded-md border border-[#e3dafd] bg-[#f4eeff] px-3 py-2 text-sm"
                />
              </div>
              <div></div>
              {profileState.error && <p className="text-sm text-red-600">{profileState.error}</p>}
              {profileState.data?.ok && <p className="text-sm text-green-600">Profile saved.</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={profileState.loading}
                  className="inline-flex items-center px-4 py-2 rounded-md text-sm border border-[#cfc2ff] bg-[#7F8CFF] text-white hover:bg-[#6d7af5] disabled:opacity-60"
                >
                  {profileState.loading ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </section>

          <section className="space-y-6 mt-8 border-t border-[#ece4ff] pt-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">Calendar Connection Status</h2>
                <p className="text-sm text-muted-foreground">
                  Connect providers and choose your default calendar for event quick-add.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void fetchConnectedCalendars()}
                className="inline-flex items-center px-3 py-1.5 rounded-md text-xs border border-[#d9cdfa] bg-[#fcfaff] text-[#4f3f7a] hover:bg-[#f5eeff]"
                disabled={connectionsLoading}
              >
                {connectionsLoading ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                  className="rounded-xl border border-[#e5dcff] bg-white p-3 space-y-2"
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
                    className="w-full inline-flex items-center justify-center px-3 py-2 rounded-md text-xs border border-[#d9cdfa] bg-[#fcfaff] text-[#4f3f7a] hover:bg-[#f5eeff]"
                  >
                    {item.connected ? "Reconnect" : `Connect ${item.label}`}
                  </button>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-[#e5dcff] bg-white p-4 space-y-3">
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
                  className="inline-flex items-center px-3 py-2 rounded-md text-xs border border-[#d9cdfa] bg-[#fcfaff] text-[#4f3f7a] hover:bg-[#f5eeff]"
                >
                  Clear default
                </button>
                <button
                  type="button"
                  onClick={() => void saveCalendarDefault()}
                  disabled={calendarState.loading}
                  className="inline-flex items-center px-3 py-2 rounded-md text-xs border border-[#cfc2ff] bg-[#7F8CFF] text-white hover:bg-[#6d7af5] disabled:opacity-60"
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
          <section className="space-y-6 mt-8 border-t border-[#ece4ff] pt-6">
            <h2 className="text-base font-semibold">Security</h2>
            <form onSubmit={onChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Current password</label>
                <input
                  name="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-md border border-[#d9cdfa] bg-[#fcfaff] px-3 py-2 text-sm"
                  autoComplete="current-password"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">New password</label>
                  <input
                    name="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-md border border-[#d9cdfa] bg-[#fcfaff] px-3 py-2 text-sm"
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
                    className="w-full rounded-md border border-[#d9cdfa] bg-[#fcfaff] px-3 py-2 text-sm"
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
                  className="inline-flex items-center px-4 py-2 rounded-md text-sm border border-[#cfc2ff] bg-[#7F8CFF] text-white hover:bg-[#6d7af5] disabled:opacity-60"
                >
                  {pwdState.loading ? "Saving..." : "Change password"}
                </button>
              </div>
            </form>
          </section>

          <section className="space-y-6 mt-8 border-t border-[#ece4ff] pt-6 rounded-2xl bg-gradient-to-br from-white via-[#fcfaff] to-[#f4efff] p-4 border border-[#e5dcff]">
            <h2 className="text-base font-semibold">Feature Visibility</h2>
            <p className="text-sm text-muted-foreground">
              Choose which event types appear in your create menus.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {TEMPLATE_DEFINITIONS.map((template) => (
                <label
                  key={template.key}
                  className="flex items-center gap-2 rounded-xl border border-[#e5dcff] bg-white px-3 py-2 text-sm text-[#2f1d47]"
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

            <button
              type="button"
              onClick={saveFeatureVisibility}
              disabled={visibleTemplateKeys.length === 0 || featureVisibilitySaving}
              className="inline-flex items-center px-4 py-2 rounded-xl text-sm border border-[#cfc2ff] bg-[#7F8CFF] text-white hover:bg-[#6d7af5] disabled:opacity-60"
            >
              {featureVisibilitySaving ? "Saving..." : "Save feature settings"}
            </button>
          </section>
        </div>
      </section>
    </main>
  );
}
