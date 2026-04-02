import { Upload } from "lucide-react";
import AnimatedButtonLabel from "@/components/ui/AnimatedButtonLabel";
import styles from "./gymnastics-landing.module.css";

type FinalCTAProps = {
  discoveryBusy: boolean;
  onGoToStart: () => void;
};

export default function FinalCTA({ discoveryBusy, onGoToStart }: FinalCTAProps) {
  return (
    <section className="px-4 pb-24 pt-18 sm:px-6 lg:px-8 lg:pb-28 lg:pt-24">
      <div
        className={`${styles.container} overflow-hidden rounded-[2.6rem] border border-[#d8deec] bg-[linear-gradient(135deg,#171b46_0%,#1e2258_58%,#27306f_100%)] px-8 py-10 text-white shadow-[0_34px_90px_rgba(23,27,70,0.22)] sm:px-10 lg:px-12 lg:py-14`}
      >
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[#c7cdf0]">
            Final CTA
          </p>
          <h2 className="mt-4 text-4xl font-bold tracking-[-0.045em] text-white sm:text-5xl">
            Create Your Gymnastics Meet Page
          </h2>
          <p className="mt-5 text-lg leading-8 text-[#e0e5fd]">
            Stop sending families back into PDFs and spreadsheets. Upload your meet information once
            and publish one clean page.
          </p>

          <div className="mt-8 flex items-center justify-center">
            <button
              type="button"
              onClick={onGoToStart}
              disabled={discoveryBusy}
              className="cta-shell h-14 rounded-full bg-[#d4af37] px-6 text-sm font-semibold text-[#342908] shadow-[0_16px_34px_rgba(18,18,45,0.22)] transition hover:-translate-y-0.5 hover:bg-[#e1be4f] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <AnimatedButtonLabel label="Upload Meet Info" icon={Upload} iconPosition="leading" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
