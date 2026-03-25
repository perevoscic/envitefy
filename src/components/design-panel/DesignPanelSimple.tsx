"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { MoreOptions } from "./MoreOptions";
import { PalettePickerGrid } from "./PalettePickerGrid";
import { TitleFontSelect } from "./TitleFontSelect";
import { PaletteDefinition, ThemeTokens, TitleFontOption } from "./types";
import {
  PROFESSIONAL_GASPARILLA_PALETTES,
  TITLE_FONT_OPTIONS,
  applyTheme,
  createHistory,
  deriveTokensFromPalette,
  exportThemeJson,
  pushHistory,
  redoHistory,
  undoHistory,
} from "./utils";

type DesignPanelSimpleProps = {
  palettes?: PaletteDefinition[];
  titleFonts?: TitleFontOption[];
  previewRootSelector?: string;
  className?: string;
  onTokensChange?: (tokens: ThemeTokens) => void;
  onTitleFontChange?: (fontStack: string) => void;
};

type PanelState = {
  paletteId: string;
  darkMode: boolean;
  buttonStyle: "solid" | "outline";
  titleFont: string;
  history: ReturnType<typeof createHistory<ThemeTokens>>;
  adjustedHint: boolean;
};

type PanelAction =
  | { type: "apply"; next: ThemeTokens; adjustedHint: boolean }
  | { type: "setPalette"; paletteId: string }
  | { type: "setDarkMode"; darkMode: boolean }
  | { type: "setButtonStyle"; buttonStyle: "solid" | "outline" }
  | { type: "setTitleFont"; titleFont: string }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "reset"; state: PanelState };

const reduce = (state: PanelState, action: PanelAction): PanelState => {
  switch (action.type) {
    case "apply":
      return {
        ...state,
        history: pushHistory(state.history, action.next),
        adjustedHint: action.adjustedHint,
      };
    case "setPalette":
      return { ...state, paletteId: action.paletteId };
    case "setDarkMode":
      return { ...state, darkMode: action.darkMode };
    case "setButtonStyle":
      return { ...state, buttonStyle: action.buttonStyle };
    case "setTitleFont":
      return { ...state, titleFont: action.titleFont };
    case "undo":
      return { ...state, history: undoHistory(state.history), adjustedHint: false };
    case "redo":
      return { ...state, history: redoHistory(state.history), adjustedHint: false };
    case "reset":
      return action.state;
    default:
      return state;
  }
};

export default function DesignPanelSimple({
  palettes = PROFESSIONAL_GASPARILLA_PALETTES,
  titleFonts = TITLE_FONT_OPTIONS,
  previewRootSelector,
  className,
  onTokensChange,
  onTitleFontChange,
}: DesignPanelSimpleProps) {
  const defaultPalette = palettes.find((p) => p.recommended) || palettes[0];
  const defaultFont = titleFonts[0]?.stack || "'Playfair Display', serif";
  const initialResult = deriveTokensFromPalette(defaultPalette, {
    titleFont: defaultFont,
    buttonStyle: "solid",
    darkMode: false,
  });

  const initialState: PanelState = {
    paletteId: defaultPalette.id,
    darkMode: false,
    buttonStyle: "solid",
    titleFont: defaultFont,
    history: createHistory(initialResult.tokens),
    adjustedHint: initialResult.adjustedForReadability,
  };

  const [state, dispatch] = useReducer(reduce, initialState);
  const [optionalOpen, setOptionalOpen] = useState(false);
  const onTokensChangeRef = useRef(onTokensChange);
  const onTitleFontChangeRef = useRef(onTitleFontChange);

  const activePalette =
    palettes.find((palette) => palette.id === state.paletteId) || defaultPalette;

  const applyDerivedTheme = (
    palette: PaletteDefinition,
    config: {
      darkMode?: boolean;
      buttonStyle?: "solid" | "outline";
      titleFont?: string;
    }
  ) => {
    const result = deriveTokensFromPalette(palette, {
      darkMode: config.darkMode ?? state.darkMode,
      buttonStyle: config.buttonStyle ?? state.buttonStyle,
      titleFont: config.titleFont ?? state.titleFont,
    });
    dispatch({ type: "apply", next: result.tokens, adjustedHint: result.adjustedForReadability });
  };

  useEffect(() => {
    onTokensChangeRef.current = onTokensChange;
  }, [onTokensChange]);

  useEffect(() => {
    onTitleFontChangeRef.current = onTitleFontChange;
  }, [onTitleFontChange]);

  useEffect(() => {
    const root = previewRootSelector
      ? (document.querySelector(previewRootSelector) as HTMLElement | null)
      : null;
    applyTheme(state.history.present, root);
    onTokensChangeRef.current?.(state.history.present);
    onTitleFontChangeRef.current?.(state.history.present.titleFont);
  }, [state.history.present, previewRootSelector]);

  return (
    <div className={`space-y-3 ${className || ""}`}>
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Quick Style</p>
            <p className="text-xs text-slate-400">Professional Color Palettes for Gasparilla Classic</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => dispatch({ type: "undo" })}
              disabled={!state.history.past.length}
              className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold disabled:opacity-40"
            >
              Undo
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: "redo" })}
              disabled={!state.history.future.length}
              className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold disabled:opacity-40"
            >
              Redo
            </button>
          </div>
        </div>

        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Color Palette</label>
        <PalettePickerGrid
          palettes={palettes}
          selectedPaletteId={activePalette.id}
          onSelect={(paletteId) => {
            dispatch({ type: "setPalette", paletteId });
            const selectedPalette = palettes.find((palette) => palette.id === paletteId);
            if (selectedPalette) {
              applyDerivedTheme(selectedPalette, { darkMode: false });
              dispatch({ type: "setDarkMode", darkMode: false });
            }
          }}
        />

        <div className="mt-4 space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Title Font</label>
          <TitleFontSelect
            options={titleFonts}
            value={state.titleFont}
            onChange={(fontStack) => {
              dispatch({ type: "setTitleFont", titleFont: fontStack });
              applyDerivedTheme(activePalette, { titleFont: fontStack });
            }}
          />
          <p className="text-[11px] text-slate-400">Only affects page title.</p>
        </div>

        {state.adjustedHint ? (
          <p className="mt-2 text-xs text-slate-500">Adjusted for readability.</p>
        ) : null}
      </section>

      <MoreOptions
        open={optionalOpen}
        buttonStyle={state.buttonStyle}
        darkModeEnabled={state.darkMode}
        darkModeSupported={Boolean(activePalette.supportsDarkMode)}
        onToggleOpen={() => setOptionalOpen((prev) => !prev)}
        onDarkModeToggle={(darkMode) => {
          dispatch({ type: "setDarkMode", darkMode });
          applyDerivedTheme(activePalette, { darkMode });
        }}
        onButtonStyleChange={(buttonStyle) => {
          dispatch({ type: "setButtonStyle", buttonStyle });
          applyDerivedTheme(activePalette, { buttonStyle });
        }}
        onReset={() => {
          dispatch({ type: "reset", state: initialState });
        }}
        onExport={() => {
          const payload = exportThemeJson(state.history.present);
          if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(payload).catch(() => undefined);
          }
          window.alert("Theme JSON copied to clipboard.");
        }}
      />
    </div>
  );
}
