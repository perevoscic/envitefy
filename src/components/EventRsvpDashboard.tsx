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
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  email: string | null;
  message?: string | null;
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
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/events/${eventId}/rsvp?t=${Date.now()}`, {
          credentials: "include",
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        });
        const data = await res.json();
        if (data.ok) {
          console.log("[RSVP Dashboard] Stats updated:", data);
          // Use API's calculated remaining value (now fixed to include all responses)
          setStats({
            yes: data.stats?.yes || 0,
            no: data.stats?.no || 0,
            maybe: data.stats?.maybe || 0,
            filled: data.filled || 0,
            remaining:
              data.remaining ?? (data.numberOfGuests || initialNumberOfGuests),
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
      // Fetch immediately without delay
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
  // Calculate remaining properly even in initial state
  const displayStats: RsvpStats = stats || {
    yes: 0,
    no: 0,
    maybe: 0,
    filled: 0,
    remaining: initialNumberOfGuests, // Will update immediately when stats load
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
    <section className="rounded-[28px] border border-[#ddd5ff] bg-gradient-to-br from-[#ffffff] via-[#f8f4ff] to-[#f3edff] px-4 py-6 shadow-[0_22px_56px_rgba(84,61,140,0.14)] sm:px-6 space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[#7a6da8]">
          Host dashboard
        </h3>
        {displayStats.numberOfGuests > 0 && (
          <div className="flex items-end gap-4 sm:gap-6">
            <div className="text-center leading-none">
              <div className="font-semibold text-2xl sm:text-3xl text-[#433468]">
                {displayStats.numberOfGuests}
              </div>
              <div className="mt-1 text-[10px] sm:text-xs uppercase tracking-wider text-[#7a6da8]">
                Total
              </div>
            </div>
            <div className="text-center leading-none">
              <div className="font-semibold text-2xl sm:text-3xl text-emerald-600">
                {displayStats.yes}
              </div>
              <div className="mt-1 text-[10px] sm:text-xs uppercase tracking-wider text-[#7a6da8]">
                Yes
              </div>
            </div>
            <div className="text-center leading-none">
              <div className="font-semibold text-2xl sm:text-3xl text-amber-500">
                {displayStats.maybe}
              </div>
              <div className="mt-1 text-[10px] sm:text-xs uppercase tracking-wider text-[#7a6da8]">
                Maybe
              </div>
            </div>
            <div className="text-center leading-none">
              <div className="font-semibold text-2xl sm:text-3xl text-red-500">
                {displayStats.no}
              </div>
              <div className="mt-1 text-[10px] sm:text-xs uppercase tracking-wider text-[#7a6da8]">
                No
              </div>
            </div>
            <div className="text-center leading-none">
              <div className="font-semibold text-2xl sm:text-3xl text-[#6e629c]">
                {displayStats.remaining}
              </div>
              <div className="mt-1 text-[10px] sm:text-xs uppercase tracking-wider text-[#7a6da8]">
                Remaining
              </div>
            </div>
          </div>
        )}
      </header>
      {responses.length > 0 && (
        <div className="pt-4 border-t border-[#e7defb] space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-[#7a6da8]">
            Responses
          </h4>
          <div className="space-y-2">
            {responses.map((rsvp, index) => {
              const responseColor =
                rsvp.response === "yes"
                  ? "text-emerald-600"
                  : rsvp.response === "no"
                  ? "text-red-500"
                  : "text-amber-500";
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
              const rsvpKey = `${rsvp.email || "anon"}-${
                rsvp.createdAt || index
              }`;
              const isUpdating = updatingKey === rsvpKey;

              return (
                <div
                  key={rsvpKey}
                  className="flex items-center justify-between text-sm py-3 px-4 rounded-2xl border border-[#ddd4f8] bg-white/92"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-[#2b2350] font-semibold truncate">
                      {rsvp.firstName && rsvp.lastName ? `${rsvp.firstName} ${rsvp.lastName}` : (rsvp.name || "Anonymous")}
                    </p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                      {rsvp.email && (
                        <span className="text-xs text-[#6e629c] truncate max-w-[180px]">
                          {rsvp.email}
                        </span>
                      )}
                      {rsvp.phone && (
                        <span className="text-xs text-[#6e629c]">
                          {rsvp.phone}
                        </span>
                      )}
                    </div>
                    {rsvp.message && (
                      <p className="mt-2 text-xs text-[#6e629c] bg-[#f3edff]/60 p-2.5 rounded-xl italic border-l-2 border-[#d5c9f7]">
                        &ldquo;{rsvp.message}&rdquo;
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <span
                      className={`${responseColor} font-medium hidden sm:inline-flex items-center gap-1.5 text-sm`}
                    >
                      <span>{responseIcon}</span>
                      <span>{responseLabel}</span>
                    </span>
                    <select
                      aria-label="Change RSVP status"
                      className="h-8 rounded-lg border border-[#d5c9f7] bg-white px-2 text-xs text-[#433468] focus:border-[#beaee8] focus:outline-none focus:ring-1 focus:ring-[#beaee8]"
                      value={rsvp.response}
                      disabled={isUpdating}
                      onChange={async (e) => {
                        const next = e.target.value as "yes" | "no" | "maybe";
                        setUpdatingKey(rsvpKey);
                        try {
                          await fetch(`/api/events/${eventId}/rsvp`, {
                            method: "PATCH",
                            headers: { "content-type": "application/json" },
                            body: JSON.stringify({
                              response: next,
                              target: rsvp.email
                                ? { email: rsvp.email }
                                : { name: rsvp.name },
                            }),
                            credentials: "include",
                          });
                        } catch (err) {
                          console.error("Failed to update RSVP", err);
                        } finally {
                          setUpdatingKey(null);
                          try {
                            const res = await fetch(
                              `/api/events/${eventId}/rsvp?t=${Date.now()}`,
                              {
                                cache: "no-store",
                                credentials: "include",
                              }
                            );
                            const data = await res.json();
                            if (data.ok) {
                              setStats({
                                yes: data.stats?.yes || 0,
                                no: data.stats?.no || 0,
                                maybe: data.stats?.maybe || 0,
                                filled: data.filled || 0,
                                remaining:
                                  data.remaining ??
                                  (data.numberOfGuests ||
                                    initialNumberOfGuests),
                                numberOfGuests:
                                  data.numberOfGuests || initialNumberOfGuests,
                              });
                              setResponses(
                                Array.isArray(data.responses)
                                  ? data.responses
                                  : []
                              );
                            }
                          } catch {}
                        }
                      }}
                    >
                      <option value="yes">Yes</option>
                      <option value="maybe">Maybe</option>
                      <option value="no">No</option>
                    </select>
                    <button
                      type="button"
                      aria-label="Delete RSVP"
                      title="Delete RSVP"
                      className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-[#d5c9f7] bg-white text-[#7a6da8] hover:bg-red-50 hover:text-red-500 hover:border-red-300 transition-colors"
                      disabled={isUpdating}
                      onClick={async () => {
                        if (isUpdating) return;
                        setUpdatingKey(rsvpKey);
                        try {
                          await fetch(`/api/events/${eventId}/rsvp`, {
                            method: "DELETE",
                            headers: { "content-type": "application/json" },
                            body: JSON.stringify({
                              target: rsvp.email
                                ? { email: rsvp.email }
                                : { name: rsvp.name },
                            }),
                            credentials: "include",
                          });
                        } catch (err) {
                          console.error("Failed to delete RSVP", err);
                        } finally {
                          setUpdatingKey(null);
                          try {
                            const res = await fetch(
                              `/api/events/${eventId}/rsvp?t=${Date.now()}`,
                              {
                                cache: "no-store",
                                credentials: "include",
                              }
                            );
                            const data = await res.json();
                            if (data.ok) {
                              setStats({
                                yes: data.stats?.yes || 0,
                                no: data.stats?.no || 0,
                                maybe: data.stats?.maybe || 0,
                                filled: data.filled || 0,
                                remaining:
                                  data.remaining ??
                                  (data.numberOfGuests ||
                                    initialNumberOfGuests),
                                numberOfGuests:
                                  data.numberOfGuests || initialNumberOfGuests,
                              });
                              setResponses(
                                Array.isArray(data.responses)
                                  ? data.responses
                                  : []
                              );
                            }
                          } catch {}
                        }
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                        aria-hidden="true"
                      >
                        <path d="M3 6h18" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
