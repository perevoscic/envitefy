import { redirect } from "next/navigation";
import GymnasticsLauncher from "@/components/event-create/GymnasticsLauncher";

type SearchParams = Record<string, string | string[] | undefined>;

type GymnasticsPageProps = {
  searchParams?: Promise<SearchParams> | SearchParams;
};

export default async function GymnasticsPage({
  searchParams,
}: GymnasticsPageProps) {
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
    redirect(`/event/gymnastics/customize${qs ? `?${qs}` : ""}`);
  }

  return <GymnasticsLauncher forwardQueryString={qs || undefined} />;
}
