"use client";

import type { LucideIcon } from "lucide-react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "violet" | "slate" | "emerald" | "amber" | "rose" | "sky";

const toneStyles: Record<Tone, { soft: string; solid: string; text: string; border: string }> = {
  violet: {
    soft: "bg-violet-50 text-violet-700",
    solid: "bg-violet-700 text-white hover:bg-violet-800",
    text: "text-violet-700",
    border: "border-violet-100",
  },
  slate: {
    soft: "bg-slate-100 text-slate-700",
    solid: "bg-slate-950 text-white hover:bg-violet-800",
    text: "text-slate-700",
    border: "border-slate-200",
  },
  emerald: {
    soft: "bg-emerald-50 text-emerald-700",
    solid: "bg-emerald-700 text-white hover:bg-emerald-800",
    text: "text-emerald-700",
    border: "border-emerald-100",
  },
  amber: {
    soft: "bg-amber-50 text-amber-700",
    solid: "bg-amber-600 text-white hover:bg-amber-700",
    text: "text-amber-700",
    border: "border-amber-100",
  },
  rose: {
    soft: "bg-rose-50 text-rose-700",
    solid: "bg-rose-600 text-white hover:bg-rose-700",
    text: "text-rose-700",
    border: "border-rose-100",
  },
  sky: {
    soft: "bg-sky-50 text-sky-700",
    solid: "bg-sky-700 text-white hover:bg-sky-800",
    text: "text-sky-700",
    border: "border-sky-100",
  },
};

export type PremiumAction = {
  label: string;
  href?: string;
  icon?: LucideIcon;
  onClick?: () => void;
  primary?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
};

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  badge,
  actions,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  actions?: PremiumAction[];
  children?: ReactNode;
}) {
  return (
    <header className="border-b border-violet-100/70 bg-white/92 shadow-[0_18px_60px_rgba(88,64,150,0.06)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            {eyebrow ? (
              <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-700">{eyebrow}</p>
            ) : null}
            {badge}
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
          {subtitle ? <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">{subtitle}</p> : null}
          {children}
        </div>
        {actions?.length ? <ActionBar actions={actions} /> : null}
      </div>
    </header>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        {eyebrow ? <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-700">{eyebrow}</p> : null}
        <h2 className="text-xl font-black tracking-tight text-slate-950">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function PremiumCard({
  children,
  className,
  as = "section",
}: {
  children: ReactNode;
  className?: string;
  as?: "article" | "aside" | "div" | "section";
}) {
  const Component = as;
  return (
    <Component
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_18px_55px_rgba(31,41,55,0.07)] sm:p-6",
        className,
      )}
    >
      {children}
    </Component>
  );
}

