import { redirect } from "next/navigation";
import GymnasticsLauncher from "@/components/event-create/GymnasticsLauncher";

type GymnasticsPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function GymnasticsPage({ searchParams }: GymnasticsPageProps) {
  const technicalKeys = new Set(["edit", "embed", "updated", "t"]);
  const params = new URLSearchParams();
  const entries = Object.entries(searchParams || {});
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

  const defaultDateParam = params.get("d") || undefined;
  return <GymnasticsLauncher defaultDateParam={defaultDateParam} />;
}
