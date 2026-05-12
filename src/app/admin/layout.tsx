import Link from "next/link";
import { AdminRouteError, requireAdminSession } from "@/lib/admin/require-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function AdminAccessMessage({ title, description }: { title: string; description: string }) {
  return (
    <div className="min-h-[100dvh] bg-slate-50 px-4 py-10 text-slate-950">
      <div className="mx-auto max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700">Admin</p>
        <h1 className="mt-2 text-2xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-slate-600">{description}</p>
        <Link
          href="/"
          className="mt-5 inline-flex min-h-11 items-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireAdminSession();
    return (
      <div className="min-h-[100dvh] bg-slate-50 text-slate-950">
        <div className="mx-auto w-full max-w-[1600px] px-3 py-3 sm:px-5 lg:px-6 lg:py-5">
          {children}
        </div>
      </div>
    );
  } catch (error) {
    if (error instanceof AdminRouteError && error.status === 401) {
      return (
        <AdminAccessMessage
          title="Sign in required"
          description="You must sign in with an admin account to view this area."
        />
      );
    }

    if (error instanceof AdminRouteError && error.status === 403) {
      return (
        <AdminAccessMessage
          title="Forbidden"
          description="This workspace area is restricted to Envitefy admins."
        />
      );
    }

    throw error;
  }
}
