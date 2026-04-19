"use client";

import { Image as ImageIcon, Layout, Loader2, WandSparkles } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import LiveCardHeroTextOverlay from "@/components/studio/LiveCardHeroTextOverlay";
import StudioLiveCardActionSurface from "@/components/studio/StudioLiveCardActionSurface";
import { getStudioShareTitle } from "../studio-workspace-builders";
import type {
  ActiveTab,
  EventDetails,
  MediaItem,
} from "../studio-workspace-types";

type StudioPhonePreviewPaneProps = {
  details: EventDetails;
  currentProjectWithVisualDraft: MediaItem | null;
  currentProjectDisplayUrl: string;
  currentProjectHasUnsavedChanges: boolean;
  currentProjectSaveLabel: string;
  savedCurrentProject: MediaItem | null;
  currentProjectPreviewTab: ActiveTab;
  setCurrentProjectPreviewTab: Dispatch<SetStateAction<ActiveTab>>;
  currentProjectPreviewShareUrl: string;
  isGenerating: boolean;
  sharingId: string | null;
  copySuccess: boolean;
  saveCurrentProjectToLibrary: () => void;
  shareCurrentProject: () => void;
  openCurrentImage: () => void;
  handleMediaImageLoadError: (item: MediaItem) => void;
  onSuggestionPick?: (suggestion: string) => void;
};

type StudioShowcaseCard = {
  title: string;
  category: EventDetails["category"] | "Custom Invite";
  source: "landing" | "studio";
  imageUrl: string;
};

const SUGGESTION_LIBRARY: Record<string, string[]> = {
  Birthday: [
    "Space quest with shimmering planets and astronaut helmets",
    "Backyard unicorn parade with iridescent confetti and tulle",
    "Comic-book superhero panels in candy-bright pop colors",
    "Safari expedition tent with golden savanna sunset",
  ],
  Wedding: [
    "Garden estate with climbing roses and string lights",
    "Editorial coastal elopement on a cliffside at golden hour",
    "Vintage veil with antique lace and heirloom stationery",
    "Modern monochrome ceremony with crisp architectural lines",
  ],
  "Bridal Shower": [
    "Garden brunch with mimosa bar and pastel florals",
    "Parisian tea service with tiered desserts",
    "Tropical bridal pool day with hibiscus brights",
    "Cottage romance with hand-tied bouquets and lace",
  ],
  "Baby Shower": [
    "Soft cloud nursery with twinkling stars",
    "Little safari with woven rattles and friendly animals",
    "Woodland hush with foxes, bunnies, and forest greens",
    "Sweet sherbet pastels with airy paper garlands",
  ],
  Anniversary: [
    "Romantic candlelight dinner under a chandelier",
    "Silver milestone evening with crystal and confetti",
    "Vintage romance gallery with sepia photographs",
    "Garden vow renewal at golden hour",
  ],
  Housewarming: [
    "Cozy modern living room with golden-hour glow",
    "Garden patio with string lights and potted greens",
    "Loft industrial open house with edison bulbs",
    "Mid-century evening with walnut warmth and mustard accents",
  ],
  "Field Trip/Day": [
    "Sunny museum quest with curious explorers",
    "Trail trek with backpacks and leafy canopy",
    "Hands-on science lab with bright beakers",
    "City discovery with skyline backdrops",
  ],
  "Game Day": [
    "Friday night stadium lights with team pennants",
    "Tailgate sunset with grills and team colors",
    "Halftime hype with marching band brass",
    "Championship gold confetti and trophy glow",
  ],
  "Custom Invite": [
    "Modern minimal soiree with bold typography",
    "Festival pop with layered patterns and crowd energy",
    "Hand-drawn charm with watercolor washes",
    "Luxe noir after-hours with gold foil",
  ],
};

const STUDIO_PHONE_SHOWCASE_CARDS: StudioShowcaseCard[] = [
  {
    title: "Garden Vows",
    category: "Wedding",
    source: "landing",
    imageUrl: "/images/landing/live-cards/garden-vows.webp",
  },
  {
    title: "Wedding Weekend",
    category: "Wedding",
    source: "studio",
    imageUrl: "/images/studio/invite-wedding-weekend.webp",
  },
  {
    title: "Lara’s 7th Dino-Quest",
    category: "Birthday",
    source: "landing",
    imageUrl: "/images/landing/live-cards/lara-s-7th-dino-quest.webp",
  },
  {
    title: "Birthday Bash",
    category: "Birthday",
    source: "studio",
    imageUrl: "/images/studio/invite-birthday-bash.webp",
  },
  {
    title: "Elena’s Baby Shower",
    category: "Baby Shower",
    source: "landing",
    imageUrl: "/images/landing/live-cards/elena-s-baby-shower.webp",
  },
  {
    title: "Blush Brunch Shower",
    category: "Bridal Shower",
    source: "landing",
    imageUrl: "/images/landing/live-cards/blush-brunch-shower.webp",
  },
  {
    title: "Friday Night Lights",
    category: "Game Day",
    source: "landing",
    imageUrl: "/images/landing/live-cards/friday-night-lights-a.webp",
  },
  {
    title: "School Event",
    category: "Field Trip/Day",
    source: "studio",
    imageUrl: "/images/studio/invite-school-event.webp",
  },
  {
    title: "Founder Appreciation Night",
    category: "Custom Invite",
    source: "landing",
    imageUrl: "/images/landing/live-cards/founder-appreciation-night.webp",
  },
  {
    title: "Team Offsite",
    category: "Custom Invite",
    source: "studio",
    imageUrl: "/images/studio/invite-team-offsite.webp",
  },
];

