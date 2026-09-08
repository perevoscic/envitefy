import type { ReactNode } from "react";
import { parseCalendarDateTimeToIso } from "@/lib/calendar-date-time";
import { getSignupDesign } from "@/lib/signup-designs";
import { resolveSignupThemeStyle } from "@/lib/signup-themes";
import type { SignupForm } from "@/types/signup";
import SignupDesignOrnament from "./SignupDesignOrnament";
import styles from "./signup-theme.module.css";

export default function SignupTemplateHeader({
  form,
  fallbackTitle,
  children,
  actions,
  imageLoading,
}: {
  form: SignupForm;
  fallbackTitle?: string;
  children?: ReactNode;
  actions?: ReactNode;
  imageLoading?: "eager" | "lazy";
}) {
  const header = form.header;
  const design = getSignupDesign(form.appearance?.designId);
  const requestedLayout = form.appearance?.headerLayout || header?.templateId || "header-1";
  const layout = requestedLayout === "designed" && !design ? "header-3" : requestedLayout;
  const gallery = (header?.images || []).filter(Boolean);
  const cover = gallery[0] || header?.backgroundImage;
  const portrait = layout === "header-4" ? gallery[1] : gallery[0] || header?.backgroundImage;
  const position = form.appearance?.imagePosition;
  const imageStyle = { objectPosition: position ? `${position.x}% ${position.y}%` : "center" };
  const split =
    (layout === "header-1" || layout === "header-2" || layout === "header-4") && portrait;
  const date = (() => {
    if (!form.start) return "Date to be announced";
    try {
      const local = /^\d{4}-\d{2}-\d{2}$/.test(form.start);
      const value = new Date(
        local
          ? `${form.start}T12:00:00Z`
          : parseCalendarDateTimeToIso(form.start, form.timezone) || form.start,
      );
      return new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        ...(!local && !form.allDay ? ({ hour: "numeric", minute: "2-digit" } as const) : {}),
        timeZone: local ? "UTC" : form.timezone || "UTC",
      }).format(value);
    } catch {
      return form.start;
    }
  })();
  const content = (
    <div className={styles.headerContent}>
      {header?.groupName && (
        <p
          className={styles.eyebrow}
          style={!form.appearance ? { color: header.textColor1 || undefined } : undefined}
        >
          {header.groupName}
        </p>
      )}
      <h1
        className={styles.heading}
        style={!form.appearance ? { color: header?.textColor2 || undefined } : undefined}
      >
        {form.title || fallbackTitle || "Your signup"}
      </h1>
      {form.description && (
        <p
          className={styles.description}
          style={!form.appearance ? { color: header?.textColor1 || undefined } : undefined}
        >
          {form.description}
        </p>
      )}
      <div className={styles.metadata}>
        <span>{date}</span>
        {form.locationMode === "tba" ? (
          <span>Location to be announced</span>
        ) : (
          form.location && (
            <span>
              {form.venue ? `${form.venue} · ` : ""}
              {form.locationMode === "online" && /^https?:\/\//i.test(form.location) ? (
                <a href={form.location} target="_blank" rel="noopener noreferrer">
                  Join online
                </a>
              ) : (
                form.location
              )}
            </span>
          )
        )}
        {header?.creatorName && <span>Hosted by {header.creatorName}</span>}
      </div>
      {children}
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
  if (layout === "designed" && design) {
    return (
      <section
        className={styles.composition}
        style={resolveSignupThemeStyle(form)}
        data-composition={design.composition}
        data-reverse={design.reverse || undefined}
        data-without-image={!cover || undefined}
      >
        {cover && (
          <div className={styles.artwork}>
            <img
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
    );
  }
  return (
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
          className={styles.cover}
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
            className={styles.portrait}
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
  );
}
