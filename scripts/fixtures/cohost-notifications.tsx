import { createRoot } from "react-dom/client";
import CoHostInvitationProvider, {
  useCoHostInvitations,
} from "@/components/CoHostInvitationProvider";
import HomeOverviewDashboard from "@/components/dashboard/HomeOverviewDashboard";
import PendingCoHostInvitations from "@/components/dashboard/PendingCoHostInvitations";

const data = {
  nextEvent: null,
  upcoming: [],
  snapshot: { upcomingCount30Days: 0, upcomingCount7Days: 0, nextEventInDays: null },
  rsvp: null,
  setupHealth: { flags: [] },
  checklist: { source: "derived" as const, items: [] },
  drafts: { count: 0, items: [] },
  metricsEligibility: { weatherEligible: false, travelWindowEligible: false },
  overview: {
    attention: [],
    conflicts: [],
    guests: [],
    signups: [],
    drafts: { count: 0, items: [] },
    editLinks: {},
    unavailable: [],
  },
};
function Dashboard() {
  const invitations = useCoHostInvitations();
  return (
    <div className="mx-auto max-w-6xl px-4 pb-12">
      <HomeOverviewDashboard
        viewerName="Ruslan"
        data={data}
        metrics={null}
        enrichMeta={null}
        metricsLoading={false}
        loading={false}
        error={null}
        onRetry={() => void invitations.refresh()}
        onForceTravel={() => {}}
        coHostInvitations={invitations.invitations}
        coHostInvitationsUnavailable={Boolean(invitations.error) || invitations.loading}
        invitationNotice={<PendingCoHostInvitations />}
      />
    </div>
  );
}
createRoot(document.getElementById("root")!).render(
  <CoHostInvitationProvider active>
    <Dashboard />
  </CoHostInvitationProvider>,
);
