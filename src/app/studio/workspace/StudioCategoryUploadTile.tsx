"use client";

import { motion } from "framer-motion";

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
      className="group relative isolate h-full w-full overflow-hidden rounded-[2rem] border border-white/40 bg-[#1d1330] p-3 text-left shadow-[0_18px_42px_-28px_rgba(84,61,140,0.28),inset_0_1px_0_rgba(255,255,255,0.16)] transition-all duration-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#cbb7ff]/55 hover:-translate-y-0.5 hover:shadow-[0_28px_60px_-34px_rgba(96,70,168,0.4)] disabled:cursor-not-allowed disabled:opacity-80 sm:p-6"
    >
      <div className="absolute inset-0">
        <img
          src="/studio/upload-your-own.webp"
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(24,14,42,0.1),rgba(22,14,38,0.26)_34%,rgba(18,12,32,0.56))]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.2),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.18),transparent_38%)]" />
      </div>

      <div className="absolute inset-0 flex flex-col justify-end pl-3 pr-4 pb-3 pt-10 text-left sm:px-8 sm:pb-4 sm:pt-8 lg:pb-3">
        <div className="relative w-full max-w-[280px] space-y-2 self-start sm:space-y-1">
          <p className="font-[var(--font-josefin-sans)] text-[1rem] font-bold uppercase leading-none tracking-[0.13em] text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)] sm:text-[1.08rem] lg:text-[1.16rem]">
            Upload Your Invite
          </p>
          <p className="hidden max-w-[280px] text-left text-sm leading-relaxed text-white/80 sm:block">
            Turn an existing invite int a live card
          </p>
        </div>
      </div>
    </motion.button>
  );
}
