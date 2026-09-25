"use client";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { customEventCategory, stageCustomEventPage } from "@/lib/event-custom-design";
import CreateWithEnvitefyCallout from "./CreateWithEnvitefyCallout";

const EventCustomThemeDialog = dynamic(() => import("./custom/EventCustomThemeDialog"), {
  ssr: false,
});

export default function EventCustomThemeLauncher({
  category,
  contained = false,
}: {
  category: string;
  contained?: boolean;
}) {
  const router = useRouter();
  const search = useSearchParams();
  const { status } = useSession();
  const [open, setOpen] = useState(search?.get("customTheme") === "1");
  const key = customEventCategory(category);
  if (!key) return null;
  return (
    <div className={contained ? "my-8" : "mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-12"}>
      <CreateWithEnvitefyCallout category={key} onClick={() => setOpen(true)} />
      {open && status === "authenticated" && (
        <EventCustomThemeDialog
          category={key}
          initialMessage={
            search?.get("themeExpired") === "1"
              ? "That preview is no longer available. Create a new design to continue."
              : undefined
          }
          onClose={() => setOpen(false)}
          onUseDesign={(page) => {
            const selectedDate = search?.get("d");
            const details =
              selectedDate && !page.details.date && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)
                ? { ...page.details, date: selectedDate }
                : page.details;
            const token = stageCustomEventPage({ ...page, details });
            setOpen(false);
            router.push(
              `/event/design/customize?category=${key}&themePreview=${encodeURIComponent(token)}`,
            );
          }}
        />
      )}
    </div>
  );
}
