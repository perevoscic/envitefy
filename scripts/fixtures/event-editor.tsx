import { SessionContext } from "next-auth/react";
import { resolveOwnerEditHref } from "../../src/utils/event-edit-route";
import { EventPageCompositionProvider } from "../../src/components/events/EventPageCompositionContext";
import { ScannedScheduleProvider } from "../../src/components/ScannedSchedule";
import { createCreationIntake, writeCreationIntake } from "../../src/lib/create/creation-intake";
import { prepareCreationEditor } from "../../src/lib/create/editor-navigation";
import { normalizeScanSchedule } from "../../src/lib/scan-schedule";
import { isEventDraft } from "../../src/lib/event-draft-access";
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import UnsavedProgressProvider from "../../src/components/UnsavedProgressProvider";
import AppearanceProvider from "../../src/components/AppearanceProvider";
import EventEditorWorkspace from "../../src/components/events/EventEditorWorkspace";
import {
  EventEditorInput,
  EventEditorSections,
} from "../../src/components/events/EventEditorFields";
import { useEventPageEditor } from "../../src/components/events/useEventPageEditor";
import { useEventHistoryClient } from "../../src/lib/event-history-client";
import EventCustomEditor from "../../src/components/events/custom/EventCustomEditor";
import SignupTemplatesPage from "../../src/app/templates/signup/page";
import BabyShowers from "../../src/app/event/baby-showers/customize/page";
import GenderReveal from "../../src/app/event/gender-reveal/customize/page";
import Cheerleading from "../../src/app/event/cheerleading/customize/page";
import Appointments from "../../src/app/event/appointments/customize/page";
import Workshops from "../../src/app/event/workshops/customize/page";
import SpecialEvents from "../../src/app/event/special-events/customize/page";
import EventPageTypography from "../../src/components/events/EventPageTypography";
import EventEditorRsvpSection from "../../src/components/events/EventEditorRsvpSection";
import { getTemplateCategory } from "../../src/lib/template-categories";
import Football from "../../src/app/event/football-season/customize/page";
import Soccer from "../../src/app/event/soccer/customize/page";
import SportEvents from "../../src/app/event/sport-events/customize/page";
import DanceBallet from "../../src/app/event/dance-ballet/customize/page";
import Birthdays from "../../src/app/event/birthdays/customize/page";
import General from "../../src/app/event/general/customize/page";
import Weddings from "../../src/app/event/weddings/customize/page";
import Gymnastics from "../../src/app/event/gymnastics/customize/page";
import TemplateEditorProvider from "../../src/components/templates/TemplateEditorContext";
import SimpleTemplateView from "../../src/components/SimpleTemplateView";
import EventGuestActions from "../../src/components/event-templates/EventGuestActions";
import type { EventGuestActionVisibility } from "../../src/lib/event-guest-actions";
import { usePathname, useSearchParams, useRouter } from "./signup-editor/navigation";
import { emptyCustomEventDetails } from "../../src/lib/event-custom-design";

const customPage = {
  version: 1 as const,
  category: "general" as const,
  artwork: "/templates/signup/photographic/clubs-and-groups/gardening-group.webp",
  design: {
    version: 1 as const,
    name: "Field trip",
    description: "Quiet park",
    layout: "split" as const,
    font: "editorial" as const,
    colors: { page: "#e9f4f5", surface: "#ffffff", ink: "#203c40", accent: "#35787e" },
  },
  details: {
    ...emptyCustomEventDetails(),
    title: "School field trip",
    date: "2026-10-10",
    time: "09:00",
    timezone: "America/Chicago",
    venue: "State park",
    description: "Bring water.",
    sections: [
      {
        title: "Schedule",
        body: Array.from({ length: 12 }, (_, index) =>
          `${index + 1}. Explore the coastal trail with your group. Meet your guide by the entrance, bring water and allow time for the learning stations.`,
        ).join("\n\n"),
      },
      { title: "Parking", body: "Use the north lot." },
    ],
  },
};

(window as any).__seedSchoolMemoCreate = async () => {
  const source = "Weekly school memo\nOctober 26\nImportant Reminders: Bring a donation for Spirit Week.\nBible: memory verse and multiple choice test (we will go over the multiple choice twice before taking the test)\n\n“....Repent, for the kingdom of heaven has come near.”\nMatthew 3:2\n\nTest: Friday October 30th\nBible test October 30\nScience: Learn about clean water.\nSpelling test October 30\nAt Home Partnership Tips:\nBinders are returned to school daily.";
  const schedule = normalizeScanSchedule({ kind: "school-memo", title: "Oak classroom memo", issueDate: "2026-10-26", timezone: "America/Chicago", items: [
    { id: "bible", title: "Bible Test", type: "test", date: "2026-10-30", calendarSelected: true },
    { id: "spelling", title: "Spelling Test", type: "test", date: "2026-10-30", calendarSelected: false },
  ] })!;
  const intake = await writeCreationIntake({ ...createCreationIntake("qa-host", { kind: "files", files: [new File([source], "memo.pdf", { type: "application/pdf" })], text: "" }),
    guess: { category: "school", schoolTemplate: "weekly-memo", sport: null }, sourceText: source,
    information: { version: 1, kind: "information", category: "general", design: customPage.design,
      details: { ...emptyCustomEventDetails(), title: schedule.title, schoolTemplate: "weekly-memo", scanSchedule: schedule, timezone: schedule.timezone, sections: [{ title: "School memo", body: source }] } },
  });
  return prepareCreationEditor(intake, { id: "school--weekly-memo", family: "general", category: "general", title: "Weekly memo", description: "", style: "", imageUrl: "", href: "/event/general/customize?collection=school&templateId=school--weekly-memo" });
};

