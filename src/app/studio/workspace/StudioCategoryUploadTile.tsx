"use client";

import { motion } from "framer-motion";
import { Loader2, Upload } from "lucide-react";

type StudioCategoryUploadTileProps = {
  index: number;
  isUploading: boolean;
  onTrigger: () => void;
};

export function StudioCategoryUploadTile({
  index,
  isUploading,
  onTrigger,
}: StudioCategoryUploadTileProps) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 + 0.2 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onTrigger}
      disabled={isUploading}
      aria-label={isUploading ? "Uploading invite" : "Upload your invite"}
      className="group relative isolate flex h-full w-full flex-col justify-between overflow-hidden rounded-[2rem] border border-[#ddd2f7] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(245,239,255,0.96))] p-3 text-left shadow-[0_18px_42px_-28px_rgba(84,61,140,0.18),inset_0_1px_0_rgba(255,255,255,0.96)] transition-all duration-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#cbb7ff]/55 hover:-translate-y-0.5 hover:shadow-[0_28px_60px_-34px_rgba(96,70,168,0.32)] disabled:cursor-not-allowed disabled:opacity-80 sm:p-6"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.16),transparent_48%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.08),transparent_46%)]" />

      <div className="relative flex items-start justify-between gap-2 sm:gap-3">
        <div className="inline-flex h-9 w-9 items-center justify-center rounded-[0.95rem] border border-[#e6dcfb] bg-white text-[#6f4cd5] shadow-[0_14px_30px_-18px_rgba(111,76,213,0.42)] sm:h-10 sm:w-10 sm:rounded-[1rem]">
          {isUploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin sm:h-4 sm:w-4" />
          ) : (
            <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          )}
        </div>

        <span className="hidden whitespace-nowrap rounded-full border border-[#dfd4fa] bg-white/85 px-2 py-0.5 text-[7px] font-semibold uppercase tracking-[0.04em] text-[#8b74c8] sm:inline-flex sm:px-2.5 sm:py-1 sm:text-[8.5px] sm:tracking-[0.08em]">
          {isUploading ? "Uploading..." : "Images, PDFs"}
        </span>
      </div>

      <div className="relative mt-2 space-y-1 sm:mt-0 sm:space-y-1.5">
        <p className="whitespace-nowrap font-[var(--font-josefin-sans)] text-[0.66rem] font-bold uppercase leading-[0.95] tracking-[0.04em] text-[#2d2146] sm:text-[0.8rem] sm:tracking-[0.07em] lg:text-[0.88rem]">
          Upload Your Invite
        </p>
        <p className="line-clamp-2 max-w-[12rem] text-[10.5px] leading-[1.25] text-[#625775] sm:max-w-[15rem] sm:text-[13px] sm:leading-[1.35]">
          Turn an existing invite int a live card
        </p>
      </div>
    </motion.button>
  );
}
