import { redirect } from "next/navigation";
import FootballDesignGallery from "@/components/football-season-templates/FootballDesignGallery";

export default async function FootballPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const search = (await searchParams) ?? {};
  if (["edit", "embed", "updated", "t"].some((key) => key in search)) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(search)) {
      for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) {
        params.append(key, item);
      }
    }
    redirect(`/event/football/customize?${params.toString()}`);
  }
  return <FootballDesignGallery />;
}
