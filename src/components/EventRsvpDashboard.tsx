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

type RsvpResponse = {
  name: string | null;
  email: string | null;
  response: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export default function EventRsvpDashboard({
  eventId,
  initialNumberOfGuests = 0,
}: {
  eventId: string;
  initialNumberOfGuests?: number;
}) {
  const [stats, setStats] = useState<RsvpStats | null>(null);
  const [responses, setResponses] = useState<RsvpResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/events/${eventId}/rsvp`, {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json();
        if (data.ok) {
          console.log("[RSVP Dashboard] Stats updated:", data);
          setStats({
            yes: data.stats?.yes || 0,
            no: data.stats?.no || 0,
            maybe: data.stats?.maybe || 0,
            filled: data.filled || 0,
            remaining: data.remaining || 0,
            numberOfGuests: data.numberOfGuests || initialNumberOfGuests,
          });
          setResponses(Array.isArray(data.responses) ? data.responses : []);
        } else {
          console.error("Failed to fetch RSVP stats:", data.error);
        }
      } catch (err) {
        console.error("Failed to fetch RSVP stats:", err);
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchStats();
      // Refresh stats every 5 minutes to save resources
      // Immediate updates still happen via custom event listener when users RSVP
      const interval = setInterval(fetchStats, 5 * 60 * 1000);

      // Also listen for custom RSVP submission events
      const handleRsvpSubmit = () => {
        console.log(
          "[RSVP Dashboard] RSVP submitted event received, refreshing..."
        );
        // Small delay to ensure API has processed the request
        setTimeout(() => {
          fetchStats();
        }, 500);
      };
      window.addEventListener("rsvp-submitted", handleRsvpSubmit);

      return () => {
        clearInterval(interval);
        window.removeEventListener("rsvp-submitted", handleRsvpSubmit);
      };
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
    <section className="rounded-lg border border-border bg-background/70 p-4 space-y-3">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">
          Host dashboard
        </h3>
        {displayStats.numberOfGuests > 0 && (
          <div className="flex items-end gap-4 sm:gap-5">
            <div className="text-center leading-none">
              <div className="font-mono font-extrabold text-3xl sm:text-4xl text-sky-600">
                {displayStats.numberOfGuests}
              </div>
              <div className="mt-1 text-[10px] sm:text-xs uppercase tracking-wider text-foreground/60">
                Total
              </div>
            </div>
            <div className="text-center leading-none">
              <div className="font-mono font-extrabold text-3xl sm:text-4xl text-emerald-600">
                {displayStats.yes}
              </div>
              <div className="mt-1 text-[10px] sm:text-xs uppercase tracking-wider text-foreground/60">
                Yes
              </div>
            </div>
            <div className="text-center leading-none">
              <div className="font-mono font-extrabold text-3xl sm:text-4xl text-yellow-600">
                {displayStats.maybe}
              </div>
              <div className="mt-1 text-[10px] sm:text-xs uppercase tracking-wider text-foreground/60">
                Maybe
              </div>
            </div>
            <div className="text-center leading-none">
              <div className="font-mono font-extrabold text-3xl sm:text-4xl text-red-600">
                {displayStats.no}
              </div>
              <div className="mt-1 text-[10px] sm:text-xs uppercase tracking-wider text-foreground/60">
                No
              </div>
            </div>
            <div className="text-center leading-none">
              <div className="font-mono font-extrabold text-3xl sm:text-4xl text-violet-600">
                {displayStats.remaining}
              </div>
              <div className="mt-1 text-[10px] sm:text-xs uppercase tracking-wider text-foreground/60">
                Remaining
              </div>
            </div>
          </div>
        )}
      </header>
      {responses.length > 0 && (
        <div className="pt-3 border-t border-border space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground/60 mb-2">
            Responses
          </h4>
          <div className="space-y-1.5">
            {responses.map((rsvp, index) => {
              const displayName = rsvp.name || rsvp.email || "Anonymous";
              const responseColor =
                rsvp.response === "yes"
                  ? "text-emerald-600"
                  : rsvp.response === "no"
                  ? "text-red-600"
                  : "text-yellow-600";
              const responseIcon =
                rsvp.response === "yes"
                  ? "✅"
                  : rsvp.response === "no"
                  ? "❌"
                  : "🤔";
              const responseLabel =
                rsvp.response === "yes"
                  ? "Yes"
                  : rsvp.response === "no"
                  ? "No"
                  : "Maybe";

              return (
                <div
                  key={`${rsvp.email || "anon"}-${rsvp.createdAt || index}`}
                  className="flex items-center justify-between text-sm py-1.5 px-2 rounded border border-border/50 bg-background/50"
                >
                  <span className="text-foreground truncate flex-1">
                    {displayName}
                  </span>
                  <span
                    className={`${responseColor} font-medium flex items-center gap-1.5 ml-2`}
                  >
                    <span>{responseIcon}</span>
                    <span>{responseLabel}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
