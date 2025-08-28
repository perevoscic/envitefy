"use client";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

type ApiState<T> = { loading: boolean; error: string | null; data?: T };

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");

  // Profile form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [profileState, setProfileState] = useState<ApiState<{ ok?: boolean }>>({
    loading: false,
    error: null,
  });

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
      } catch (e: any) {
        // no-op; page still renders
      }
    }
    loadProfile();
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
        body: JSON.stringify({ firstName, lastName }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to update profile");
      setProfileState({ loading: false, error: null, data: { ok: true } });
    } catch (err: any) {
      setProfileState({
        loading: false,
        error: err?.message || "Failed to update",
      });
    }
  }

  async function onChangePassword(e: React.FormEvent) {
    e.preventDefault();
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
    } catch (err: any) {
      setPwdState({
        loading: false,
        error: err?.message || "Failed to change password",
      });
    }
  }

  return (
    <main className="p-6 max-w-3xl">
      <h1 className="text-xl font-semibold mb-1">Account</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Manage your profile and security settings.
      </p>

      <div className="flex items-center gap-2 border-b border-border mb-6">
        <button
          className={`px-3 py-2 text-sm rounded-t-md ${
            activeTab === "profile"
              ? "bg-surface text-foreground"
              : "text-foreground/70 hover:text-foreground"
          }`}
          onClick={() => setActiveTab("profile")}
        >
          Profile
        </button>
        <button
          className={`px-3 py-2 text-sm rounded-t-md ${
            activeTab === "security"
              ? "bg-surface text-foreground"
              : "text-foreground/70 hover:text-foreground"
          }`}
          onClick={() => setActiveTab("security")}
        >
          Security
        </button>
      </div>

      {activeTab === "profile" && (
        <section className="space-y-6">
          <form onSubmit={onSaveProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={userEmail}
                disabled
                className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  First name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
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
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
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
                className="inline-flex items-center px-4 py-2 rounded-md text-sm border border-border bg-primary/80 text-white hover:bg-primary disabled:opacity-60"
              >
                {profileState.loading ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        </section>
      )}

      {activeTab === "security" && (
        <section className="space-y-6">
          <form onSubmit={onChangePassword} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium mb-1">
                Current password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                autoComplete="current-password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                New password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Confirm new password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                autoComplete="new-password"
              />
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
                className="inline-flex items-center px-4 py-2 rounded-md text-sm border border-border bg-primary/80 text-white hover:bg-primary disabled:opacity-60"
              >
                {pwdState.loading ? "Saving..." : "Change password"}
              </button>
            </div>
          </form>
        </section>
      )}
    </main>
  );
}
