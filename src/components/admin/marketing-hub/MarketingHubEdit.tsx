"use client";

import { Loader2, Save, Sparkles } from "lucide-react";
import { KINETIC_STYLES, type AssetType, type Caption, type Frame } from "@/lib/admin/marketing-hub";
import {
  PageCard,
  SecondaryButton,
  SelectField,
  StatusBadge,
  TextAreaField,
  TextField,
} from "./MarketingHubUi";
import { statusLabel, statusTone } from "@/lib/admin/marketing-hub";

export function MarketingHubEdit({
  assetType,
  frameRows,
  runIsActive,
  savingCaptions,
  regeneratingCaptions,
  onSaveCaptions,
  onRegenerateCaptions,
  onUpdateCaption,
}: {
  assetType: AssetType;
  frameRows: Frame[];
  runIsActive: boolean;
  savingCaptions: boolean;
  regeneratingCaptions: boolean;
  onSaveCaptions: () => void;
  onRegenerateCaptions: () => void;
  onUpdateCaption: (frameNumber: number, field: keyof Caption, value: string | number) => void;
}) {
  const isSocialImage = assetType === "social-image";

  return (
    <PageCard
      title={
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#897db6]">
            Optional
          </div>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[#24193f]">Edit</h2>
          <p className="mt-1 text-sm text-[#7a7391]">
            Tweak on-image captions, then save or regenerate copy. Copy desk packs update after
            save.
          </p>
        </div>
      }
      action={
        <div className="flex flex-wrap gap-2">
          <SecondaryButton
            onClick={onRegenerateCaptions}
            disabled={runIsActive || regeneratingCaptions}
            icon={
              regeneratingCaptions ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )
            }
          >
            {regeneratingCaptions ? "Regenerating…" : "Regenerate copy"}
          </SecondaryButton>
          <SecondaryButton
            onClick={onSaveCaptions}
            disabled={runIsActive || savingCaptions}
            icon={
              savingCaptions ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />
            }
          >
            {savingCaptions ? "Saving…" : "Save captions"}
          </SecondaryButton>
        </div>
      }
    >
      {frameRows.length ? (
        <div className="space-y-4">
          {frameRows.map((frame) => (
            <div key={frame.frameNumber} className="rounded-[22px] border border-[#efebf6] p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-[#24193f]">
                  {isSocialImage ? "Post" : "Frame"} {frame.frameNumber}: {frame.title}
                </div>
                <StatusBadge tone={statusTone(frame.status)}>{statusLabel(frame.status)}</StatusBadge>
              </div>
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_160px]">
                <TextField
                  label={isSocialImage ? "Post headline" : "Caption text"}
                  value={frame.caption.text || ""}
                  onChange={(event) => onUpdateCaption(frame.frameNumber, "text", event.target.value)}
                />
                <TextField
                  label="Emphasis word"
                  value={frame.caption.emphasisWord || ""}
                  onChange={(event) =>
                    onUpdateCaption(frame.frameNumber, "emphasisWord", event.target.value)
                  }
                />
                <div className="rounded-[18px] border border-[#efebf6] bg-[#fbfafc] px-4 py-3">
                  <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8a7bc4]">
                    Status
                  </div>
                  <div className="mt-2 text-sm font-semibold text-[#5a4f75]">
                    {frame.caption.status}
                    {frame.caption.dirty ? " · unsaved" : ""}
                  </div>
                </div>
              </div>
              {isSocialImage ? (
                <div className="mt-4">
                  <TextAreaField
                    label="Shared caption"
                    value={frame.caption.voiceover || ""}
                    onChange={(event) =>
                      onUpdateCaption(frame.frameNumber, "voiceover", event.target.value)
                    }
                    rows={3}
                    helper="Used to adapt Instagram, Facebook, TikTok, and YouTube paste packs."
                  />
                </div>
              ) : (
                <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField
                      label="Duration"
                      type="number"
                      min={1.2}
                      max={3.5}
                      step={0.1}
                      value={frame.caption.durationSec ?? 2}
                      onChange={(event) =>
                        onUpdateCaption(frame.frameNumber, "durationSec", Number(event.target.value))
                      }
                    />
                    <SelectField
                      label="Kinetic style"
                      value={frame.caption.kineticStyle || "static"}
                      onChange={(event) =>
                        onUpdateCaption(frame.frameNumber, "kineticStyle", event.target.value)
                      }
                      options={KINETIC_STYLES}
                    />
                  </div>
                  <TextAreaField
                    label="Voiceover"
                    value={frame.caption.voiceover || ""}
                    onChange={(event) =>
                      onUpdateCaption(frame.frameNumber, "voiceover", event.target.value)
                    }
                    rows={3}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[22px] border border-dashed border-[#ddd8e9] px-5 py-10 text-center text-sm text-[#8a84a1]">
          Captions appear here after generation.
        </div>
      )}
    </PageCard>
  );
}
