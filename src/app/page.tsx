import { redirect } from "next/navigation";
import Dashboard from "@/components/Dashboard";

type SearchParams = Record<string, string | string[] | undefined>;

type HomeProps = {
  searchParams?: Promise<SearchParams>;
};

export default async function Home({ searchParams }: HomeProps) {
  const awaitedSearchParams = (await searchParams) ?? {};
  const edit = awaitedSearchParams.edit;
  const demo = awaitedSearchParams.demo;
  const hasDemoEdit =
    typeof edit === "string" &&
    edit.trim().length > 0 &&
    (typeof demo === "string" ? demo === "1" : Array.isArray(demo) ? demo.includes("1") : false);

  if (hasDemoEdit) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(awaitedSearchParams)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          if (typeof item === "string") params.append(key, item);
        }
        continue;
      }
      if (typeof value === "string") params.set(key, value);
    }
    redirect(`/event/gymnastics/customize${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return <Dashboard />;
}
