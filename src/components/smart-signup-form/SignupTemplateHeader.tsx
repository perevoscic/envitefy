"use client";

import { Pencil } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import InlineEditableText from "@/components/events/InlineEditableText";
import TemplateImageTone from "@/components/events/TemplateImageTone";
import { formatSignupDateRange } from "@/lib/signup-display";
import { resolveSignupDesign, resolveSignupThemeStyle } from "@/lib/signup-themes";
import type { SignupForm } from "@/types/signup";
import SignupDesignOrnament from "./SignupDesignOrnament";
import type { SignupDetailsSection } from "./SignupDetailsEditor";
import SignupHeaderDetailsEditor, { type SignupHeaderEditing } from "./SignupHeaderDetailsEditor";
import composer from "./signup-composer.module.css";
import styles from "./signup-theme.module.css";

export default function SignupTemplateHeader({
  form,
  fallbackTitle,
  children,
  actions,
  imageActions,
  imageLoading,
  editing,
}: {
  form: SignupForm;
  fallbackTitle?: string;
  children?: ReactNode;
  actions?: ReactNode;
  imageActions?: ReactNode;
  imageLoading?: "eager" | "lazy";
  editing?: SignupHeaderEditing;
}) {
  const header = form.header;
  const design = resolveSignupDesign(form.appearance);
  const requestedLayout = form.appearance?.headerLayout || header?.templateId || "header-1";
  const layout = requestedLayout === "designed" && !design ? "header-3" : requestedLayout;
  const gallery = (header?.images || []).filter(Boolean);
  const cover = gallery[0] || header?.backgroundImage;
  const portrait = layout === "header-4" ? gallery[1] : gallery[0] || header?.backgroundImage;
  const position = form.appearance?.imagePosition;
  const imageStyle: CSSProperties = {
    objectPosition: position ? `${position.x}% ${position.y}%` : "center",
    ...(form.appearance?.imageFit === "contain" ? { objectFit: "contain" } : {}),
  };
  const split =
    (layout === "header-1" || layout === "header-2" || layout === "header-4") && portrait;
  const detailPencil = (section: SignupDetailsSection, label: string) =>
    editing && (
      <button
        type="button"
        className={composer.inlinePencil}
        id={`signup-edit-${section}`}
        aria-label={`Edit ${label}`}
        aria-expanded={editing.details === section}
        onClick={() => editing.onDetails(editing.details === section ? null : section)}
      >
        <Pencil size={14} aria-hidden />
      </button>
    );
  const closeDetails = () => {
    const section = editing?.details;
    editing?.onDetails(null);
    requestAnimationFrame(() =>
      document.getElementById(`signup-edit-${section}`)?.focus({ preventScroll: true }),
    );
  };
  const date = formatSignupDateRange(form);
  const content = (
    <div className={`${styles.headerContent} ${editing ? composer.editableHeader : ""}`}>
      {imageActions}
      {(header?.groupName || editing) && (
        <p
          className={styles.eyebrow}
          style={!form.appearance ? { color: header?.textColor1 || undefined } : undefined}
        >
          <InlineEditableText
            label="Group or organization"
            value={header?.groupName || ""}
            fallback=""
            maxLength={180}
            renderText={(text) => (
              <span>{text || (editing ? "Add group or organization" : "")}</span>
            )}
            onChange={
              editing
                ? (value) =>
                    editing.onChange({ ...form, header: { ...header, groupName: value || "" } })
                : undefined
            }
          />
        </p>
      )}
      <h1
        id={editing ? "signup-title" : undefined}
        className={styles.heading}
        style={!form.appearance ? { color: header?.textColor2 || undefined } : undefined}
      >
        <InlineEditableText
          label="Event title"
          value={form.title}
          fallback=""
          maxLength={180}
          renderText={(text) => (
            <span>
              {text || fallbackTitle || (editing ? "Add your event title" : "Your signup")}
            </span>
          )}
          onChange={
            editing ? (value) => editing.onChange({ ...form, title: value || "" }) : undefined
          }
        />
      </h1>
      {(form.description || editing) && (
        <p
          className={styles.description}
          style={!form.appearance ? { color: header?.textColor1 || undefined } : undefined}
        >
          <InlineEditableText
            label="Welcome message"
            value={form.description || ""}
            fallback=""
            multiline
            maxLength={4000}
            renderText={(text) => <span>{text || (editing ? "Add a welcome message" : "")}</span>}
            onChange={
              editing
                ? (value) => editing.onChange({ ...form, description: value || "" })
                : undefined
            }
          />
        </p>
      )}
      <div className={styles.metadata}>
        <span className={editing ? composer.inlineMetadata : undefined}>
          {date}
          {detailPencil("schedule", "date and time")}
        </span>
        <span className={editing ? composer.inlineMetadata : undefined}>
          {form.locationMode === "tba" ? (
            <span>Location to be announced</span>
          ) : (
            (form.location || editing) && (
              <span>
                {form.venue ? `${form.venue} · ` : ""}
                {form.locationMode === "online" &&
                form.location &&
                /^https?:\/\//i.test(form.location) ? (
                  <a href={form.location} target="_blank" rel="noopener noreferrer">
                    Join online
                  </a>
                ) : (
                  form.location || "Add location"
                )}
              </span>
            )
          )}
          {detailPencil("location", "location")}
        </span>
        {(header?.creatorName || editing) && (
          <span>
            <InlineEditableText
              label="Organizer name"
              value={header?.creatorName || ""}
              fallback=""
              maxLength={180}
              renderText={(text) => <span>{text ? `Hosted by ${text}` : "Add organizer"}</span>}
              onChange={
                editing
                  ? (value) =>
                      editing.onChange({ ...form, header: { ...header, creatorName: value || "" } })
                  : undefined
              }
            />
          </span>
        )}
      </div>
      {editing && (
        <div className={composer.inlineMetadata}>
          <span>Arrival & other details</span>
          {detailPencil("planning", "arrival and other details")}
        </div>
      )}
      {editing?.details && (
        <SignupHeaderDetailsEditor
          key={editing.details}
          form={form}
          section={editing.details}
          onChange={editing.onChange}
          onClose={closeDetails}
        />
      )}
      {children}
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
  if (layout === "designed" && design) {
    return (
      <TemplateImageTone
        enabled={form.appearance?.imageFilterEnabled !== false}
        color={
          resolveSignupThemeStyle(form)[
            "--signup-accent" as keyof ReturnType<typeof resolveSignupThemeStyle>
          ] as string
        }
      >
        <section
          className={styles.composition}
          style={
            {
              ...resolveSignupThemeStyle(form),
              "--signup-image-ratio": `${cover?.width || 3} / ${cover?.height || 2}`,
            } as CSSProperties
          }
          data-composition={design.composition}
          data-reverse={design.reverse || undefined}
          data-without-image={!cover || undefined}
          data-image-fit={form.appearance?.imageFit}
        >
          {cover && (
            <div className={styles.artwork}>
              <img
                className="template-hero-image"
                src={cover.dataUrl}
                alt=""
                loading={imageLoading}
                style={imageStyle}
                width={cover.width || 1536}
                height={cover.height || 1024}
              />
            </div>
          )}
          {content}
          <div className={styles.ornament}>
            <SignupDesignOrnament motif={design.motif} />
          </div>
        </section>
      </TemplateImageTone>
    );
  }
  return (
    <TemplateImageTone
      enabled={form.appearance?.imageFilterEnabled !== false}
      color={
        resolveSignupThemeStyle(form)[
          "--signup-accent" as keyof ReturnType<typeof resolveSignupThemeStyle>
        ] as string
      }
    >
      <section
        className={styles.header}
        style={{
          ...resolveSignupThemeStyle(form),
          ...(!form.appearance
            ? {
                backgroundColor: header?.backgroundColor || undefined,
                backgroundImage: header?.backgroundCss || undefined,
              }
            : {}),
        }}
      >
        {(layout === "header-3" || layout === "header-4") && cover && (
          <img
            className={`template-hero-image ${styles.cover}`}
            loading={imageLoading}
            src={cover.dataUrl}
            alt=""
            style={imageStyle}
            width={cover.width || 1536}
            height={cover.height || 1024}
          />
        )}
        {(layout === "header-5" || layout === "header-6") &&
          !!(gallery.length || header?.backgroundImage) && (
            <div className={`${styles.gallery} ${layout === "header-6" ? styles.three : ""}`}>
              {(gallery.length ? gallery : header?.backgroundImage ? [header.backgroundImage] : [])
                .slice(0, layout === "header-6" ? 3 : 2)
                .map((img, i) => (
                  <img
                    className="template-hero-image"
                    key={`${img.dataUrl}-${i}`}
                    src={img.dataUrl}
                    alt=""
                    style={imageStyle}
                    loading={imageLoading}
                  />
                ))}
            </div>
          )}
        {split ? (
          <div className={`${styles.split} ${layout === "header-2" ? styles.right : ""}`}>
            <img
              className={`template-hero-image ${styles.portrait}`}
              src={portrait.dataUrl}
              alt=""
              style={imageStyle}
              loading={imageLoading}
            />
            {content}
          </div>
        ) : (
          content
        )}
      </section>
    </TemplateImageTone>
  );
}
