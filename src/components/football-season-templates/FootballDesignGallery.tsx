"use client";

import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import AuthModal from "@/components/auth/AuthModal";
import EventDesignGallery from "@/components/events/EventDesignGallery";
import FootballGalleryHeader from "./FootballGalleryHeader";
import FootballThumbnail from "./FootballThumbnail";
import { FOOTBALL_GALLERY_DESIGNS } from "./footballGallery";

export default function FootballDesignGallery() {
  const search = useSearchParams();
  const { status } = useSession();
  const [destination, setDestination] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  return (
    <>
      <EventDesignGallery
        title="Football"
        category="football"
        header={<FootballGalleryHeader count={FOOTBALL_GALLERY_DESIGNS.length} />}
        designs={FOOTBALL_GALLERY_DESIGNS}
        getHref={(design) => {
          const params = new URLSearchParams({ templateId: design.id });
          const date = search?.get("d");
          if (date) params.set("d", date);
          return `/event/football/customize?${params.toString()}`;
        }}
        renderPreview={(design) => <FootballThumbnail design={design} />}
        onSelect={(event) => {
          if (status === "authenticated") return;
          event.preventDefault();
          setDestination(event.currentTarget.href);
        }}
      />
      <AuthModal
        open={Boolean(destination)}
        mode={authMode}
        onModeChange={setAuthMode}
        onClose={() => setDestination(null)}
        successRedirectUrl={destination || "/event/football"}
        signupIntent="football"
        description={authMode === "signup" ? "Create your account to customize your Football page." : undefined}
      />
    </>
  );
}
