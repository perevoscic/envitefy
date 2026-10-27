import type { ReactNode } from "react";

// Chrome, account dialogs and galleries have independent browser suites. Keep all
// actual route sections, guest samples and their styles in this appearance fixture.
export default function OmittedInfrastructure() {
  return null;
}

export function Gallery({ category }: { category: string }) {
  return <section id="templates" data-fixture-gallery={category} />;
}

export function Script({ children }: { children: ReactNode }) {
  return <script type="application/ld+json">{children}</script>;
}
