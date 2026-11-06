import type { ReactNode } from "react";
import { SidebarProvider } from "../../src/app/sidebar-context";
import { MainContentWrapper } from "../../src/components/MainContentWrapper";

/** Exercise the same inherited canvas as real gallery routes. */
export default function GalleryAppCanvas({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <MainContentWrapper isAuthenticated={false} reserveSidebarSpace={false}>
        {children}
      </MainContentWrapper>
    </SidebarProvider>
  );
}
