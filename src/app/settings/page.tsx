"use client";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

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
        body: JSON.stringify({
          firstName,
          lastName,
          preferredProvider: preferredProvider || null,
        }),
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
    } catch (err: any) {
      setPwdState({
        loading: false,
        error: err?.message || "Failed to change password",
      });
    }
  }

  return (
    <main className="min-h-screen w-full bg-background text-foreground landing-dark-gradient flex items-center justify-center p-6 pt-15">
      <section className="w-full max-w-2xl">
        <div className="rounded-3xl bg-surface/80 backdrop-blur-sm p-8 border border-border">
          <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight text-center mb-1">
            Account
          </h1>
          <p className="text-sm text-muted-foreground mb-6 text-center">
            Manage your profile and security settings.
          </p>
          {/* Profile (names) */}
          <section className="space-y-6 mt-8 border-t border-border pt-6">
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
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={userEmail}
                  disabled
                  className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm"
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
                  className="inline-flex items-center px-4 py-2 rounded-md text-sm border border-border bg-primary/80 text-white hover:bg-primary disabled:opacity-60"
                >
                  {profileState.loading ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </section>

          {/* Security */}
          <section className="space-y-6 mt-8 border-t border-border pt-6">
            <h2 className="text-base font-semibold">Security</h2>
            <form onSubmit={onChangePassword} className="space-y-4">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>
      </section>
    </main>
  );
}
