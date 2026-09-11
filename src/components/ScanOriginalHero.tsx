"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { createContext, type ReactNode, useContext, useRef, useState } from "react";
import type { ScanOriginalDocument } from "@/lib/ocr/scan-media";
import OriginalDocumentViewer from "./OriginalDocumentViewer";
import { useOriginalDocument } from "./useOriginalDocument";

const OriginalHeroContext = createContext<{
  open: () => void;
  prepare: () => void;
  downloadUrl: string;
  fileName: string;
} | null>(null);
export const useScanOriginalHero = () => useContext(OriginalHeroContext);

export function ScanOriginalHeroProvider({
  original,
  children,
}: {
  original: ScanOriginalDocument | null;
  children: ReactNode;
}) {
  return original ? (
    <OriginalHeroViewer key={original.viewUrl} original={original}>
      {children}
    </OriginalHeroViewer>
  ) : (
    children
  );
}

function OriginalHeroViewer({
  original,
  children,
}: {
  original: ScanOriginalDocument;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const returnFocus = useRef<HTMLElement | null>(null);
  const loaded = useOriginalDocument(original);
  const openOriginal = () => {
    returnFocus.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    loaded.prepare();
    setOpen(true);
  };
  return (
    <OriginalHeroContext.Provider
      value={{
        open: openOriginal,
        prepare: loaded.prepare,
        downloadUrl: loaded.document?.url || original.downloadUrl,
        fileName: loaded.document?.file.name || original.name,
      }}
    >
      <Dialog.Root open={open} onOpenChange={setOpen}>
        {children}
        <OriginalDocumentViewer
          original={original}
          open={open}
          document={loaded.document}
          displayDocument={loaded.displayDocument}
          loadError={loaded.loadError}
          originalLoadError={loaded.originalLoadError}
          onRetry={loaded.retry}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            returnFocus.current?.focus();
          }}
        />
      </Dialog.Root>
    </OriginalHeroContext.Provider>
  );
}
