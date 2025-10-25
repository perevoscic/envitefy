import { redirect } from "next/navigation";

type SearchParams = { [key: string]: string | string[] | undefined };

export default function SnapRedirect({
  searchParams = {},
}: {
  searchParams?: SearchParams;
}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
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
