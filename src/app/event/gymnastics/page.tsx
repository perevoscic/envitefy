import { redirect } from "next/navigation";

type GymnasticsPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function GymnasticsPage({ searchParams }: GymnasticsPageProps) {
  const params = new URLSearchParams();
  const entries = Object.entries(searchParams || {});

  for (const [key, value] of entries) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string") params.append(key, item);
      }
      continue;
    }
    if (typeof value === "string") params.set(key, value);
  }

  const qs = params.toString();
  redirect(`/event/gymnastics/customize${qs ? `?${qs}` : ""}`);
}
