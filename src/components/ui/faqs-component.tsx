import { ChevronDown } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type FAQItem = {
  id: string;
  question: string;
  answer: ReactNode;
};

type FAQsProps = {
  items: readonly FAQItem[];
  title?: string;
  description?: string;
  sectionId?: string;
  headingLevel?: "h1" | "h2";
  showHeader?: boolean;
  defaultValue?: string;
  supportText?: string;
  supportHref?: string;
  supportLinkLabel?: string;
  className?: string;
  accordionClassName?: string;
};

function FAQHeading({
  id,
  level,
  children,
}: {
  id: string;
  level: "h1" | "h2";
  children: ReactNode;
}) {
  const className = "text-foreground text-4xl font-semibold tracking-tight sm:text-5xl";

  if (level === "h1") {
    return (
      <h1 id={id} className={className}>
        {children}
      </h1>
    );
  }

  return (
    <h2 id={id} className={className}>
      {children}
    </h2>
  );
}

function SupportLink({
  className,
  supportHref,
  supportLinkLabel,
  supportText,
}: {
  className?: string;
  supportHref: string;
  supportLinkLabel: string;
  supportText: string;
}) {
  return (
    <p className={cn("text-muted-foreground text-base leading-7", className)}>
      {supportText}{" "}
      <Link href={supportHref} className="text-primary font-medium hover:underline">
        {supportLinkLabel}
      </Link>
    </p>
  );
}

export default function FAQs({
  items,
  title = "FAQs",
  description = "Your questions answered",
  sectionId = "faq",
  headingLevel = "h2",
  showHeader = true,
  defaultValue,
  supportText = "Can't find what you're looking for? Contact our",
  supportHref = "/contact",
  supportLinkLabel = "customer support team",
  className,
  accordionClassName,
}: FAQsProps) {
  const headingId = `${sectionId}-heading`;
  const accordionName = `${sectionId}-accordion`;

  return (
    <section
      id={sectionId}
      className={cn("py-16 md:py-24", className)}
      aria-labelledby={showHeader ? headingId : undefined}
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className={cn("grid gap-8 md:gap-12", showHeader && "md:grid-cols-5")}>
          {showHeader ? (
            <div className="md:col-span-2">
              <FAQHeading id={headingId} level={headingLevel}>
                {title}
              </FAQHeading>
              {description ? (
                <p className="text-muted-foreground mt-4 text-balance text-lg leading-8">
                  {description}
                </p>
              ) : null}
              <SupportLink
                className="mt-6 hidden md:block"
                supportHref={supportHref}
                supportLinkLabel={supportLinkLabel}
                supportText={supportText}
              />
            </div>
          ) : null}

          <div className={showHeader ? "md:col-span-3" : "w-full"}>
            <div
              className={cn(
                "bg-card w-full rounded-[var(--radius)] border border-border px-6 py-2 shadow-sm ring-1 ring-foreground/5 sm:px-8",
                accordionClassName,
              )}
            >
              {items.map((item) => (
                <details
                  key={item.id}
                  name={accordionName}
                  open={item.id === defaultValue || undefined}
                  className="group border-b border-dotted last:border-b-0"
                >
                  <summary className="flex min-h-12 touch-manipulation cursor-pointer list-none items-center justify-between gap-4 rounded-md py-4 text-left text-base font-semibold leading-7 transition-colors hover:bg-foreground/[0.035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:bg-foreground/[0.06] [&::-webkit-details-marker]:hidden">
                    <span>{item.question}</span>
                    <ChevronDown
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
                    />
                  </summary>
                  <div className="pb-4 pt-0">
                    {typeof item.answer === "string" ? (
                      <p className="text-muted-foreground text-base leading-7">{item.answer}</p>
                    ) : (
                      item.answer
                    )}
                  </div>
                </details>
              ))}
            </div>
          </div>

          {showHeader ? (
            <SupportLink
              className="md:hidden"
              supportHref={supportHref}
              supportLinkLabel={supportLinkLabel}
              supportText={supportText}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
