export default function Testimonials() {
  return (
    <section aria-labelledby="parents-love" className="w-full">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h2
          id="parents-love"
          className="text-2xl sm:text-3xl font-bold text-center"
        >
          What parents say
        </h2>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
          <figure className="rounded-2xl bg-surface/70 border border-border p-6">
            <blockquote className="text-foreground/80">
              “Finally, no re‑typing school flyers. It’s become our go‑to for
              family events.”
            </blockquote>
            <figcaption className="mt-3 text-sm text-foreground/60">
              — Emily, mom of two
            </figcaption>
          </figure>
          <figure className="rounded-2xl bg-surface/70 border border-border p-6">
            <blockquote className="text-foreground/80">
              “I snapped the soccer schedule and it added every date perfectly.”
            </blockquote>
            <figcaption className="mt-3 text-sm text-foreground/60">
              — Marcus, dad & coach
            </figcaption>
          </figure>
          <figure className="rounded-2xl bg-surface/70 border border-border p-6">
            <blockquote className="text-foreground/80">
              “So simple my teens use it to save their activities. Love it!”
            </blockquote>
            <figcaption className="mt-3 text-sm text-foreground/60">
              — Priya, parent of teens
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
