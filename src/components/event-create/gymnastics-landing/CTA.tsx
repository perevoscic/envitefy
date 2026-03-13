import { ArrowRight, Upload } from "lucide-react";

type CTAProps = {
  discoveryBusy: boolean;
  onUploadClick: () => void;
};

export default function CTA({ discoveryBusy, onUploadClick }: CTAProps) {
  return (
    <section className="px-4 pb-24 pt-20 sm:px-6 lg:px-8 lg:pb-28 lg:pt-24">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-[2.4rem] border border-[#d8def3] bg-[linear-gradient(135deg,#1e1b4b_0%,#26217a_52%,#4f46e5_100%)] p-8 text-white shadow-[0_34px_90px_rgba(30,27,75,0.22)] sm:p-10 lg:p-12">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[#c4cbff]">
            Final CTA
          </p>
          <h2 className="mt-4 font-[var(--font-gym-display)] text-4xl font-bold tracking-[-0.045em] sm:text-5xl">
            Create Your Gymnastics Meet Page
          </h2>
          <p className="mt-5 text-lg leading-8 text-[#e1e5ff]">
            Stop sending families back into PDFs and spreadsheets. Upload your
            meet information once and publish one clean page.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              type="button"
              onClick={onUploadClick}
              disabled={discoveryBusy}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d4af37] px-6 py-4 text-sm font-semibold text-[#342908] shadow-[0_16px_34px_rgba(18,18,45,0.22)] transition hover:-translate-y-0.5 hover:bg-[#e1be4f] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Upload className="h-4 w-4" />
              Upload Meet Info
            </button>
            <a
              href="#gym-example-meet"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/8 px-6 py-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/12"
            >
              View Example Meet Page
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
