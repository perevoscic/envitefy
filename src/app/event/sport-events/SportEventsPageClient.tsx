"use client";

import { Sparkles, Trophy } from "lucide-react";
import { useSearchParams } from "next/navigation";
import SportCreationGate from "@/components/event-create/SportCreationGate";
import SportsDiscoveryLauncher from "@/components/event-create/SportsDiscoveryLauncher";
import { getSportEventPreset } from "@/lib/sport-event-presets";

export default function SportEventsPageClient() {
  const search = useSearchParams();
  const requestedSport = search?.get("sport");
  const unavailableSport = search?.get("unavailableSport");

  return (
    <SportCreationGate
      requestedSport={requestedSport}
      surface="sports"
      unavailableSport={unavailableSport}
    >
      {(activeSport) => {
        const selectedSport = getSportEventPreset(activeSport);
        return (
          <main className="min-h-screen bg-[radial-gradient(circle_at_12%_12%,#eeeaff_0,transparent_30%),radial-gradient(circle_at_88%_8%,#e9f7ff_0,transparent_28%),#f8f8fb] px-4 py-7 text-[#17111e] sm:px-6 lg:px-8">
            <section className="mx-auto w-full max-w-7xl">
              <div className="flex flex-col gap-5 rounded-[2rem] border border-white/80 bg-white/75 p-5 shadow-[0_24px_90px_rgba(41,32,72,0.1)] backdrop-blur sm:p-7">
                <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                  <div>
                    <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-[#5f55ff]">
                      <Sparkles className="h-4 w-4" /> Smart {selectedSport.shortLabel} builder
                    </p>
                    <h1 className="mt-3 max-w-4xl text-4xl font-black leading-[0.98] sm:text-6xl">
                      Turn your {selectedSport.shortLabel.toLowerCase()} packet into a useful event
                      page.
                    </h1>
                    <p className="mt-4 max-w-3xl text-base leading-7 text-[#5f5869] sm:text-lg">
                      Upload a file, sync a public page, or start manually. Envitefy organizes the
                      dates, venue, schedule, admission, travel, and links into an editable page.
                    </p>
                  </div>
                  <div className="flex min-w-64 items-center gap-3 rounded-2xl bg-[#17111e] p-4 text-white">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-[#f6d477]">
                      <Trophy className="h-6 w-6" />
                    </span>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/55">
                        Your sport
                      </p>
                      <p className="text-lg font-black">{selectedSport.label}</p>
                    </div>
                  </div>
                </div>
                <p className="rounded-xl bg-[#f2f0ff] px-4 py-3 text-xs leading-5 text-[#5046b5]">
                  We start with the recommended {selectedSport.shortLabel.toLowerCase()} theme. You
                  can change the theme, colors, and sections inside the visual builder.
                </p>
              </div>

              <div className="mt-6">
                <div className="mb-4">
                  <h2 className="text-lg font-black">Add your event information</h2>
                  <p className="mt-1 text-sm text-[#6c6576]">
                    Upload is fastest; live URL and manual creation are always available.
                  </p>
                </div>
                <SportsDiscoveryLauncher sport={selectedSport.key} />
              </div>
            </section>
          </main>
        );
      }}
    </SportCreationGate>
  );
}
