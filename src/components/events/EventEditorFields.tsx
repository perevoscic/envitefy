"use client";

import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { type ChangeEvent, type ReactNode, useId, useState } from "react";
import { useSectionEditorClose } from "./EventSectionEditorContext";
import styles from "./event-editor.module.css";

export function EventEditorInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  readOnly,
  mutedValue,
  required,
  id,
  error,
  maxLength,
  rows = 5,
}: {
  label: string;
  value: string | number | null | undefined;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  readOnly?: boolean;
  mutedValue?: boolean;
  required?: boolean;
  id?: string;
  error?: string;
  maxLength?: number;
  rows?: number;
}) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const props = {
    id: fieldId,
    value: value ?? "",
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(event.target.value),
    placeholder,
    readOnly,
    required,
    maxLength,
    "aria-invalid": Boolean(error),
    "aria-describedby": error ? `${fieldId}-error` : undefined,
  };
  return (
    <div className={styles.field} data-muted={mutedValue}>
      <label htmlFor={fieldId}>{label}</label>
      {type === "textarea" ? <textarea {...props} rows={rows} /> : <input {...props} type={type} />}
      {error && (
        <span id={`${fieldId}-error`} className={styles.fieldError}>
          {error}
        </span>
      )}
    </div>
  );
}

export function EventEditorMenuCard({
  title,
  icon = <FileText size={20} />,
  desc,
  onClick,
  opacity,
  status,
  showsOnEvent,
  compact = false,
  active = false,
}: {
  title: string;
  icon?: ReactNode;
  desc: string;
  onClick: () => void;
  opacity?: string;
  status?: "not-started" | "in-progress" | "ready";
  showsOnEvent?: string;
  compact?: boolean;
  active?: boolean;
}) {
  if (compact) {
    return (
      <button
        type="button"
        className={styles.toolCard}
        onClick={onClick}
        aria-label={title}
        aria-pressed={active}
      >
        <span className={styles.toolGlow} aria-hidden="true" />
        {(["front", "back"] as const).map((face) => (
          <span
            key={face}
            className={`${styles.toolFace} ${face === "back" ? styles.toolFaceBack : styles.toolFaceFront}`}
            aria-hidden="true"
          >
            <span className={styles.menuIcon}>{icon}</span>
            <span className={styles.menuText}>
              <strong>{title}</strong>
            </span>
          </span>
        ))}
        <span className={styles.menuDescription} hidden>
          {desc}
        </span>
      </button>
    );
  }
  return (
    <button type="button" className={`${styles.menuCard} ${opacity || ""}`} onClick={onClick}>
      <span className={styles.menuIcon} aria-hidden="true">
        {icon}
      </span>
      <span className={styles.menuText}>
        <strong>{title}</strong>
        <span className={styles.menuDescription}>{desc}</span>
        {showsOnEvent && <span>Shows on event: {showsOnEvent}</span>}
        {status && (
          <span>
            {status === "ready"
              ? "Ready"
              : status === "in-progress"
                ? "In progress"
                : "Not started"}
          </span>
        )}
      </span>
      <ChevronRight size={17} aria-hidden="true" />
    </button>
  );
}

export function EventEditorToolsRow({ children }: { children: ReactNode }) {
  return (
    <div className={styles.compositionMenu} role="group" aria-label="Page tools">
      {children}
    </div>
  );
}

export function EventEditorSection({
  title,
  onBack,
  showBack = true,
  headerAction,
  children,
}: {
  title: string;
  onBack?: () => void;
  showBack?: boolean;
  headerAction?: ReactNode;
  children: ReactNode;
}) {
  const sectionDialog = useSectionEditorClose();
  if (sectionDialog) return <>{children}</>;
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        {showBack && onBack && (
          <button type="button" aria-label="Back to details" onClick={onBack}>
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
        )}
        <h2>{title}</h2>
        {headerAction}
      </div>
      {children}
    </div>
  );
}

export function EventEditorToggle({
  label,
  checked,
  onChange,
  icon,
  controls,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon?: ReactNode;
  controls?: ReactNode;
}) {
  const toggleId = useId();
  return (
    <div className={styles.toggleRow}>
      <label className={styles.toggleLabel} htmlFor={toggleId}>
        {icon && (
          <span className={styles.menuIcon} aria-hidden="true">
            {icon}
          </span>
        )}
        <span>{label}</span>
      </label>
      {controls}
      <span className={styles.toggleSwitch}>
        <input
          id={toggleId}
          type="checkbox"
          role="switch"
          aria-checked={checked}
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className={styles.toggleTrack} aria-hidden="true">
          <span />
        </span>
      </span>
    </div>
  );
}

/** Section state is presentation only; switching keeps every field mounted. */
export function EventEditorSections({
  sections,
  activeSection,
  onSectionChange,
  menuContent,
  menuFooter,
  headerAction,
}: {
  sections: {
    id: string;
    title: string;
    description: string;
    icon?: ReactNode;
    tool?: boolean;
    content: ReactNode;
  }[];
  activeSection?: string;
  onSectionChange?: (id: string) => void;
  menuContent?: ReactNode;
  menuFooter?: ReactNode;
  headerAction?: ReactNode;
}) {
  const [localSection, setLocalSection] = useState("main");
  const active = activeSection ?? localSection;
  const select = onSectionChange ?? setLocalSection;
  const tools = sections.filter((section) => section.tool);
  return (
    <div className={styles.sectionNavigation}>
      {tools.length > 0 && (
        <EventEditorToolsRow>
          {tools.map((section) => (
            <EventEditorMenuCard
              key={section.id}
              compact
              active={section.id === active}
              title={section.title}
              desc={section.description}
              icon={section.icon}
              onClick={() => select(section.id)}
            />
          ))}
        </EventEditorToolsRow>
      )}
      <div hidden={active !== "main"} className={styles.sectionMenu}>
        <header className={styles.menuHeader}>
          <h2>Add your details</h2>
          {headerAction}
        </header>
        <p>Edit your event details and design.</p>
        {menuContent}
        {sections
          .filter((section) => !section.tool)
          .map((section) => (
            <EventEditorMenuCard
              key={section.id}
              title={section.title}
              desc={section.description}
              icon={section.icon}
              onClick={() => select(section.id)}
            />
          ))}
        {menuFooter}
      </div>
      {sections.map((section) => (
        <div key={section.id} hidden={active !== section.id}>
          <EventEditorSection
            title={section.title}
            onBack={() => select("main")}
            headerAction={headerAction}
          >
            {section.content}
          </EventEditorSection>
        </div>
      ))}
    </div>
  );
}
