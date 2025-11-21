import { useState, useEffect, useCallback } from "react";
import { getCategoryIcon, getColorByCategory } from "@/lib/event-colors";

// The canonical list of categories shown in menus
export const CATEGORY_OPTIONS = [
  "Appointments",
  "Baby Showers",
  "Birthdays",
  "General Events",
  "Weddings",
  "Sport Events",
  "DR Appointments",
  "Car Pool",
] as const;

export type HistoryItem = {
  id: string;
  title: string;
  created_at?: string;
  category?: string;
  data?: any;
};

export type CategoryData = {
  name: string;
  count: number;
  icon: string;
  color: string; // tailwind class for dot/text/etc
  tileColor?: string; // hex for tile background
  items: HistoryItem[];
};

export function useEventCategories() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/history?view=summary&limit=100", {
        cache: "no-cache",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({ items: [] }));
      const items = (Array.isArray(data?.items) ? data.items : []).map((item: any) => ({
        ...item,
        category: item.category || item.data?.category,
      }));
      setHistory(items);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
    
    const onHistoryChanged = (event: Event) => {
        // Optimistic updates could go here, or just reload
        loadHistory();
    };
    
    if (typeof window !== "undefined") {
        window.addEventListener("history:created", onHistoryChanged);
        window.addEventListener("history:deleted", onHistoryChanged);
    }
    return () => {
        if (typeof window !== "undefined") {
            window.removeEventListener("history:created", onHistoryChanged);
            window.removeEventListener("history:deleted", onHistoryChanged);
        }
    };
  }, [loadHistory]);

  // Group events by category
  const categories: CategoryData[] = CATEGORY_OPTIONS.map(cat => {
    const items = history.filter(h => {
        const itemCat = h.category || "General Events";
        // Simple normalization for robust matching
        return itemCat.toLowerCase() === cat.toLowerCase() || 
               (cat === "General Events" && !CATEGORY_OPTIONS.some(c => c.toLowerCase() === itemCat.toLowerCase() && c !== "General Events"));
    });
    
    const colorInfo = getColorByCategory(cat);

    return {
        name: cat,
        count: items.length,
        icon: getCategoryIcon(cat),
        color: colorInfo.dot, 
        tileColor: colorInfo.tile,
        items
    };
  }).filter(c => c.count > 0 || ["Birthdays", "Weddings", "Baby Showers", "Appointments", "General Events"].includes(c.name)); // Always show main ones even if empty? Or just non-empty? Screenshot shows 0 counts maybe? No, it shows 1, 3, 16 etc. Let's show all relevant ones.

  return { history, categories, loading, refresh: loadHistory };
}

