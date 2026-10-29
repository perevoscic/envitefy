import { Suspense } from "react";
import WeddingDesignGallery from "@/components/weddings/WeddingDesignGallery";

export default function NewWeddingEventPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-transparent" aria-label="Loading wedding designs" />
      }
    >
      <WeddingDesignGallery />
    </Suspense>
  );
}
