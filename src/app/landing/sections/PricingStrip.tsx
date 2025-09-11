import Link from "next/link";

export default function PricingStrip({ isAuthed }: { isAuthed: boolean }) {
  const primaryHref = "/subscription";
  const secondaryHref = isAuthed ? "/about" : "/";
  return (
    <section className="w-full">
      <div className="max-w-7xl mx-auto px-6 pb-16">
        <div className="rounded-3xl bg-gradient-to-tr from-fuchsia-500/20 via-sky-400/20 to-violet-500/20 p-1">
          <div className="rounded-3xl bg-surface/70 backdrop-blur-sm p-8 ring-1 ring-border text-center">
            <h3 className="text-2xl sm:text-3xl font-bold">
              Ready to snap your next date?
            </h3>
            <p className="mt-2 text-foreground/70 max-w-2xl mx-auto">
              Try it now—no credit card required.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={primaryHref}
                scroll={false}
                className="inline-flex items-center justify-center rounded-2xl px-6 py-3 text-base font-semibold bg-primary text-on-primary hover:opacity-95"
              >
                {isAuthed ? "Manage plan" : "Get started free"}
              </Link>
              <Link
                href={secondaryHref}
                scroll={false}
                className="inline-flex items-center justify-center rounded-2xl px-6 py-3 text-base font-semibold border border-border text-foreground/80 hover:text-foreground hover:bg-surface/70"
              >
                {isAuthed ? "Learn more" : "Sign in"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
