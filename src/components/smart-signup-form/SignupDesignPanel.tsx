"use client";

import { useMemo, useState } from "react";
import { SIGNUP_TEMPLATES } from "@/assets/signup-templates";
import {
  TemplateThumbnailFrame,
  TemplateThumbnailPreview,
} from "@/components/events/TemplateThumbnail";
import { useTemplateEditor } from "@/components/templates/TemplateEditorContext";
import { getSignupDesign, SIGNUP_DESIGN_PALETTES } from "@/lib/signup-designs";
import {
  createSignupAppearance,
  getSignupTheme,
  SIGNUP_FONT_PAIRS,
  SIGNUP_HEADER_LAYOUTS,
  SIGNUP_THEMES,
  signupContrast,
} from "@/lib/signup-themes";
import type { SignupAppearance, SignupForm, SignupHeaderImageAsset } from "@/types/signup";
import { validateClientUploadFile } from "@/utils/media-upload-client";
import { readFileAsDataUrl } from "@/utils/thumbnail";
import styles from "./signup-editor.module.css";

export default function SignupDesignPanel({
  form,
  onChange,
}: {
  form: SignupForm;
  onChange: (form: SignupForm) => void;
}) {
  const editor = useTemplateEditor();
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const current = getSignupTheme(form.appearance?.themeId);
  const currentDesign = getSignupDesign(form.appearance?.designId);
  const currentColors = currentDesign ? SIGNUP_DESIGN_PALETTES[currentDesign.palette] : current;
  const appearance = form.appearance || {
    ...createSignupAppearance("clean-clear"),
    headerLayout: ["header-1", "header-2", "header-3", "header-4", "header-5", "header-6"].includes(
      form.header?.templateId || "",
    )
      ? (form.header?.templateId as SignupAppearance["headerLayout"])
      : ("header-1" as const),
  };
  const change = (patch: Partial<SignupAppearance>) =>
    onChange({ ...form, appearance: { ...appearance, ...patch } });
  const assets = useMemo(() => {
    const originals = SIGNUP_THEMES.map((theme) => ({
      name: theme.name,
      path: theme.artwork,
      category: theme.category,
    }));
    return [
      ...originals,
      ...Object.entries(SIGNUP_TEMPLATES).flatMap(([group, items]) =>
        items.map((item) => ({ ...item, path: item.artworkPath || item.path, category: group })),
      ),
    ].filter((item, index, all) => all.findIndex((other) => other.path === item.path) === index);
  }, []);
  const visibleAssets = assets
    .filter(
      (item) =>
        (!category || item.category === category) &&
        `${item.name} ${item.category}`.toLowerCase().includes(query.toLowerCase()),
    )
    .slice(0, 30);
  const pickImage = (image: SignupHeaderImageAsset, index = 0) => {
    const layout = appearance.headerLayout;
    const gallery = layout === "header-4" || layout === "header-5" || layout === "header-6";
    if (gallery) {
      const images = [...(form.header?.images || [])];
      while (images.length <= index)
        images.push({
          ...(form.header?.backgroundImage || image),
          id: `signup-photo-${images.length}`,
        });
      images[index] = { ...image, id: images[index]?.id || `signup-photo-${index}` };
      onChange({ ...form, appearance: { ...appearance }, header: { ...form.header, images } });
    } else
      onChange({
        ...form,
        appearance: { ...appearance, headerLayout: layout === "none" ? "header-3" : layout },
        header: { ...form.header, backgroundImage: image, images: [] },
      });
  };
  const upload = async (file?: File, index = 0) => {
    if (!file) return;
    const issue = validateClientUploadFile(file, "header");
    if (issue) {
      setError(issue);
      return;
    }
    try {
      const dataUrl = editor ? editor.previewPhoto(file) : await readFileAsDataUrl(file);
      pickImage({ name: file.name, type: file.type, dataUrl }, index);
      setError("");
    } catch {
      setError("That photo could not be opened. Please try another image.");
    }
  };
  const photoCount =
    appearance.headerLayout === "header-6"
      ? 3
      : ["header-4", "header-5"].includes(appearance.headerLayout)
        ? 2
        : 1;
  return (
    <div className={styles.panel}>
      <fieldset className={styles.field}>
        <legend>Color palette</legend>
        <div className={styles.swatches}>
          {(["original", "soft", "ink"] as const).map((palette) => (
            <button
              key={palette}
              type="button"
              aria-pressed={appearance.palette === palette}
              onClick={() => change({ palette, accent: undefined })}
            >
              <span
                className={styles.swatch}
                style={{
                  background:
                    palette === "ink"
                      ? currentColors?.ink || "#222D40"
                      : palette === "soft"
                        ? currentColors?.soft || "#E8ECF2"
                        : currentColors?.accent || "#354B72",
                }}
              />
              {palette === "original" ? "Original" : palette === "soft" ? "Soft" : "Ink"}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className={styles.field}>
        <legend>Typography</legend>
        <div className={styles.segmented}>
          {SIGNUP_FONT_PAIRS.map((pair) => (
            <button
              type="button"
              key={pair.id}
              aria-pressed={appearance.fontPair === pair.id}
              onClick={() => change({ fontPair: pair.id })}
              style={{ fontFamily: pair.heading }}
            >
              {pair.name}
            </button>
          ))}
        </div>
      </fieldset>
      <div className={styles.field}>
        <label htmlFor="signup-header-layout">Header layout</label>
        <select
          id="signup-header-layout"
          value={appearance.headerLayout}
          onChange={(event) =>
            change({ headerLayout: event.target.value as SignupAppearance["headerLayout"] })
          }
        >
          {SIGNUP_HEADER_LAYOUTS.map((layout) => (
            <option key={layout.id} value={layout.id}>
              {layout.name}
            </option>
          ))}
        </select>
      </div>
      <details className={styles.details}>
        <summary>Photos & artwork</summary>
        {Array.from({ length: photoCount }, (_, i) => (
          <div className={styles.field} key={i}>
            <label htmlFor={`signup-photo-${i}`}>
              {photoCount > 1 ? `Photo ${i + 1}` : "Upload a photo"}
            </label>
            <input
              id={`signup-photo-${i}`}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              onChange={(event) => {
                void upload(event.target.files?.[0], i);
                event.target.value = "";
              }}
            />
          </div>
        ))}
        <button
          type="button"
          className={styles.secondary}
          onClick={() =>
            onChange({
              ...form,
              appearance: { ...appearance, headerLayout: "none" },
              header: { ...form.header, backgroundImage: null, images: [] },
            })
          }
        >
          Remove photos
        </button>
        <div className={styles.field}>
          <label htmlFor="signup-art-search">Search the artwork library</label>
          <input
            id="signup-art-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Food, school, community…"
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="signup-art-category">Artwork category</label>
          <select
            id="signup-art-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="">All categories</option>
            {[...new Set(assets.map((item) => item.category))].sort().map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </div>
        <div className={styles.artGrid}>
          {visibleAssets.map((asset) => (
            <button
              type="button"
              key={asset.path}
              aria-label={`Use ${asset.name} artwork`}
              aria-pressed={
                form.header?.backgroundImage?.dataUrl === asset.path ||
                form.header?.images?.[0]?.dataUrl === asset.path
              }
              onClick={() =>
                pickImage({
                  name: asset.name,
                  type: asset.path.endsWith(".png") ? "image/png" : "image/webp",
                  dataUrl: asset.path,
                })
              }
            >
              <TemplateThumbnailFrame>
                <TemplateThumbnailPreview scaled={false}>
                  <img src={asset.path} alt="" loading="lazy" />
                </TemplateThumbnailPreview>
              </TemplateThumbnailFrame>
              <span>{asset.name}</span>
            </button>
          ))}
        </div>
        {!visibleAssets.length && (
          <p className={styles.help}>No artwork matches. Try another search or category.</p>
        )}
        <div className={styles.field}>
          <label htmlFor="signup-photo-x">Photo crop: horizontal position</label>
          <input
            id="signup-photo-x"
            type="range"
            min={0}
            max={100}
            value={appearance.imagePosition.x}
            onChange={(event) =>
              change({
                imagePosition: { ...appearance.imagePosition, x: Number(event.target.value) },
              })
            }
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="signup-photo-y">Photo crop: vertical position</label>
          <input
            id="signup-photo-y"
            type="range"
            min={0}
            max={100}
            value={appearance.imagePosition.y}
            onChange={(event) =>
              change({
                imagePosition: { ...appearance.imagePosition, y: Number(event.target.value) },
              })
            }
          />
        </div>
      </details>
      <details className={styles.details}>
        <summary>Fine-tune the design</summary>
        <div className={styles.field}>
          <label htmlFor="signup-density">Spacing</label>
          <select
            id="signup-density"
            value={appearance.density}
            onChange={(event) =>
              change({ density: event.target.value as SignupAppearance["density"] })
            }
          >
            <option value="comfortable">Comfortable</option>
            <option value="compact">Compact</option>
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="signup-slot-layout">Slot style</label>
          <select
            id="signup-slot-layout"
            value={appearance.slotLayout}
            onChange={(event) =>
              change({ slotLayout: event.target.value as SignupAppearance["slotLayout"] })
            }
          >
            <option value="cards">Cards</option>
            <option value="rows">Rows</option>
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="signup-accent">Custom accent</label>
          <input
            id="signup-accent"
            type="color"
            value={
              appearance.accent ||
              (appearance.palette === "ink" ? currentColors?.ink : currentColors?.accent) ||
              "#354B72"
            }
            onChange={(event) => {
              const accent = event.target.value;
              if (signupContrast(accent, "#FFFFFF") < 4.5) {
                setError("Choose a darker accent so button text stays easy to read.");
                return;
              }
              setError("");
              change({ accent });
            }}
          />
          <span className={styles.help}>
            We check the contrast of your accent with white button text.
          </span>
        </div>
      </details>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
