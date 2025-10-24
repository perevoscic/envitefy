import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getEventHistoryBySlugOrId, getUserIdByEmail } from "@/lib/db";
import SignupViewer from "@/components/smart-signup-form/SignupViewer";
import type { SignupForm } from "@/types/signup";
import { sanitizeSignupForm } from "@/utils/signup";
import { combineVenueAndLocation } from "@/lib/mappers";
import EventActions from "@/components/EventActions";

export const dynamic = "force-dynamic";

export default async function SignupPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }> | { id: string };
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
}) {
  const awaitedParams = await params;
  const session: any = await getServerSession(authOptions as any);
  const sessionEmail = (session?.user?.email as string | undefined) || null;
  const userId = sessionEmail ? await getUserIdByEmail(sessionEmail) : null;
  const row = await getEventHistoryBySlugOrId({
    value: awaitedParams.id,
    userId,
  });
  if (!row) return notFound();
  const data = (row.data as any) || {};
  const rawForm = data?.signupForm;
  if (!rawForm || typeof rawForm !== "object") return notFound();
  const signupForm: SignupForm = sanitizeSignupForm({
    ...(rawForm as SignupForm),
    enabled: true,
  });

  const viewerKind: "owner" | "guest" = (() => {
    if (userId && row.user_id && userId === row.user_id) return "owner";
    return "guest";
  })();

  const header = signupForm.header || null;
  const combinedLocation = combineVenueAndLocation(
    (data?.venue as string | undefined) || null,
    (data?.location as string | undefined) || null
  );
  const pageBgStyle = {
    backgroundColor: header?.backgroundColor || undefined,
    backgroundImage: header?.backgroundCss || undefined,
    backgroundSize: header?.backgroundCss ? "cover" : undefined,
    backgroundPosition: header?.backgroundCss ? "center" : undefined,
  } as React.CSSProperties;

  return (
    <div className="min-h-screen" style={pageBgStyle}>
      <main className="mx-auto w-full max-w-3xl px-4 py-6 space-y-4">
        <section
          className="rounded-xl overflow-hidden border"
          style={{
            backgroundColor: header?.backgroundColor || undefined,
            backgroundImage: header?.backgroundCss || undefined,
            backgroundSize: header?.backgroundCss ? "cover" : undefined,
            backgroundPosition: header?.backgroundCss ? "center" : undefined,
          }}
        >
          <div className="px-5 py-6">
            <p className="text-xs text-foreground/60 mb-2">header preview</p>
            <div className="grid gap-4 md:grid-cols-[325px_1fr] items-start">
              <div>
                {header?.backgroundImage?.dataUrl ? (
                  <img
                    src={header.backgroundImage.dataUrl}
                    alt="header"
                    className="w-full max-w-[325px] max-h-[325px] rounded-xl border border-border object-cover"
                  />
                ) : null}
              </div>
              <div className="flex flex-col gap-2">
                {header?.groupName ? (
                  <div
                    className="text-xs font-semibold opacity-85"
                    style={{ color: header?.textColor1 || undefined }}
                  >
                    {header.groupName}
                  </div>
                ) : null}
                <h1
                  className="text-lg font-semibold"
                  style={{ color: header?.textColor2 || undefined }}
                >
                  {signupForm.title || row.title || "Smart sign-up"}
                </h1>
                {/* Headline description + location for guests */}
                {(signupForm.description ||
                  signupForm.venue ||
                  signupForm.location ||
                  combinedLocation) && (
                  <div
                    className="text-sm opacity-90"
                    style={{ color: header?.textColor1 || undefined }}
                  >
                    {signupForm.description && (
                      <p className="leading-relaxed">
                        {signupForm.description}
                      </p>
                    )}
                    {(signupForm.venue ||
                      signupForm.location ||
                      combinedLocation) && (
                      <p className="mt-1 text-foreground/70">
                        Location:{" "}
                        {signupForm.venue
                          ? `${signupForm.venue}${
                              signupForm.location ? ", " : ""
                            }`
                          : ""}
                        {signupForm.location || combinedLocation}
                      </p>
                    )}
                  </div>
                )}
                {/* Owner edit/delete actions now live in the Sign-up board header */}
              </div>
            </div>
            {/* Guest share actions inside header footer */}
            <div className="mt-4 pt-3 border-t border-border/60">
              <EventActions
                shareUrl={`/smart-signup-form/${row.id}`}
                historyId={row.id}
                event={
                  {
                    title:
                      (row.title as string) ||
                      (signupForm.title as string) ||
                      "Event",
                    start:
                      (data?.startISO as string | null) ||
                      (data?.start as string | null) ||
                      null,
                    end:
                      (data?.endISO as string | null) ||
                      (data?.end as string | null) ||
                      null,
                    location: (data?.location as string | null) || null,
                    venue: (data?.venue as string | null) || null,
                    description: (data?.description as string | null) || null,
                    timezone: (data?.timezone as string | null) || null,
                    rsvp: (data?.rsvp as string | null) || null,
                  } as any
                }
              />
            </div>
          </div>
        </section>

        <section>
          <SignupViewer
            eventId={row.id}
            initialForm={signupForm}
            viewerKind={viewerKind}
            viewerId={userId}
            viewerName={(session?.user?.name as string | undefined) || null}
            viewerEmail={sessionEmail}
            ownerEventTitle={(row.title as string) || "Smart sign-up"}
            ownerEventData={data}
          />
        </section>
      </main>
    </div>
  );
}