function getShowcaseCards(category: EventDetails["category"]): StudioShowcaseCard[] {
  const cardsForCategory = STUDIO_PHONE_SHOWCASE_CARDS.filter(
    (card) => card.category === category,
  );
  if (cardsForCategory.length > 0) {
    return cardsForCategory;
  }
  return STUDIO_PHONE_SHOWCASE_CARDS.filter((card) => card.category === "Custom Invite");
}

function getSuggestions(category: EventDetails["category"]): string[] {
  return SUGGESTION_LIBRARY[category] ?? SUGGESTION_LIBRARY["Custom Invite"];
}

export function StudioPhonePreviewPane({
  details,
  currentProjectWithVisualDraft,
  currentProjectDisplayUrl,
  currentProjectHasUnsavedChanges,
  currentProjectSaveLabel,
  savedCurrentProject,
  currentProjectPreviewTab,
  setCurrentProjectPreviewTab,
  currentProjectPreviewShareUrl,
  isGenerating,
  sharingId,
  copySuccess,
  saveCurrentProjectToLibrary,
  shareCurrentProject,
  openCurrentImage,
  handleMediaImageLoadError,
  onSuggestionPick,
}: StudioPhonePreviewPaneProps) {
  const hasPreview = Boolean(currentProjectWithVisualDraft);
  const suggestions = getSuggestions(details.category);
  const showcaseCards = getShowcaseCards(details.category);

  return (
    <div className="studio-phone-stage relative flex w-full flex-col items-center justify-start gap-4 pb-4 lg:h-full lg:justify-center lg:gap-5 lg:pb-0 lg:translate-x-6">
      <div
        className="relative flex w-full items-start justify-center lg:min-h-0 lg:flex-1 lg:items-center"
        role="region"
        aria-label="Live card phone preview"
      >
        <div className="studio-phone-frame relative aspect-[9/16] w-full max-w-[min(100%,340px)] overflow-hidden rounded-[3rem] border-[10px] border-[var(--studio-ink,#1A1A1A)] bg-[var(--studio-paper,#f7f2ec)] shadow-[0_36px_80px_rgba(31,18,52,0.18)] lg:h-full lg:w-auto lg:max-h-[min(82vh,620px)] lg:max-w-full">
          <div className="absolute left-1/2 top-3 z-20 h-1.5 w-20 -translate-x-1/2 rounded-full bg-[var(--studio-ink,#1A1A1A)]/80" />

          {isGenerating && !hasPreview ? (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-[var(--studio-paper,#f7f2ec)]/90 px-6 text-center backdrop-blur-md">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[var(--studio-brand,#7c5cd1)]/30 bg-white/85 shadow-[0_18px_44px_rgba(124,92,209,0.18)]">
                <Loader2 className="h-7 w-7 animate-spin text-[var(--studio-brand,#7c5cd1)]" />
              </div>
              <p className="font-[var(--font-playfair)] text-2xl text-[var(--studio-ink,#1A1A1A)]">
                Crafting Magic
              </p>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--studio-ink-soft,#6f5e8c)]">
                Composing your invitation
              </p>
            </div>
          ) : null}

          {hasPreview && currentProjectWithVisualDraft ? (
            <div
              className={`relative h-full w-full overflow-hidden bg-[#efe7dc] ${
                currentProjectWithVisualDraft.details.orientation === "portrait"
                  ? "aspect-[9/16]"
                  : "aspect-[16/9]"
              }`}
            >
              {currentProjectWithVisualDraft.status === "loading" ? (
                <div className="flex h-full w-full flex-col items-center justify-center gap-4">
                  <Loader2 className="h-10 w-10 animate-spin text-[var(--studio-brand,#7c5cd1)]" />
                  <span className="animate-pulse text-xs font-semibold uppercase tracking-[0.2em] text-[var(--studio-ink-soft,#6f5e8c)]">
                    Processing {currentProjectWithVisualDraft.type}...
                  </span>
                </div>
              ) : currentProjectWithVisualDraft.status === "error" ? (
                <div className="flex h-full w-full items-center justify-center p-8 text-center">
                  <div>
                    <p className="mb-2 font-semibold text-red-600">Generation Failed</p>
                    {currentProjectWithVisualDraft.errorMessage ? (
                      <p className="mb-4 text-sm leading-6 text-[var(--studio-ink-soft,#6f5e8c)]">
                        {currentProjectWithVisualDraft.errorMessage}
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : (
                <>
                  <img
                    src={currentProjectDisplayUrl}
                    alt={currentProjectWithVisualDraft.theme}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={() => handleMediaImageLoadError(currentProjectWithVisualDraft)}
                  />
                  {currentProjectWithVisualDraft.type === "page" ? (
                    <>
                      <LiveCardHeroTextOverlay
                        invitationData={currentProjectWithVisualDraft.data}
                      />
                      <StudioLiveCardActionSurface
                        title={getStudioShareTitle(currentProjectWithVisualDraft)}
                        invitationData={currentProjectWithVisualDraft.data}
                        activeTab={currentProjectPreviewTab}
                        onActiveTabChange={setCurrentProjectPreviewTab}
                        positions={currentProjectWithVisualDraft.positions}
                        shareUrl={currentProjectPreviewShareUrl}
                        onShare={shareCurrentProject}
                        shareState={
                          sharingId === currentProjectWithVisualDraft.id
                            ? "pending"
                            : copySuccess
                              ? "success"
                              : "idle"
                        }
                        showExtendedDetails
                        registryHelperText={
                          currentProjectWithVisualDraft.data?.interactiveMetadata?.shareNote
                        }
                      />
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={openCurrentImage}
                      className="absolute bottom-6 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/95 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--studio-ink,#1A1A1A)] shadow-[0_14px_34px_rgba(49,32,17,0.18)]"
                    >
                      <ImageIcon className="h-4 w-4" />
                      View Full Image
                    </button>
                  )}
                </>
              )}

              <div className="absolute right-3 top-5 z-20 rounded-full border border-white/40 bg-white/90 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--studio-ink,#1A1A1A)]">
                {currentProjectHasUnsavedChanges ? "Unsaved" : "Saved"}
              </div>
              <div className="absolute left-3 top-5 z-20 inline-flex items-center gap-1 rounded-full border border-white/40 bg-white/90 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--studio-ink,#1A1A1A)]">
                {currentProjectWithVisualDraft.type === "page" ? (
                  <>
                    <Layout className="h-3 w-3 text-emerald-600" />
                    Live Card
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-3 w-3 text-sky-600" />
                    Image
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="studio-assistant-empty flex h-full w-full flex-col items-center justify-center gap-5 px-6 py-10 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[var(--studio-brand,#7c5cd1)]/30 bg-white/85 shadow-[0_18px_44px_rgba(124,92,209,0.18)]">
                <WandSparkles className="h-7 w-7 text-[var(--studio-brand,#7c5cd1)]" />
              </div>
              <div className="space-y-2">
                <p className="font-[var(--font-playfair)] text-2xl leading-tight text-[var(--studio-ink,#1A1A1A)]">
                  Studio Assistant
                </p>
                <p className="text-xs leading-relaxed text-[var(--studio-ink-soft,#6f5e8c)]">
                  Pick a spark or describe your idea, then generate to see it come to life inside this phone.
                </p>
              </div>
              <ul className="grid w-full gap-2 text-left">
                {suggestions.slice(0, 4).map((suggestion) => (
                  <li key={suggestion}>
                    <button
                      type="button"
                      onClick={() => onSuggestionPick?.(suggestion)}
                      className="w-full rounded-2xl border border-[var(--studio-brand,#7c5cd1)]/22 bg-white/75 px-3 py-2 text-[11px] leading-snug text-[var(--studio-ink,#1A1A1A)] transition-all hover:-translate-y-0.5 hover:border-[var(--studio-brand,#7c5cd1)]/45 hover:bg-white"
                    >
                      {suggestion}
                    </button>
                  </li>
                ))}
              </ul>
              <div className="w-full space-y-2 pt-1">
                <p className="px-1 text-[9px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-ink-soft,#6f5e8c)]">
                  Live card examples ({details.category})
                </p>
                <ul className="grid grid-cols-2 gap-2">
                  {showcaseCards.slice(0, 2).map((card) => (
                    <li key={card.title} className="group">
                      <div className="overflow-hidden rounded-2xl border border-[var(--studio-brand,#7c5cd1)]/20 bg-white/70 shadow-[0_10px_26px_rgba(31,18,52,0.1)]">
                        <img
                          src={card.imageUrl}
                          alt={`${card.title} live card preview`}
                          className="aspect-[3/4] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                        <div className="space-y-0.5 px-2.5 py-2">
                          <p className="line-clamp-1 text-[10px] font-semibold text-[var(--studio-ink,#1A1A1A)]">
                            {card.title}
                          </p>
                          <p className="text-[8px] uppercase tracking-[0.18em] text-[var(--studio-ink-soft,#6f5e8c)]">
                            {card.source}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
      {hasPreview && currentProjectWithVisualDraft ? (
        <div className="flex w-full max-w-[22rem] items-center justify-center">
          <button
            type="button"
            onClick={saveCurrentProjectToLibrary}
            disabled={
              currentProjectWithVisualDraft.status !== "ready" ||
              (!currentProjectHasUnsavedChanges && Boolean(savedCurrentProject))
            }
            className="inline-flex items-center justify-center rounded-full bg-[var(--studio-ink,#1A1A1A)] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--studio-paper,#F5F2EF)] transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {currentProjectSaveLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}
