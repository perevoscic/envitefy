"use client";

import FootballSchedule from "@/components/football-season-templates/FootballSchedule";
import type { DashboardGame } from "@/lib/dashboard-games";

export default function DashboardGames({ games }: { games: DashboardGame[] }) {
  return (
    <section className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-2" aria-label="Upcoming games">
      {games.map((item) => (
        <section key={item.id} className="min-w-0 rounded-3xl border border-slate-100 bg-white p-5 text-slate-700 shadow-sm sm:p-6">
          <FootballSchedule games={[item.game]} {...item.home} upcomingOnly gameHref={item.eventHref} cardClassName="" />
        </section>
      ))}
    </section>
  );
}