const navigate = (url: string, replace = false) => {
  history[replace ? "replaceState" : "pushState"](null, "", url);
  window.dispatchEvent(new PopStateEvent("popstate", { state: history.state }));
};
const router = {
  push: (url: string) => navigate(url),
  replace: (url: string) => navigate(url, true),
  back: () => history.back(),
  forward: () => history.forward(),
  refresh() {},
  prefetch: async () => {},
};

function LifecycleEditor() {
  const search = useSearchParams();
  const eventId = search.get("edit") || undefined;
  const client = useEventHistoryClient();
  const [ready, setReady] = useState(!eventId);
  const [activeSection, setActiveSection] = useState("main");
  const [data, setData] = useState({
    title: "School field trip",
    description: "Bring water.",
    sections: [{ title: "Schedule", body: "Meet at 9 AM." }],
  });
  useEffect(() => {
    if (eventId)
      void client
        .fetch(`/api/history/${eventId}`)
        .then((r) => r.json())
        .then((row) => {
          setData(row.data.fields);
          setReady(true);
        });
  }, [eventId, client]);
  const editor = useEventPageEditor({
    snapshot: { data },
    ready,
    eventId,
    historyClient: client,
    category: "General",
    templateId: "field-trip",
    buildPayload: async () => ({
      title: data.title,
      data: { title: data.title, fields: data, primaryOutput: "event_page" },
    }),
  });
  return (
    <EventEditorWorkspace
      editor={editor}
      embedded={search.get("embed") === "1"}
      onBackWithinControls={() => {
        if (activeSection === "main") return false;
        setActiveSection("main");
        return true;
      }}
      preview={
        <article>
          <h2>{data.title}</h2>
          <p>{data.description}</p>
          {data.sections.map((section) => (
            <section key={section.title}>
              <h3>{section.title}</h3>
              <p>{section.body}</p>
            </section>
          ))}
        </article>
      }
      controls={
        <EventEditorSections
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          sections={[
            {
              id: "details",
              title: "Event details",
              description: "Title and guest information.",
              content: (
                <EventEditorInput
                  label="Event title"
                  value={data.title}
                  onChange={(title) => setData({ ...data, title })}
                />
              ),
            },
          ]}
        />
      }
    />
  );
}

function GuestActionsFixture() {
  const search = useSearchParams();
  const [visibility, setVisibility] = useState<EventGuestActionVisibility>({});
  const missingDetails = search.has("missingDetails");
  return (
    <article data-guest-actions-fixture style={{ width: "calc(100% - 48px)", margin: "24px auto", fontFamily: "Arial, sans-serif", color: "#513529", background: "#efdfd4" }}>
      <EventGuestActions
        title="School field trip"
        start={missingDetails ? undefined : "2026-10-10T09:00:00-05:00"}
        timezone="America/Chicago"
        location={missingDetails ? undefined : "State park"}
        shareUrl="/event/mobile-action-fixture"
        visibility={visibility}
        onVisibilityChange={search.has("editing") ? setVisibility : undefined}
      />
    </article>
  );
}

function SavedGymnasticsPreview() {
  const search = useSearchParams();
  const id = search.get("edit") || "";
  const [row, setRow] = useState<any>(null);
  useEffect(() => {
    void fetch(`/api/history/${encodeURIComponent(id)}`).then(response => response.json()).then(setRow);
  }, [id]);
  return row ? <SimpleTemplateView eventId={id} eventData={row.data} eventTitle={row.title} isOwner={false} isReadOnly={true} viewerKind="readonly" shareUrl="" sessionEmail={null} disableProtectedSectionLocks={true} hideOwnerActions={true} /> : null;
}

function SavedSchoolMemo() {
  const search = useSearchParams();
  const id = search.get("edit") || "";
  const [row, setRow] = useState<any>(null);
  useEffect(() => { void fetch(`/api/history/${id}`).then(response => response.json()).then(setRow); }, [id]);
  if (!row) return <p>Opening memo…</p>;
  return <EventPageCompositionProvider value={row.data.eventPageComposition}>
    <a href={`${resolveOwnerEditHref(id, row.data, row.title)}&mode=manual&schoolCalendar=1`}>Edit school memo</a>
    <ScannedScheduleProvider schedule={row.data.scanSchedule} eventId={id} canManage published={!isEventDraft(row.data)}>
      <SimpleTemplateView eventId={id} eventData={row.data} eventTitle={row.title} isOwner={false} isReadOnly viewerKind="readonly" shareUrl={`http://localhost:43128/event/${id}`} sessionEmail="host@test.com" disableProtectedSectionLocks hideOwnerActions />
    </ScannedScheduleProvider>
  </EventPageCompositionProvider>;
}

