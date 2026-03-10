import { redirect } from "next/navigation";

type SearchParams = { [key: string]: string | string[] | undefined };
type SnapRedirectProps = {
  searchParams?: Promise<SearchParams>;
};

export default async function SnapRedirect({ searchParams }: SnapRedirectProps) {
  const awaitedSearchParams = (await searchParams) ?? {};
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(awaitedSearchParams)) {
    if (Array.isArray(value)) {
      value.forEach((v) => {
        if (v != null) params.append(key, v);
      });
    } else if (value != null) {
      params.set(key, value);
    }
  }

  const query = params.toString();
  redirect(query ? `/?${query}` : "/");
}
