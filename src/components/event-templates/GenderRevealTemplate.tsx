"use client";

import React from "react";
import EventTemplateBase, { type EditorBindings } from "./EventTemplateBase";

export default function GenderRevealTemplate({
  editor,
}: {
  editor: EditorBindings;
}) {
  return <EventTemplateBase editor={editor} />;
}
