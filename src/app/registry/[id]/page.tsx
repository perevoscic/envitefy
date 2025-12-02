import { notFound } from "next/navigation";
import { getEventHistoryById, listRegistryItemsByEventId } from "@/lib/db";
import { decorateAmazonUrl } from "@/utils/affiliates";

export const dynamic = "force-dynamic";

const getProvider = (url: string) => {
  const lower = url.toLowerCase();
  if (lower.includes("amazon.")) return "Amazon";
  if (lower.includes("zola.")) return "Zola";
  if (lower.includes("crateandbarrel.")) return "Crate & Barrel";
  if (lower.includes("honeyfund.")) return "Honeyfund";
  return "Link";
};

const buildPurchaseUrl = (rawUrl: string, category: string | null | undefined) => {
  const lower = rawUrl.toLowerCase();
  if (lower.includes("amazon.")) {
    return decorateAmazonUrl(rawUrl, {
      category: category || "wedding",
      viewer: "guest",
      strictCategoryOnly: false,
    });
  }
  return rawUrl;
};

type PageProps = {
  params: { id: string };
};

export default async function RegistryPage({ params }: PageProps) {
  const row = await getEventHistoryById(params.id);
  if (!row) return notFound();

  const items = await listRegistryItemsByEventId(params.id);
  const eventData = (row.data as any) || {};
  const category = typeof eventData.category === "string" ? eventData.category : "wedding";
  const couple = eventData.couple || {};
  const defaultTitle =
    [couple.partner1 || "", couple.partner2 || ""].filter(Boolean).join(" & ") || "Registry";
  const title = row.title || defaultTitle;
  const description =
    "Thank you for celebrating with us. Your presence is the greatest gift, but if you’d like to give something extra, here are a few things that would help us start our next chapter.";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-serif font-semibold mb-2">{title}</h1>
        <p className="text-sm text-slate-600 mb-6">{description}</p>
        <p className="text-xs text-slate-500 mb-4">
          Supports Amazon today; Zola, Crate &amp; Barrel, and Honeyfund links will work here as
          they’re added.
        </p>

        {items.length === 0 ? (
          <p className="text-sm text-slate-500">
            No registry items yet. Check back soon!
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => {
              const remaining = item.quantity - item.claimed;
              const soldOut = remaining <= 0;
              const href = buildPurchaseUrl(item.affiliate_url, category);
              const provider = getProvider(item.affiliate_url);

              return (
                <div
                  key={item.id}
                  className="flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden"
                >
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="h-40 w-full object-cover bg-slate-100"
                  />
                  <div className="flex-1 p-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium line-clamp-2">{item.title}</p>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                        {provider}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {item.price || ""} {item.category && `• ${item.category}`}
                    </p>
                    <p className="text-xs text-slate-500">
                      {soldOut
                        ? "All requested gifts have been purchased."
                        : remaining === item.quantity
                        ? `Quantity requested: ${item.quantity}`
                        : `Remaining: ${remaining} of ${item.quantity}`}
                    </p>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`mt-auto inline-flex items-center justify-center rounded-md px-3 py-2 text-xs font-semibold ${
                        soldOut
                          ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                          : "bg-emerald-600 text-white hover:bg-emerald-700"
                      }`}
                    >
                      {soldOut ? "Purchased" : `Buy on ${provider}`}
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
