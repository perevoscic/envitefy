import { permanentRedirect } from "next/navigation";

type LegacyCreatePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LegacyConciergePage({ searchParams }: LegacyCreatePageProps) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries((await searchParams) || {})) {
    for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) {
      query.append(key, item);
    }
  }
  const suffix = query.toString();
  permanentRedirect(`/envitefy-create${suffix ? `?${suffix}` : ""}`);
}
