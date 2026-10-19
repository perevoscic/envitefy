import { useSyncExternalStore } from "react";

const initialMenu = {
  isAdmin: false, productScopes: ["snap"], defaultCreateIntent: "birthdays",
  featureVisibility: { hasLoadedPreferences: true, loading: false, error: "", visibleTemplateKeys: ["birthdays", "baby_showers", "bridal_showers", "general"], sportPreferences: { setupCompleted: true, enabledSports: [], primarySport: null }, refresh: async () => {} },
};
let menu = initialMenu;
type FixturePreferences = {
  visibleTemplateKeys?: string[];
  sportPreferences?: { setupCompleted: boolean; enabledSports: string[]; primarySport: string | null };
  hasLoadedPreferences?: boolean;
  loading?: boolean;
};
export function setFixtureMenuPreferences(preferences: FixturePreferences | null) {
  menu = preferences === null
    ? initialMenu
    : { ...menu, featureVisibility: { ...menu.featureVisibility, ...preferences } } as typeof initialMenu;
  window.dispatchEvent(new Event("fixture-menu-change"));
}
const subscribe = (listener: () => void) => { window.addEventListener("fixture-menu-change", listener); return () => window.removeEventListener("fixture-menu-change", listener); };
export function useMenuOptional() { return useSyncExternalStore(subscribe, () => menu); }
export function useMenu() { return useMenuOptional(); }
