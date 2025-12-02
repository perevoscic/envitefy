import { notFound } from "next/navigation";
import { getEventHistoryBySlugOrId, listRegistryItemsByEventId } from "@/lib/db";
import { decorateAmazonUrl } from "@/utils/affiliates";

export const dynamic = "force-dynamic";

type PageProps = {
  params: { id: string };
};

export default async function WeddingRegistryPage({ params }: PageProps) {
  const row = await getEventHistoryBySlugOrId({ value: params.id });

  if (!row) {
    return notFound();
  }

  const items = await listRegistryItemsByEventId(row.id);
  const hasItems = items.length > 0;

  const eventData = (row.data as any) || {};
  const couple = eventData.couple || {};
  const title =
    row.title ||
    [couple.partner1 || "", couple.partner2 || ""]
      .filter(Boolean)
      .join(" & ") ||
    "Wedding Registry";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-serif font-semibold mb-2">{title}</h1>
        <p className="text-sm text-slate-600 mb-6">
          Thank you for celebrating with us. Your presence is the greatest gift,
          but if you&apos;d like to give something extra, here are a few things
          that would help us start our life together.
        </p>

        {!hasItems && (
          <p className="text-sm text-slate-500">
            The couple hasn&apos;t added any registry items yet.
          </p>
        )}

        {hasItems && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => {
              const remaining = item.quantity - item.claimed;
              const soldOut = remaining <= 0;
              const url = decorateAmazonUrl(item.affiliate_url, {
                category: "wedding",
                viewer: "guest",
                strictCategoryOnly: false,
              });

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
                  <div className="flex-1 p-4 flex flex-col">
                    <p className="text-sm font-medium mb-1 line-clamp-2">
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-500 mb-2">
                      {item.price || ""} {item.category && `• ${item.category}`}
                    </p>
                    <p className="text-xs text-slate-500 mb-3">
                      {soldOut
                        ? "All requested gifts have been purchased."
                        : remaining === item.quantity
                        ? `Quantity requested: ${item.quantity}`
                        : `Remaining: ${remaining} of ${item.quantity}`}
                    </p>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`mt-auto inline-flex items-center justify-center rounded-md px-3 py-2 text-xs font-semibold ${
                        soldOut
                          ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                          : "bg-emerald-600 text-white hover:bg-emerald-700"
                      }`}
                    >
                      {soldOut ? "Purchased" : "Buy gift on Amazon"}
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
