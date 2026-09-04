"use client";

import { useId, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BadgeTone } from "@/lib/admin/marketing-hub";

export function PageCard({
  children,
  title,
  action,
  className,
  headerClassName,
  bodyClassName,
}: {
  children: ReactNode;
  title?: ReactNode;
  action?: ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-[28px] border border-[#e4e0ef] bg-white shadow-[0_16px_40px_rgba(84,49,170,0.06)]",
        className,
      )}
    >
      {title || action ? (
        <div
          className={cn(
            "flex items-center justify-between gap-3 border-b border-[#f0ecf7] px-6 py-4",
            headerClassName,
          )}
        >
          {title ? <div>{title}</div> : <div />}
          {action}
        </div>
      ) : null}
      <div className={cn("px-6 py-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function StatusBadge({ children, tone = "default" }: { children: ReactNode; tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]",
        tone === "success" && "bg-[#ebfbf0] text-[#3f9a67]",
        tone === "info" && "bg-[#f4ecff] text-[#7c67c5]",
        tone === "warning" && "bg-[#fff4df] text-[#bb7a15]",
        tone === "danger" && "bg-[#fff0f0] text-[#b64c4c]",
        tone === "default" && "bg-[#f4f2f8] text-[#7d7790]",
      )}
    >
      {children}
    </span>
  );
}

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  const className = "px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7f7897]";
  return htmlFor ? (
    <label htmlFor={htmlFor} className={className}>
      {children}
    </label>
  ) : (
    <div className={className}>{children}</div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  min,
  max,
  step,
}: {
  label: string;
  value: string | number;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  const inputId = useId();
  const hasValue = `${value}`.length > 0;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={inputId}>{label}</Label>
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        style={{ WebkitTextFillColor: hasValue ? "#271a45" : "#8a84a1" }}
        className={cn(
          "w-full rounded-[18px] border border-[#ddd8e9] bg-[#fbfafc] px-4 py-3 text-sm outline-none transition placeholder:text-[#8a84a1] focus:border-[#8f78df] focus:bg-white",
          hasValue ? "text-[#271a45]" : "text-[#8a84a1]",
        )}
      />
    </div>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  helper,
}: {
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  helper?: string;
}) {
  const inputId = useId();
  return (
    <div className="space-y-1.5">
      <Label htmlFor={inputId}>{label}</Label>
      <textarea
        id={inputId}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className="w-full resize-none rounded-[18px] border border-[#ddd8e9] bg-[#fbfafc] px-4 py-3 text-sm text-[#271a45] outline-none transition placeholder:text-[#8a84a1] focus:border-[#8f78df] focus:bg-white"
      />
      {helper ? <p className="px-1 text-xs text-[#8a84a1]">{helper}</p> : null}
    </div>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  emptyLabel,
}: {
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
  emptyLabel?: string;
}) {
  const inputId = useId();
  return (
    <div className="space-y-1.5">
      <Label htmlFor={inputId}>{label}</Label>
      <div className="relative">
        <select
          id={inputId}
          value={value}
          onChange={onChange}
          className={cn(
            "w-full appearance-none rounded-[18px] border border-[#ddd8e9] bg-[#fbfafc] px-4 py-3 pr-10 text-sm outline-none transition focus:border-[#8f78df] focus:bg-white",
            value ? "text-[#271a45]" : "text-[#8a84a1]",
          )}
        >
          {emptyLabel ? (
            <option value="" className="text-[#271a45]">
              {emptyLabel}
            </option>
          ) : null}
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9088a6]" />
      </div>
    </div>
  );
}

export function SecondaryButton({
  children,
  onClick,
  disabled,
  icon,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  icon?: ReactNode;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-[18px] border border-[#ddd8e9] bg-white px-4 py-2.5 text-sm font-semibold text-[#5f5678] transition hover:bg-[#faf8fd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c67c5] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {icon ? <span aria-hidden="true">{icon}</span> : null}
      {children}
    </button>
  );
}

export function PrimaryButton({
  children,
  type = "button",
  onClick,
  disabled,
  icon,
  className,
}: {
  children: ReactNode;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-[18px] bg-[#7c67c5] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_16px_28px_rgba(124,103,197,0.25)] transition hover:bg-[#715abf] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c67c5] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    >
      {icon ? <span aria-hidden="true">{icon}</span> : null}
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold text-[#6d6290] transition hover:text-[#271a45] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c67c5] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export function ChannelChip({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-[#e1daef] bg-white px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#73658f]">
      {label}
    </span>
  );
}
