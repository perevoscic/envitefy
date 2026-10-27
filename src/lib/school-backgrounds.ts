import type { HolidayBackgroundPreset } from "./holiday-backgrounds";

/** Coordinated school papers use the shared versioned background renderer/save contract. */
export const SCHOOL_BACKGROUNDS: HolidayBackgroundPreset[] = [
  { id: "school--garden-notebook", occasion: "school", name: "Garden notebook", page: "#f6f2e5", ink: "#293f35", accent: "#4d7259", surface: "#fffdf5", secondary: "#9aaf83", motif: "books", treatment: "corners", material: "notebook" },
  { id: "school--library-linen", occasion: "school", name: "Library linen", page: "#fff7df", ink: "#483b2e", accent: "#806238", surface: "#fffdf2", secondary: "#c5a770", motif: "none", treatment: "frame", material: "linen" },
  { id: "school--blue-grid", occasion: "school", name: "Blue graph paper", page: "#f1f5fa", ink: "#293e58", accent: "#476c9a", surface: "#fcfdff", secondary: "#a2bbd5", motif: "geometric", treatment: "corners", material: "tiles" },
  { id: "school--courtyard-gingham", occasion: "school", name: "Courtyard gingham", page: "#eff4e9", ink: "#2e4336", accent: "#587343", surface: "#fbfdf7", secondary: "#a7b88d", motif: "none", treatment: "border", material: "gingham" },
  { id: "school--peach-watercolor", occasion: "school", name: "Peach watercolor", page: "#fff1e7", ink: "#543b36", accent: "#9c5548", surface: "#fffbf6", secondary: "#e2ae94", motif: "none", treatment: "corners", material: "watercolor" },
  { id: "school--celebration-confetti", occasion: "school", name: "Classroom confetti", page: "#fff3e4", ink: "#513b3e", accent: "#a34e66", surface: "#fffaf3", secondary: "#c9a563", motif: "confetti", treatment: "canopy", material: "grain" },
  { id: "school--mint-speckle", occasion: "school", name: "Mint craft paper", page: "#edf6ef", ink: "#31463d", accent: "#527761", surface: "#fafffb", secondary: "#a5beac", motif: "none", treatment: "frame", material: "speckle" },
  { id: "school--lilac-stars", occasion: "school", name: "Lilac stars", page: "#f4eefa", ink: "#493854", accent: "#806099", surface: "#fcf9ff", secondary: "#bea7d0", motif: "stars", treatment: "scatter", material: "grain" },
];
