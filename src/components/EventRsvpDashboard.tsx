"use client";

import { useEffect, useState } from "react";

type RsvpStats = {
  yes: number;
  no: number;
  maybe: number;
  filled: number;
  remaining: number;
  numberOfGuests: number;
};

export default function EventRsvpDashboard({
  eventId,
  initialNumberOfGuests = 0,
}: {
  eventId: string;
  initialNumberOfGuests?: number;
}) {
  const [stats, setStats] = useState<RsvpStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/events/${eventId}/rsvp`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.ok) {
          setStats({
            yes: data.stats?.yes || 0,
            no: data.stats?.no || 0,
            maybe: data.stats?.maybe || 0,
            filled: data.filled || 0,
            remaining: data.remaining || 0,
            numberOfGuests: data.numberOfGuests || initialNumberOfGuests,
          });
        }
      } catch (err) {
        console.error("Failed to fetch RSVP stats:", err);
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchStats();
      // Refresh stats every 10 seconds
      const interval = setInterval(fetchStats, 10000);
      return () => clearInterval(interval);
    }
  }, [eventId, initialNumberOfGuests]);

  // Show dashboard even while loading, using initialNumberOfGuests
  const displayStats: RsvpStats = stats || {
    yes: 0,
    no: 0,
    maybe: 0,
    filled: 0,
    remaining: initialNumberOfGuests,
    numberOfGuests: initialNumberOfGuests,
  };

  // Don't show dashboard if no guests set and no stats after loading completes
  if (displayStats.numberOfGuests === 0 && !stats && !loading) {
    return null;
  }

  const percentage =
    displayStats.numberOfGuests > 0
      ? Math.round((displayStats.filled / displayStats.numberOfGuests) * 100)
      : 0;

  return (
    <section className="rounded border border-border p-4 bg-surface">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-foreground/80 mb-1">
          Host dashboard
        </h3>
      </div>
      {displayStats.numberOfGuests > 0 ? (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {displayStats.numberOfGuests}
              </div>
              <div className="text-xs text-foreground/60 mt-1">TOTAL</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {displayStats.filled}
              </div>
              <div className="text-xs text-foreground/60 mt-1">FILLED</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {displayStats.remaining}
              </div>
              <div className="text-xs text-foreground/60 mt-1">REMAINING</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-foreground/70 mb-1">
              <span>Progress</span>
              <span>{percentage}%</span>
            </div>
            <div className="w-full bg-foreground/10 rounded-full h-2">
              <div
                className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </div>
        </>
      ) : null}
      <div
        className={`mt-4 ${
          displayStats.numberOfGuests > 0 ? "pt-3 border-t border-border" : ""
        }`}
      >
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <span className="text-green-600 dark:text-green-400 font-semibold">
              ✅ {displayStats.yes}
            </span>
            <div className="text-foreground/60 mt-1">Yes</div>
          </div>
          <div className="text-center">
            <span className="text-red-600 dark:text-red-400 font-semibold">
              ❌ {displayStats.no}
            </span>
            <div className="text-foreground/60 mt-1">No</div>
          </div>
          <div className="text-center">
            <span className="text-yellow-600 dark:text-yellow-400 font-semibold">
              🤔 {displayStats.maybe}
            </span>
            <div className="text-foreground/60 mt-1">Maybe</div>
          </div>
        </div>
      </div>
    </section>
  );
}
