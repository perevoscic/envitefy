"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, Cake, Heart, Sparkle } from "lucide-react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCreationAccess } from "@/hooks/useCreationAccess";
import { notifyFeatureVisibilityChanged, useFeatureVisibility } from "@/hooks/useFeatureVisibility";
import { filterPinnedCategoryIds } from "@/lib/category-favorites";
import type { CreationAccess } from "@/lib/creation-access";
import { normalizeSportActivityKey } from "@/lib/sports-discovery/profiles";
import type { SportPreferences } from "@/lib/sports-preferences";
import CategoryInterestPicker from "./CategoryInterestPicker";
import EnvitefyWordmark from "@/components/branding/EnvitefyWordmark";
import styles from "./category-interests.module.css";

function InterestDialog({
  access,
  initialIds,
  sportPreferences,
  onDone,
}: {
  access: CreationAccess;
  initialIds: string[];
  sportPreferences: SportPreferences;
  onDone: () => void;
}) {
  const [selected, setSelected] = useState(initialIds);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const request = useRef<AbortController | null>(null);
  const errorMessage = useRef<HTMLParagraphElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(
    () => () => {
      const active = request.current;
      request.current = null;
      active?.abort();
    },
    [],
  );
  useEffect(() => {
    if (error) errorMessage.current?.focus();
  }, [error]);

  const save = async (skip = false) => {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setSaving(true);
    setError("");
    let timer: ReturnType<typeof setTimeout> | undefined;
    let timedOut = false;
    try {
      const pinnedCategoryIds = filterPinnedCategoryIds(selected, access);
      const sports = pinnedCategoryIds
        .map((id) => normalizeSportActivityKey(id === "dance-ballet" ? "dance" : id))
        .filter((sport): sport is string => Boolean(sport));
      const primarySport =
        sportPreferences.primarySport && sports.includes(sportPreferences.primarySport)
          ? sportPreferences.primarySport
          : sports[0] || null;
      const operation = (async () => {
        const response = await fetch("/api/user/feature-visibility", {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify(
            skip
              ? { categoryOnboarding: "skipped" }
              : {
                  categoryOnboarding: "completed",
                  pinnedCategoryIds,
                  sportPreferences: {
                    primarySport,
                    enabledSports: sports,
                    setupCompleted: Boolean(primarySport),
                  },
                  sportPreferenceSource: "manual",
                },
          ),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok)
          throw new Error(payload?.error || "Could not save your favorites. Please try again.");
        if (
          payload?.featureVisibility?.categoryOnboarding !== (skip ? "skipped" : "completed") ||
          (!skip && !Array.isArray(payload?.featureVisibility?.pinnedCategoryIds))
        ) {
          throw new Error("Favorites save was not confirmed. Please try again.");
        }
      })();
      await Promise.race([
        operation,
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            timedOut = true;
            controller.abort();
            reject(new Error("Saving your favorites took too long. Please try again."));
          }, 10_000);
        }),
      ]);
      if (request.current !== controller || controller.signal.aborted) return;
      onDone();
      notifyFeatureVisibilityChanged();
    } catch (failure) {
      if (request.current !== controller || (controller.signal.aborted && !timedOut)) return;
      setError(
        failure instanceof Error
          ? failure.message
          : "Could not save your favorites. Please try again.",
      );
    } finally {
      clearTimeout(timer);
      if (request.current === controller) {
        request.current = null;
        setSaving(false);
      }
    }
  };

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !saving) void save(true);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content
          className={styles.panel}
          data-appearance-scope="app"
          onPointerDownOutside={(event) => event.preventDefault()}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            title.current?.focus({ preventScroll: true });
          }}
        >
          <div className={styles.content}>
            <header className={styles.header}>
              <div className={styles.brand}>
                <EnvitefyWordmark scaled={false} className={styles.wordmark} />
              </div>
              <div className={styles.introduction}>
                <p className={styles.eyebrow}>Make it yours</p>
                <Dialog.Title ref={title} tabIndex={-1} className={styles.title}>
                  What do you <em>like to plan?</em>
                </Dialog.Title>
                <Dialog.Description className={styles.description}>
                  Your selections will be added to Favorites. You can add or change these later in
                  Settings.
                </Dialog.Description>
              </div>
              <div className={styles.ornament} aria-hidden="true">
                <div className={styles.ornamentRing} />
                <div className={styles.paperOne}>
                  <Heart size={38} strokeWidth={1} />
                  <i />
                  <i />
                  <i />
                </div>
                <div className={styles.paperTwo}>
                  <Cake size={38} strokeWidth={1} />
                  <i />
                  <i />
                </div>
                <Sparkle className={styles.ornamentStar} size={34} strokeWidth={1} />
              </div>
            </header>
            <div className={styles.scrollBody}>
              <div className={styles.pickerHeading}>
                <span>Your favorites</span>
                <span className={styles.selectedCount}>
                  {filterPinnedCategoryIds(selected, access).length} selected
                </span>
              </div>
              <CategoryInterestPicker
                value={selected}
                onChange={setSelected}
                access={access}
                disabled={saving}
                variant="cards"
              />
            </div>
          </div>
          <footer className={styles.footer}>
            {error ? (
              <p ref={errorMessage} role="alert" tabIndex={-1} className={styles.error}>
                {error}
              </p>
            ) : null}
            <div className={styles.actions}>
              <button
                type="button"
                disabled={saving}
                className={styles.skip}
                onClick={() => void save(true)}
              >
                Skip for now
              </button>
              <button
                type="button"
                disabled={saving}
                className={styles.continue}
                onClick={() => void save()}
              >
                {saving ? "Saving…" : "Continue"}
                <ArrowRight size={18} strokeWidth={1.5} aria-hidden="true" />
              </button>
            </div>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default function CategoryInterestOnboarding() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const identity = session?.user?.email || (session?.user as { id?: string } | undefined)?.id || "";
  const visibility = useFeatureVisibility();
  const creation = useCreationAccess();
  const [finishedFor, setFinishedFor] = useState("");
  const path = pathname?.replace(/\/+$/, "") || "/";
  if (
    status !== "authenticated" ||
    !identity ||
    !["/", "/create"].includes(path) ||
    !visibility.hasLoadedPreferences ||
    visibility.categoryOnboarding !== "pending" ||
    !creation.access ||
    finishedFor === identity
  )
    return null;

  return (
    <InterestDialog
      key={identity}
      access={creation.access}
      initialIds={filterPinnedCategoryIds(
        visibility.pinnedCategoryIds ?? ["birthdays", "holidays-seasonal"],
        creation.access,
      )}
      sportPreferences={visibility.sportPreferences}
      onDone={() => setFinishedFor(identity)}
    />
  );
}
