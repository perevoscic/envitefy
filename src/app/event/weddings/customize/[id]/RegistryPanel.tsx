"use client";

import { useEffect, useState } from "react";

type RegistryItem = {
  id: string;
  event_id: string;
  title: string;
  affiliate_url: string;
  image_url: string;
  price: string | null;
  quantity: number;
  claimed: number;
  category: string | null;
  notes: string | null;
};

const CATEGORY_OPTIONS = [
  "All",
  "Kitchen",
  "Dining",
  "Bedroom",
  "Bathroom",
  "Living Room",
  "Decor",
  "Travel",
  "Experiences",
  "Cash Fund",
];

export default function RegistryPanel({ eventId }: { eventId: string }) {
  const [items, setItems] = useState<RegistryItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autofilling, setAutofilling] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState("All");

  const [form, setForm] = useState({
    url: "",
    title: "",
    affiliateUrl: "",
    imageUrl: "",
    price: "",
    quantity: 1,
    category: "",
    notes: "",
  });

  const loadItems = async () => {
    if (!eventId) return;
    setLoadingItems(true);
    try {
      const res = await fetch(`/api/registry/list?eventId=${encodeURIComponent(eventId)}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        return;
      }
      const data = (await res.json()) as RegistryItem[];
      setItems(Array.isArray(data) ? data : []);
    } catch {
      // ignore
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [eventId]);

  const handleAutofill = async () => {
    if (!form.url) return;
    setAutofilling(true);
    try {
      const res = await fetch("/api/registry/autofill", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: form.url }),
      });
      if (!res.ok) return;
      const meta = await res.json();
      setForm((prev) => ({
        ...prev,
        affiliateUrl: prev.affiliateUrl || form.url,
        title: meta.title || prev.title,
        imageUrl: meta.imageUrl || prev.imageUrl,
        price: meta.price || prev.price,
      }));
    } catch {
      // ignore
    } finally {
      setAutofilling(false);
    }
  };

  const handleSave = async () => {
    if (!eventId || !form.title.trim() || !form.imageUrl.trim()) return;
    setSaving(true);
    try {
      const payload = {
        eventId,
        title: form.title.trim(),
        affiliateUrl: (form.affiliateUrl || form.url).trim(),
        imageUrl: form.imageUrl.trim(),
        price: form.price.trim() || undefined,
        quantity: Number(form.quantity) || 1,
        category: form.category.trim() || undefined,
        notes: form.notes.trim() || undefined,
      };

      const res = await fetch("/api/registry/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // eslint-disable-next-line no-console
        console.error("[RegistryPanel] save failed", await res.json().catch(() => ({})));
      } else {
        setForm({
          url: "",
          title: "",
          affiliateUrl: "",
          imageUrl: "",
          price: "",
          quantity: 1,
          category: "",
          notes: "",
        });
        loadItems();
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[RegistryPanel] save error", err);
    } finally {
      setSaving(false);
    }
  };

  const availableCategories = Array.from(
    new Set(
      items
        .map((i) => i.category || "")
        .filter((c) => c && c.trim().length > 0)
    )
  );

  const filteredItems =
    activeCategoryFilter === "All"
      ? items
      : items.filter(
          (item) =>
            (item.category || "").toLowerCase() ===
            activeCategoryFilter.toLowerCase()
        );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h3 className="text-lg font-semibold text-slate-800">Registry</h3>
        <p className="text-xs text-slate-500">
          Paste an Amazon link, autofill details, then add to your registry.
        </p>
      </div>

      <div className="space-y-3 rounded-xl border border-slate-200 p-4 bg-white">
        <label className="space-y-1 block">
          <span className="text-sm font-medium">Amazon product URL</span>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-md border px-3 py-2 text-sm"
              placeholder="https://www.amazon.com/..."
              value={form.url}
              onChange={(e) =>
                setForm((f) => ({ ...f, url: e.target.value }))
              }
            />
            <button
              type="button"
              onClick={handleAutofill}
              disabled={autofilling || !form.url}
              className="rounded-md border px-3 py-2 text-sm bg-slate-900 text-white disabled:opacity-60"
            >
              {autofilling ? "Autofilling..." : "Autofill"}
            </button>
          </div>
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="space-y-1 block">
            <span className="text-sm font-medium">Product title</span>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              placeholder="KitchenAid Stand Mixer"
            />
          </label>

          <label className="space-y-1 block">
            <span className="text-sm font-medium">Price (optional)</span>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.price}
              onChange={(e) =>
                setForm((f) => ({ ...f, price: e.target.value }))
              }
              placeholder="$349.00"
            />
          </label>

          <label className="space-y-1 block">
            <span className="text-sm font-medium">Affiliate URL</span>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.affiliateUrl}
              onChange={(e) =>
                setForm((f) => ({ ...f, affiliateUrl: e.target.value }))
              }
              placeholder="SiteStripe link with tag"
            />
          </label>

          <label className="space-y-1 block">
            <span className="text-sm font-medium">Image URL</span>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.imageUrl}
              onChange={(e) =>
                setForm((f) => ({ ...f, imageUrl: e.target.value }))
              }
              placeholder="https://m.media-amazon.com/images/I/..."
            />
          </label>

          <label className="space-y-1 block">
            <span className="text-sm font-medium">Category</span>
            <select
              className="w-full rounded-md border px-3 py-2 text-sm bg-white"
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({ ...f, category: e.target.value }))
              }
            >
              <option value="">Select category</option>
              {CATEGORY_OPTIONS.filter((c) => c !== "All").map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 block">
            <span className="text-sm font-medium">Quantity</span>
            <input
              type="number"
              min={1}
              max={99}
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.quantity}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  quantity: Number(e.target.value) || 1,
                }))
              }
            />
          </label>

          <label className="space-y-1 block md:col-span-2">
            <span className="text-sm font-medium">Notes (optional)</span>
            <textarea
              className="w-full rounded-md border px-3 py-2 text-sm"
              rows={2}
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              placeholder="Color preferences, sizes, or anything guests should know."
            />
          </label>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !form.title.trim() || !form.imageUrl.trim()}
          className="mt-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {saving ? "Saving..." : "Add item"}
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-600">
            Your registry items
          </h4>
          {availableCategories.length > 0 && (
            <select
              className="rounded-md border px-2 py-1 text-xs text-slate-600 bg-white"
              value={activeCategoryFilter}
              onChange={(e) => setActiveCategoryFilter(e.target.value)}
            >
              <option value="All">All categories</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}
        </div>

        {loadingItems && (
          <p className="text-xs text-slate-500">Loading registry…</p>
        )}

        {!loadingItems && filteredItems.length === 0 && (
          <p className="text-xs text-slate-500">
            No items yet. Paste an Amazon URL to get started.
          </p>
        )}

        <div className="space-y-3">
          {filteredItems.map((item) => {
            const remaining = item.quantity - item.claimed;
            const soldOut = remaining <= 0;
            return (
              <div
                key={item.id}
                className="flex gap-3 rounded-lg border border-slate-200 bg-white p-3"
              >
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="h-16 w-16 rounded object-cover bg-slate-100"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  <p className="text-xs text-slate-500">
                    {item.price || ""}{" "}
                    {item.category ? `• ${item.category}` : ""}
                  </p>
                  <p className="text-xs text-slate-500">
                    {soldOut
                      ? "All requested gifts have been claimed."
                      : remaining === item.quantity
                      ? `Quantity requested: ${item.quantity}`
                      : `Remaining: ${remaining} of ${item.quantity}`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

