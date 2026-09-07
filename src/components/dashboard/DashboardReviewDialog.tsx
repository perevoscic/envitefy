"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ArrowUpRight, CheckCircle2, TriangleAlert, X } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { DashboardOverview } from "@/lib/dashboard-overview";

type ReviewKind = "conflicts" | "attention";

export function DashboardReviewDetails({
  kind,
  overview,
}: {
  kind: ReviewKind;
  overview: DashboardOverview;
}) {
  if (kind === "conflicts") {
    return overview.conflicts.length ? (
      <ul className="space-y-3">
        {overview.conflicts.map((conflict) => (
          <li key={conflict.id} className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
            <p className="flex items-start gap-2 text-xs font-semibold leading-5 text-amber-900">
              <TriangleAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              {new Date(conflict.second.startAt).toLocaleString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
            <div className="mt-2 space-y-1">
              {[conflict.first, conflict.second].map((event) => (
                <Link
                  key={event.id}
                  href={`/event/${encodeURIComponent(event.id)}`}
                  className="flex min-h-11 items-center justify-between gap-3 rounded-xl px-2 py-2 text-sm font-semibold text-slate-800 transition hover:bg-white hover:text-indigo-600 focus-visible:outline-2 focus-visible:outline-indigo-600"
                >
                  <span className="break-words">{event.title}</span>
                  <ArrowUpRight size={16} className="shrink-0" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </li>
        ))}
      </ul>
    ) : (
      <p className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">
        <CheckCircle2 size={20} className="shrink-0" aria-hidden="true" />
        No overlapping events in your upcoming plans.
      </p>
    );
  }

  const unavailable = overview.unavailable.includes("event details");
  return (
    <>
      {unavailable ? (
        <p role="status" className="mb-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
          Some event details couldn’t load. Refresh the dashboard to try again.
        </p>
      ) : null}
      {overview.attention.length ? (
        <ul className="divide-y divide-slate-100">
          {overview.attention.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="group flex min-h-20 items-center justify-between gap-3 rounded-xl px-2 py-3 focus-visible:outline-2 focus-visible:outline-indigo-600"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600">
                    {item.label}
                  </p>
                  <p className="mt-1 break-words text-xs leading-5 text-slate-500">
                    {item.eventTitle}
                  </p>
                </div>
                <ArrowUpRight size={17} className="shrink-0 text-indigo-500" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      ) : !unavailable ? (
        <p className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">
          <CheckCircle2 size={20} className="shrink-0" aria-hidden="true" />
          You’re all caught up on invitations and event details.
        </p>
      ) : null}
    </>
  );
}

export function DashboardReviewDialog({
  kind,
  overview,
  children,
}: {
  kind: ReviewKind;
  overview: DashboardOverview;
  children: ReactNode;
}) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[2000] bg-slate-900/35 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[2001] max-h-[85dvh] w-[calc(100%_-_2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto overscroll-contain rounded-[28px] border border-slate-100 bg-white p-6 shadow-2xl focus:outline-none sm:p-8">
          <Dialog.Title className="pr-10 text-xl font-bold text-slate-900">
            {kind === "conflicts" ? "Schedule conflicts" : "Needs attention"}
          </Dialog.Title>
          <Dialog.Description className="mb-5 mt-2 pr-8 text-sm leading-6 text-slate-500">
            {kind === "conflicts"
              ? "Review overlapping times among your upcoming events."
              : "Review invitations, RSVP details, and missing event information."}
          </Dialog.Description>
          <Dialog.Close
            className="absolute right-3 top-3 flex size-11 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-indigo-600"
            aria-label="Close details"
          >
            <X size={19} aria-hidden="true" />
          </Dialog.Close>
          <DashboardReviewDetails kind={kind} overview={overview} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
