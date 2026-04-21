"use client";

import { motion } from "framer-motion";
import { useRef } from "react";
import { getUploadAcceptAttribute } from "@/utils/media-upload-client";
import type { EventDetails, InviteCategory } from "../studio-workspace-types";
import { StudioCategoryGrid } from "./StudioCategoryGrid";
import { STUDIO_CATEGORY_TILES } from "./studio-category-tile-data";

type StudioCategoryStepProps = {
  details: EventDetails;
  onSelectCategory: (category: InviteCategory) => void;
  onUploadInvitation: (file: File) => Promise<void>;
  isInvitationUploading: boolean;
  invitationUploadError: string | null;
};

export function StudioCategoryStep({
  details,
  onSelectCategory,
  onUploadInvitation,
  isInvitationUploading,
  invitationUploadError,
}: StudioCategoryStepProps) {
  const invitationInputRef = useRef<HTMLInputElement | null>(null);
  const accept = getUploadAcceptAttribute("attachment");

  return (
    <motion.div
      key="type"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mx-auto w-full max-w-[1380px] px-0 pb-10 sm:px-4 sm:pb-12 lg:px-6"
    >
      <div className="relative overflow-visible">
        <div className="absolute left-6 top-8 h-40 w-40 rounded-full bg-[#eee4ff]/65 blur-3xl" />
        <div className="absolute right-8 top-10 h-32 w-32 rounded-full bg-[#f3ebff]/85 blur-3xl" />
        <div className="relative">
          <header className="mb-12 space-y-4 text-center md:mb-16">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8b74c8]/80"
            >
              Choose Your Invite Type
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-[var(--font-playfair)] text-4xl font-medium tracking-[-0.04em] text-gray-900 md:text-6xl"
            >
              What are we celebrating?
            </motion.h2>
          </header>

          <div className="space-y-6">
            <StudioCategoryGrid
              categories={STUDIO_CATEGORY_TILES}
              selectedCategory={details.category}
              onSelect={onSelectCategory}
              onUploadAction={() => invitationInputRef.current?.click()}
              isUploadActionPending={isInvitationUploading}
            />

            {invitationUploadError ? (
              <p className="text-sm leading-6 text-[#a4564f]">{invitationUploadError}</p>
            ) : null}
          </div>

          <input
            ref={invitationInputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void onUploadInvitation(file);
              }
              event.target.value = "";
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}
