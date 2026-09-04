"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronDown,
  Clapperboard,
  ImagePlus,
  Images,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
import {
  ADVANCED_FORM_FIELDS,
  BRAND_ASSETS,
  MARKETING_CHANNELS,
  SOCIAL_PLACEMENTS,
  TARGET_VERTICALS,
  VIDEO_FORMATS,
  type AssetType,
  type BrandAssetId,
  type MarketingChannel,
  type MarketingHubForm,
  type MarketingPromptIdea,
} from "@/lib/admin/marketing-hub";
import {
  GhostButton,
  Label,
  PageCard,
  PrimaryButton,
  SelectField,
  TextAreaField,
  TextField,
} from "./MarketingHubUi";
import { cn } from "@/lib/utils";

export function MarketingHubNewCampaign({
  form,
  setForm,
  submitting,
  generatingPrompt,
  showAdvanced,
  setShowAdvanced,
  promptIdea,
  referenceImageFiles,
  setReferenceImageFiles,
  onBack,
  onGenerate,
  onGeneratePromptIdea,
  onAssetTypeChange,
  onToggleChannel,
  onToggleBrandAsset,
  onSocialPlacementChange,
}: {
  form: MarketingHubForm;
  setForm: (updater: (current: MarketingHubForm) => MarketingHubForm) => void;
  submitting: boolean;
  generatingPrompt: boolean;
  showAdvanced: boolean;
  setShowAdvanced: (value: boolean | ((current: boolean) => boolean)) => void;
  promptIdea: MarketingPromptIdea | null;
  referenceImageFiles: File[];
  setReferenceImageFiles: (updater: (current: File[]) => File[]) => void;
  onBack: () => void;
  onGenerate: (event: React.FormEvent) => void;
  onGeneratePromptIdea: () => void;
  onAssetTypeChange: (assetType: AssetType) => void;
  onToggleChannel: (channel: MarketingChannel) => void;
  onToggleBrandAsset: (asset: BrandAssetId) => void;
  onSocialPlacementChange: (value: string) => void;
}) {
  const formIsSocialImage = form.assetType === "social-image";
  const canGenerate = Boolean(form.idea.trim() || form.criteria.trim()) && form.channels.length > 0;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <GhostButton onClick={onBack}>← Library</GhostButton>
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#7c67c5]">
          Marketing Hub
        </p>
        <h1 className="mt-1 font-[var(--font-playfair)] text-4xl font-semibold tracking-[-0.04em] text-[#23183d]">
          New campaign
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#7a7391]">
          Name it if you want, describe the idea, pick platforms, and generate. You will leave with
          downloads and paste-ready copy.
        </p>
      </div>

      <PageCard>
        <form onSubmit={onGenerate} className="space-y-5">
          <TextField
            label="Campaign name"
            value={form.campaignName}
            onChange={(event) =>
              setForm((current) => ({ ...current, campaignName: event.target.value }))
            }
            placeholder="Optional"
          />

          <TextAreaField
            label="Idea"
            value={form.idea}
            onChange={(event) => setForm((current) => ({ ...current, idea: event.target.value }))}
            placeholder="Example: Show busy parents how one Envitefy link replaces scattered birthday details."
            rows={4}
            helper="A sentence or two is enough."
          />

          <fieldset className="space-y-3">
            <legend className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7f7897]">
              Platforms
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {MARKETING_CHANNELS.map((channel) => {
                const selected = form.channels.includes(channel.value);
                return (
                  <button
                    key={channel.value}
                    type="button"
                    onClick={() => onToggleChannel(channel.value)}
                    aria-pressed={selected}
                    className={cn(
                      "flex min-h-11 cursor-pointer items-center gap-2 rounded-[16px] border px-3 py-2.5 text-left text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c67c5] focus-visible:ring-offset-2",
                      selected
                        ? "border-[#7c67c5] bg-[#f3edff] text-[#4b367c]"
                        : "border-[#e5e0ee] bg-[#fbfafc] text-[#736b88] hover:border-[#cfc6e5] hover:bg-white",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-[10px] text-[9px] font-black",
                        selected ? "bg-[#7c67c5] text-white" : "bg-white text-[#71658d]",
                      )}
                    >
                      {channel.shortLabel}
                    </span>
                    {channel.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7f7897]">
              Asset type
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  value: "social-image" as const,
                  label: "Social image",
                  description: "Finished, downloadable posts",
                  icon: Images,
                },
                {
                  value: "short-video" as const,
                  label: "Short-form video",
                  description: "Storyboard, captions, MP4",
                  icon: Clapperboard,
                },
              ].map((option) => {
                const selected = form.assetType === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onAssetTypeChange(option.value)}
                    aria-pressed={selected}
                    className={cn(
                      "min-h-[104px] cursor-pointer rounded-[22px] border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c67c5] focus-visible:ring-offset-2",
                      selected
                        ? "border-[#8f78df] bg-[#f3edff] shadow-[0_12px_30px_rgba(93,63,174,0.12)]"
                        : "border-[#e5e0ee] bg-[#fbfafc] hover:border-[#cfc6e5] hover:bg-white",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-[14px]",
                        selected ? "bg-[#7c67c5] text-white" : "bg-white text-[#7c67c5]",
                      )}
                    >
                      <option.icon className="h-5 w-5" />
                    </span>
                    <div className="mt-3 text-sm font-bold text-[#271a45]">{option.label}</div>
                    <div className="mt-1 text-xs leading-5 text-[#7d7593]">{option.description}</div>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <PrimaryButton
            type="submit"
            disabled={submitting || !canGenerate}
            className="w-full py-3.5"
            icon={
              submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )
            }
          >
            {submitting ? "Generating…" : "Generate"}
          </PrimaryButton>

          <button
            type="button"
            onClick={() => setShowAdvanced((value) => !value)}
            aria-expanded={showAdvanced}
            className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#8b7fc0] transition hover:text-[#6e5db8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c67c5]"
          >
            Advanced
            <ChevronDown className={cn("h-4 w-4 transition", showAdvanced && "rotate-180")} />
          </button>

          <AnimatePresence initial={false}>
            {showAdvanced ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-5 border-t border-[#f0ecf7] pt-5">
                  <TextAreaField
                    label="Production prompt"
                    value={form.criteria}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, criteria: event.target.value }))
                    }
                    placeholder="Optional. Leave blank to generate from the idea."
                    rows={5}
                    helper="If empty, Generate uses the idea as the production brief."
                  />
                  <PrimaryButton
                    onClick={onGeneratePromptIdea}
                    disabled={generatingPrompt || !form.idea.trim() || !form.channels.length}
                    className="w-full"
                    icon={
                      generatingPrompt ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )
                    }
                  >
                    {generatingPrompt ? "Refining prompt…" : "Refine idea into a production prompt"}
                  </PrimaryButton>
                  {promptIdea ? (
                    <div className="rounded-[22px] border border-[#cfe7dc] bg-[#f2fbf6] p-4">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[#39795a]">
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        Prompt ready
                      </div>
                      <div className="mt-2 text-sm font-bold text-[#244633]">
                        {promptIdea.campaignAngle}
                      </div>
                      <p className="mt-2 text-xs leading-5 text-[#51705e]">{promptIdea.rationale}</p>
                    </div>
                  ) : null}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField
                      label="Audience"
                      value={form.audience}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, audience: event.target.value }))
                      }
                      placeholder="Busy parents"
                    />
                    <TextField
                      label="Campaign goal"
                      value={form.objective}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, objective: event.target.value }))
                      }
                      placeholder="Drive new event creation"
                    />
                    <SelectField
                      label="Category"
                      value={form.targetVertical}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, targetVertical: event.target.value }))
                      }
                      emptyLabel="General"
                      options={TARGET_VERTICALS.filter((vertical) => vertical !== "General")}
                    />
                    <TextField
                      label={formIsSocialImage ? "Post concepts" : "Frames"}
                      type="number"
                      min={1}
                      max={24}
                      value={form.frameCount}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, frameCount: event.target.value }))
                      }
                      placeholder={formIsSocialImage ? "3" : "5"}
                    />
                    <TextField
                      label="Tone"
                      value={form.tone}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, tone: event.target.value }))
                      }
                      placeholder="premium, modern, social-native"
                    />
                    <TextField
                      label="Call to action"
                      value={form.callToAction}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, callToAction: event.target.value }))
                      }
                      placeholder="Start your event page"
                    />
                  </div>

                  <fieldset className="space-y-3">
                    <legend className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7f7897]">
                      {formIsSocialImage ? "Social placement" : "Video format"}
                    </legend>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {(formIsSocialImage ? SOCIAL_PLACEMENTS : VIDEO_FORMATS).map((option) => {
                        const selected = formIsSocialImage
                          ? form.socialPlacement === option.value
                          : form.cameraFormat === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() =>
                              formIsSocialImage
                                ? onSocialPlacementChange(option.value)
                                : setForm((current) => ({
                                    ...current,
                                    cameraFormat: option.value,
                                  }))
                            }
                            aria-pressed={selected}
                            className={cn(
                              "min-h-[88px] cursor-pointer rounded-[18px] border px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c67c5] focus-visible:ring-offset-2",
                              selected
                                ? "border-[#8f78df] bg-[#f3edff]"
                                : "border-[#e5e0ee] bg-[#fbfafc] hover:border-[#cfc6e5] hover:bg-white",
                            )}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-[#2b2045]">{option.label}</span>
                              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-[#71668b]">
                                {option.ratio}
                              </span>
                            </div>
                            <div className="mt-1 text-[10px] leading-4 text-[#837b99]">
                              {option.detail}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>

                  <fieldset className="space-y-3">
                    <legend className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7f7897]">
                      Official Envitefy brand assets
                    </legend>
                    <div className="grid gap-2">
                      {BRAND_ASSETS.map((asset) => {
                        const selected = form.brandAssets.includes(asset.value);
                        return (
                          <button
                            key={asset.value}
                            type="button"
                            onClick={() => onToggleBrandAsset(asset.value)}
                            aria-pressed={selected}
                            className={cn(
                              "flex min-h-[76px] cursor-pointer items-center gap-3 rounded-[18px] border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c67c5] focus-visible:ring-offset-2",
                              selected
                                ? "border-[#8f78df] bg-[#f5f0ff]"
                                : "border-[#e5e0ee] bg-[#fbfafc] hover:border-[#cfc6e5] hover:bg-white",
                            )}
                          >
                            <span className="flex h-12 w-[116px] shrink-0 items-center justify-center rounded-[12px] border border-[#ebe6f2] bg-white px-2">
                              <Image
                                src={asset.src}
                                alt={asset.label}
                                width={asset.value === "wordmark" ? 100 : 44}
                                height={asset.value === "wordmark" ? 32 : 44}
                                className={cn(
                                  "object-contain",
                                  asset.value === "wordmark" ? "h-auto w-[100px]" : "h-11 w-11",
                                )}
                              />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-xs font-bold text-[#2b2045]">
                                {asset.label}
                              </span>
                              <span className="mt-1 block text-[10px] leading-4 text-[#7d7593]">
                                {asset.description}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>

                  <div className="space-y-3">
                    <Label>Reference images</Label>
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-[18px] border border-dashed border-[#ccc4df] bg-[#fbfafc] px-4 py-4 text-sm font-semibold text-[#62577d] transition hover:border-[#8f78df] hover:bg-white">
                      <ImagePlus className="h-4 w-4 text-[#7c67c5]" />
                      Add images for visual reference
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        multiple
                        className="sr-only"
                        onChange={(event) => {
                          const selected = Array.from(event.target.files || []);
                          setReferenceImageFiles((current) => [...current, ...selected].slice(0, 8));
                          event.target.value = "";
                        }}
                      />
                    </label>
                    {referenceImageFiles.length > 0 ? (
                      <div className="space-y-2">
                        {referenceImageFiles.map((file, index) => (
                          <div
                            key={`${file.name}-${file.size}-${index}`}
                            className="flex items-center justify-between gap-3 rounded-[16px] border border-[#eee9f6] bg-white px-3 py-2 text-xs font-medium text-[#5f5678]"
                          >
                            <span className="min-w-0 truncate">{file.name}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setReferenceImageFiles((current) =>
                                  current.filter((_file, fileIndex) => fileIndex !== index),
                                )
                              }
                              className="shrink-0 rounded-full p-1 text-[#9188a6] transition hover:bg-[#f4f1fa] hover:text-[#4f4582]"
                              aria-label={`Remove ${file.name}`}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="px-1 text-xs text-[#8a84a1]">
                        Optional. Upload up to 8 JPG, PNG, or WebP images.
                      </p>
                    )}
                  </div>

                  <TextAreaField
                    label="Optional guardrails"
                    value={form.notes}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, notes: event.target.value }))
                    }
                    placeholder="Same woman, clean counters, phone screen visible."
                    rows={3}
                  />

                  {ADVANCED_FORM_FIELDS.map(({ key, label }) => (
                    <TextField
                      key={key}
                      label={label}
                      value={form[key]}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, [key]: event.target.value }))
                      }
                    />
                  ))}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </form>
      </PageCard>
    </div>
  );
}
