import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getEventHistoryBySlugOrId, getUserIdByEmail } from "@/lib/db";
import SignupViewer from "@/components/smart-signup-form/SignupViewer";
import type { SignupForm } from "@/types/signup";
import { sanitizeSignupForm } from "@/utils/signup";

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
                {/* Owner edit/delete actions now live in the Sign-up board header */}
              </div>
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