function SchoolCalendarSession({ children }: { children: React.ReactNode }) {
  return <SessionContext.Provider value={{ data: { user: { id: "qa-host", email: "host@test.com" } }, status: "authenticated" } as any}>{children}</SessionContext.Provider>;
}
const editorComponents = {
  "signup-forms": SignupTemplatesPage,
  "weddings": Weddings, "birthdays": Birthdays, "anniversaries": Birthdays,
  "baby-showers": BabyShowers, "bridal-showers": BabyShowers, "gender-reveal": GenderReveal,
  "soccer": Soccer, "sport-events": SportEvents, "dance-ballet": DanceBallet,
  "cheerleading": Cheerleading, "appointments": Appointments, "workshops": Workshops,
  "special-events": SpecialEvents, "general": General, "football-season": Football,
};
function SavedTypographyPreview() {
  const search = useSearchParams();
  const [row, setRow] = useState<any>(null);
  useEffect(() => { void fetch(`/api/history/${search.get("edit")}`).then(r => r.json()).then(setRow); }, [search]);
  return row ? <EventPageCompositionProvider value={row.data.eventPageComposition}>
    <EventPageTypography><h1 style={{ fontFamily: "Georgia" }}>Saved event title</h1><p>Original body typography</p><div data-appearance-scope="app"><h1 style={{ fontFamily: "Arial" }}>Application heading</h1></div></EventPageTypography>
  </EventPageCompositionProvider> : null;
}
function RecoveredRsvpSwitch() {
  const [enabled, setEnabled] = useState<boolean>();
  return <EventEditorRsvpSection enabled={enabled as boolean} onEnabledChange={setEnabled}>
    <p>Recovered RSVP settings</p>
  </EventEditorRsvpSection>;
}
function App() {
  const pathname = usePathname();
  const search = useSearchParams();
  if (!pathname.includes("customize")) return <div data-destination>{pathname}</div>;
  const mode = search.get("mode") || (pathname.startsWith("/sport-events/") ? "sport-events" : pathname.includes("/gymnastics/templates/") ? "gymnastics-template" : pathname.includes("gymnastics") ? "gymnastics" : null);
  if (search.get("toolsAudit") === "saved") return <SavedTypographyPreview />;
  if (search.get("toolsAudit") === "recovered-rsvp") return <RecoveredRsvpSwitch />;
  const routeParts = pathname.split("/").filter(Boolean);
  const templateCategory = routeParts[1] === "templates" && routeParts[3] === "customize" ? getTemplateCategory(routeParts[0]) : undefined;
  const auditCategory = search.get("toolsAudit") || (!search.has("mode") ? templateCategory?.slug : undefined);
  const AuditEditor = editorComponents[auditCategory as keyof typeof editorComponents];
  if (AuditEditor) return <UnsavedProgressProvider><LeaveButton />{templateCategory
    ? <TemplateEditorProvider category={templateCategory.slug} templateId={routeParts[2]}><AuditEditor /></TemplateEditorProvider>
    : <AuditEditor />}</UnsavedProgressProvider>;
  if (mode === "guest-actions") return <GuestActionsFixture />;
  return (
    <UnsavedProgressProvider>
      <LeaveButton />
      {mode === "template" ? (
        <TemplateEditorProvider category="birthdays" templateId="candy-dreams">
          <Birthdays />
        </TemplateEditorProvider>
      ) : mode === "gymnastics-template" ? (
        <TemplateEditorProvider category="gymnastics" templateId="airborne-atlas">
          <Gymnastics />
        </TemplateEditorProvider>
      ) : mode === "gymnastics-guest" ? (
        <SavedGymnasticsPreview />
      ) : mode === "football" ? <Football /> : mode === "soccer" ? <Soccer /> : mode === "sport-events" ? <SportEvents /> : mode === "dance-ballet" ? <DanceBallet /> : mode === "gymnastics" ? (
        <Gymnastics />
      ) : mode === "school-saved" ? (
        <SchoolCalendarSession><SavedSchoolMemo /></SchoolCalendarSession>
      ) : mode === "manual" ? (
        search.has("schoolCalendar") ? <SchoolCalendarSession><General /></SchoolCalendarSession> : <General />
      ) : mode === "wedding" ? (
        <Weddings />
      ) : mode === "upload" || mode === "create" ? (
        <EventCustomEditor initialPage={search.has("edit") ? undefined : customPage} />
      ) : (
        <LifecycleEditor />
      )}
    </UnsavedProgressProvider>
  );
}
function LeaveButton() {
  const guardedRouter = useRouter();
  return (
    <button type="button" data-leave onClick={() => guardedRouter.push("/chosen-destination")}>
      Leave for chosen destination
    </button>
  );
}
createRoot(document.getElementById("root")!).render(
  <AppRouterContext.Provider value={router}>
    <AppearanceProvider><App /></AppearanceProvider>
  </AppRouterContext.Provider>,
);
