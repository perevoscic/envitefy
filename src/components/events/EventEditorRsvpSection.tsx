"use client";

import { type ReactNode, useContext } from "react";
import { createPortal } from "react-dom";
import { EventEditorSection, EventEditorSwitch } from "./EventEditorFields";
import { EventSectionEditorHeaderTarget, useSectionEditorClose } from "./EventSectionEditorContext";

export default function EventEditorRsvpSection({ title = "RSVP", enabled, onEnabledChange, onBack, toggleLabel = "Enable RSVP", children }: {
  title?: string;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  onBack?: () => void;
  toggleLabel?: string;
  children: ReactNode;
}) {
  const sectionDialog = useSectionEditorClose();
  const headerTarget = useContext(EventSectionEditorHeaderTarget);
  const toggle = <EventEditorSwitch label={toggleLabel} checked={enabled} onChange={onEnabledChange} />;
  return <EventEditorSection title={title} onBack={onBack} action={toggle}>
    {sectionDialog && headerTarget && createPortal(toggle, headerTarget)}
    <div hidden={!enabled}>{children}</div>
  </EventEditorSection>;
}
