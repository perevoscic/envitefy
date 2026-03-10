import { redirect } from "next/navigation";
import FootballLauncher from "@/components/event-create/FootballLauncher";

type SearchParams = Record<string, string | string[] | undefined>;

type FootballPageProps = {
  searchParams?: Promise<SearchParams>;
};

export default async function FootballPage({
  searchParams,
}: FootballPageProps) {
  const technicalKeys = new Set(["edit", "embed", "updated", "t"]);
  const params = new URLSearchParams();
  const awaitedSearchParams = (await searchParams) ?? {};
  const entries = Object.entries(awaitedSearchParams);
  let hasTechnicalParam = false;

  for (const [key, value] of entries) {
    if (technicalKeys.has(key)) hasTechnicalParam = true;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string") params.append(key, item);
      }
      continue;
    }
    if (typeof value === "string") params.set(key, value);
  }

  const qs = params.toString();
  if (hasTechnicalParam) {
    redirect(`/event/football/customize${qs ? `?${qs}` : ""}`);
  }

  return <FootballLauncher forwardQueryString={qs || undefined} />;
}
