import Link from "next/link";
import { cn } from "@/lib/utils";

type AdminPageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function AdminPageHeader({ eyebrow, title, description, action }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-1 text-2xl font-semibold tracking-normal text-slate-950 md:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-3xl text-wrap break-words text-sm text-slate-600">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function AdminMetricCard({
  label,
  value,
  detail,
  href,
}: {
  label: string;
  value: string | number;
  detail?: string;
  href?: string;
}) {
  const body = (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-wrap break-words text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-wrap break-words text-3xl font-semibold tracking-normal text-slate-950">
        {value}
      </p>
      {detail ? (
        <p className="mt-2 text-wrap break-words text-sm text-slate-600">{detail}</p>
      ) : null}
    </div>
  );

  if (!href) return body;
  return (
    <Link href={href} className="block transition hover:border-violet-300 hover:shadow-md">
      {body}
    </Link>
  );
}

export function AdminStatusBadge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "violet";
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center rounded-full border px-2.5 text-xs font-medium",
        tone === "neutral" && "border-slate-200 bg-slate-50 text-slate-700",
        tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-700",
        tone === "warning" && "border-amber-200 bg-amber-50 text-amber-800",
        tone === "danger" && "border-rose-200 bg-rose-50 text-rose-700",
        tone === "violet" && "border-violet-200 bg-violet-50 text-violet-700",
      )}
    >
      {children}
    </span>
  );
}

export function AdminPanel({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm",
        className,
      )}
    >
      {title || description || action ? (
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {title ? <h2 className="text-base font-semibold text-slate-950">{title}</h2> : null}
            {description ? (
              <p className="mt-1 text-wrap break-words text-sm text-slate-600">{description}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      <div className="min-w-0 p-4">{children}</div>
    </section>
  );
}

export function AdminEmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
    </div>
  );
}

export function AdminBarList({
  rows,
  valueLabel = "count",
}: {
  rows: Array<{ label: string; value: number; detail?: string }>;
  valueLabel?: string;
}) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  if (!rows.length) {
    return (
      <AdminEmptyState title="No data yet" description={`No ${valueLabel} rows are available.`} />
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const width = `${Math.max(4, Math.round((row.value / max) * 100))}%`;
        return (
          <div key={row.label} className="min-w-0 space-y-1">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate font-medium text-slate-800">{row.label}</span>
              <span className="shrink-0 font-semibold text-slate-950">
                {row.value.toLocaleString()}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-violet-600" style={{ width }} />
            </div>
            {row.detail ? <p className="text-xs text-slate-500">{row.detail}</p> : null}
          </div>
        );
      })}
    </div>
  );
}

export function AdminMobileRecordList({
  rows,
  emptyTitle = "No rows yet",
  emptyDescription,
}: {
  rows: Array<{
    key: string;
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    badge?: React.ReactNode;
    fields: Array<{ label: string; value: React.ReactNode; className?: string; wide?: boolean }>;
  }>;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (!rows.length) {
    return (
      <div className="md:hidden">
        <AdminEmptyState title={emptyTitle} description={emptyDescription} />
      </div>
    );
  }

  return (
    <div className="space-y-3 md:hidden">
      {rows.map((row) => (
        <article key={row.key} className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-wrap break-words text-sm font-semibold text-slate-950">
                {row.title}
              </h3>
              {row.subtitle ? (
                <p className="mt-1 truncate text-xs text-slate-500">{row.subtitle}</p>
              ) : null}
            </div>
            {row.badge ? <div className="shrink-0">{row.badge}</div> : null}
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
            {row.fields.map((field) => (
              <div key={field.label} className={cn("min-w-0", field.wide && "col-span-2")}>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                  {field.label}
                </dt>
                <dd
                  className={cn(
                    "mt-0.5 text-wrap break-words text-sm font-medium text-slate-800",
                    field.className,
                  )}
                >
                  {field.value}
                </dd>
              </div>
            ))}
          </dl>
        </article>
      ))}
    </div>
  );
}

export function AdminSparkline({ values, label }: { values: number[]; label: string }) {
  const width = 180;
  const height = 44;
  const max = Math.max(1, ...values);
  const points = values.length
    ? values
        .map((value, index) => {
          const x = values.length === 1 ? width : (index / (values.length - 1)) * width;
          const y = height - (Math.max(0, value) / max) * height;
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(" ")
    : "";

  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${width} ${height}`}
      className="h-11 w-full text-violet-600"
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
        points={points}
      />
    </svg>
  );
}
