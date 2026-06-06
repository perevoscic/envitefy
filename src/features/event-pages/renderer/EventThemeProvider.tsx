import type { ReactNode } from "react";
import type { EventTheme } from "../schemas/eventBlueprint.schema";
import { buildEventThemeStyle } from "../themes/cssVariableBuilder";

export function EventThemeProvider({
  theme,
  children,
}: {
  theme: EventTheme;
  children: ReactNode;
}) {
  return (
    <div
      style={buildEventThemeStyle(theme)}
      className="min-h-screen bg-[var(--event-page-bg)] text-[var(--event-page-text)]"
    >
      {children}
    </div>
  );
}