export function SummaryMetricCard({
  icon: Icon,
  label,
  value,
  detail,
  tone = "violet",
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  detail?: string;
  tone?: Tone;
}) {
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_14px_40px_rgba(31,41,55,0.06)]">
      <span className={cn("inline-flex h-10 w-10 items-center justify-center rounded-xl", toneStyles[tone].soft)}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className="mt-4 text-3xl font-black tracking-tight text-slate-950">{value}</p>
      <p className="mt-1 text-sm font-black text-slate-700">{label}</p>
      {detail ? <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{detail}</p> : null}
    </article>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-violet-200 bg-violet-50/45 p-5 text-sm text-slate-600",
        className,
      )}
    >
      {Icon ? (
        <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white text-violet-700 shadow-sm">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      ) : null}
      <h3 className="text-base font-black text-slate-950">{title}</h3>
      <p className="mt-2 max-w-2xl font-semibold leading-6">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function StatusChip({
  children,
  tone = "violet",
  icon: Icon,
}: {
  children: ReactNode;
  tone?: Tone;
  icon?: LucideIcon;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.12em]",
        toneStyles[tone].soft,
      )}
    >
      {Icon ? <Icon className="h-3.5 w-3.5" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

export function ActionBar({ actions, className }: { actions: PremiumAction[]; className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {actions.map((action) => {
        const Icon = action.icon;
        const actionClassName = cn(
          "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-black transition focus:outline-none focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:opacity-55",
          action.primary
            ? toneStyles.violet.solid
            : "border border-slate-200 bg-white text-slate-700 hover:border-violet-200 hover:text-violet-700",
        );
        const content = (
          <>
            {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
            {action.label}
          </>
        );
        if (action.href) {
          return (
            <Link key={`${action.href}:${action.label}`} href={action.href} className={actionClassName} aria-label={action.ariaLabel}>
              {content}
            </Link>
          );
        }
        return (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            disabled={action.disabled}
            className={actionClassName}
            aria-label={action.ariaLabel}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}

export function MobileStickyAction({ action }: { action: PremiumAction }) {
  const Icon = action.icon;
  const className =
    "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-violet-700 px-5 text-sm font-black text-white shadow-[0_18px_40px_rgba(109,40,217,0.28)] transition hover:bg-violet-800 focus:outline-none focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:opacity-60";
  const content = (
    <>
      {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
      {action.label}
    </>
  );
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-violet-100 bg-white/95 p-3 shadow-[0_-18px_45px_rgba(31,41,55,0.08)] backdrop-blur md:hidden">
      {action.href ? (
        <Link href={action.href} className={className} aria-label={action.ariaLabel}>
          {content}
        </Link>
      ) : (
        <button type="button" onClick={action.onClick} disabled={action.disabled} className={className} aria-label={action.ariaLabel}>
          {content}
        </button>
      )}
    </div>
  );
}

export function DetailDrawer({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_rgba(31,41,55,0.07)]">
      <h2 className="text-xl font-black tracking-tight text-slate-950">{title}</h2>
      {description ? <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">{description}</p> : null}
      <div className="mt-5">{children}</div>
    </aside>
  );
}

export function ModeBadge({ label }: { label: string }) {
  return <StatusChip tone="violet">{label}</StatusChip>;
}

export function StepCard({
  step,
  title,
  description,
  done = false,
}: {
  step: string;
  title: string;
  description: string;
  done?: boolean;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black",
            done ? "bg-emerald-50 text-emerald-700" : "bg-violet-50 text-violet-700",
          )}
        >
          {done ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : step}
        </span>
        <div>
          <h3 className="font-black text-slate-950">{title}</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">{description}</p>
        </div>
      </div>
    </article>
  );
}

export function SuggestedActionCard({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-violet-100 bg-violet-50/55 p-5">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white text-violet-700 shadow-sm">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-lg font-black tracking-tight text-slate-950">{title}</h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </article>
  );
}

export function LoadingSkeleton({ label = "Loading details" }: { label?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" role="status" aria-live="polite">
      <div className="flex items-center gap-3 text-sm font-black text-slate-600">
        <Loader2 className="h-4 w-4 animate-spin text-violet-700" aria-hidden="true" />
        {label}
      </div>
      <div className="mt-5 grid gap-3">
        <div className="h-4 w-2/3 animate-pulse rounded-full bg-slate-100" />
        <div className="h-4 w-1/2 animate-pulse rounded-full bg-slate-100" />
        <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
      </div>
    </div>
  );
}

export function FriendlyError({ title = "Something needs attention", message }: { title?: string; message: string }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900" role="alert">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-700" aria-hidden="true" />
        <div>
          <p className="font-black">{title}</p>
          <p className="mt-1 font-semibold leading-6">{message}</p>
        </div>
      </div>
    </div>
  );
}

export function ResponsiveTabs({
  tabs,
  active,
  onSelect,
}: {
  tabs: Array<{ id: string; label: string; icon?: LucideIcon }>;
  active: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <div className="inline-flex min-w-full gap-2 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm" role="tablist">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onSelect(tab.id)}
              className={cn(
                "inline-flex min-h-10 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 text-sm font-black transition focus:outline-none focus:ring-4 focus:ring-violet-100",
                selected ? "bg-violet-700 text-white shadow-sm" : "text-slate-600 hover:bg-violet-50 hover:text-violet-700",
              )}
            >
              {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

