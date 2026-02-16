"use client";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  TEMPLATE_DEFINITIONS,
  type TemplateKey,
} from "@/config/feature-visibility";

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
  const [visibleTemplateKeys, setVisibleTemplateKeys] = useState<TemplateKey[]>(
    []
  );
  const [onboardingSaving, setOnboardingSaving] = useState(false);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdState, setPwdState] = useState<ApiState<{ ok?: boolean }>>({
    loading: false,
    error: null,
  });

  const userEmail = useMemo(
    () => (session?.user?.email as string) || "",
    [session]
  );

  useEffect(() => {
    let ignore = false;
    async function loadProfile() {
      try {
        const res = await fetch("/api/user/profile", { cache: "no-store" });
        if (!res.ok)
          throw new Error((await res.json()).error || "Failed to load profile");
        const json = await res.json();
        if (ignore) return;
        setFirstName(json.firstName || "");
        setLastName(json.lastName || "");
        setPreferredProvider(json.preferredProvider || "");
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
    async function loadOnboarding() {
      try {
        const res = await fetch("/api/user/onboarding", { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        if (ignore) return;
        setVisibleTemplateKeys(
          Array.isArray(json?.visibleTemplateKeys)
            ? (json.visibleTemplateKeys as TemplateKey[])
            : []
        );
      } catch {
        // ignore
      }
    }
    loadOnboarding();
    return () => {
      ignore = true;
    };
  }, []);

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
          preferredProvider: preferredProvider || null,
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

  async function saveOnboarding() {
    if (visibleTemplateKeys.length === 0) return;
    setOnboardingSaving(true);
    try {
      const res = await fetch("/api/user/onboarding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete",
          persona: "general",
          personas: ["general"],
          visibleTemplateKeys,
        }),
      });
      if (!res.ok) throw new Error("Failed to update onboarding settings");
    } catch {
      // keep silent in settings UI
    } finally {
      setOnboardingSaving(false);
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
                  <label className="block text-sm font-medium mb-1">
                    First name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full rounded-md border border-[#d9cdfa] bg-[#fcfaff] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Last name
                  </label>
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
              {profileState.error && (
                <p className="text-sm text-red-600">{profileState.error}</p>
              )}
              {profileState.data?.ok && (
                <p className="text-sm text-green-600">Profile saved.</p>
              )}
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

          {/* Security */}
          <section className="space-y-6 mt-8 border-t border-[#ece4ff] pt-6">
            <h2 className="text-base font-semibold">Security</h2>
            <form onSubmit={onChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Current password
                </label>
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
                  <label className="block text-sm font-medium mb-1">
                    New password
                  </label>
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
                  <label className="block text-sm font-medium mb-1">
                    Confirm new password
                  </label>
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
              {pwdState.error && (
                <p className="text-sm text-red-600">{pwdState.error}</p>
              )}
              {pwdState.data?.ok && (
                <p className="text-sm text-green-600">Password changed.</p>
              )}
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
              onClick={saveOnboarding}
              disabled={visibleTemplateKeys.length === 0 || onboardingSaving}
              className="inline-flex items-center px-4 py-2 rounded-xl text-sm border border-[#cfc2ff] bg-[#7F8CFF] text-white hover:bg-[#6d7af5] disabled:opacity-60"
            >
              {onboardingSaving ? "Saving..." : "Save feature settings"}
            </button>
          </section>
        </div>
      </section>
    </main>
  );
}
