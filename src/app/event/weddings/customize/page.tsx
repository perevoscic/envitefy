"use client";

import Image from "next/image";
import {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "@/components/event-create/TemplateGallery.module.css";
import {
  DEFAULT_PREVIEW,
  resolveTemplateVariation,
  type ResolvedTemplateVariation,
} from "@/components/event-create/TemplateGallery";
import {
  type WeddingTemplateDefinition,
  weddingTemplateCatalog,
} from "@/components/event-create/WeddingTemplateGallery";
import { EditSquareIcon } from "@/components/icons/EditSquareIcon";

function parseDateInput(label?: string | null) {
  if (!label) return "";
  const parsed = new Date(label);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

function formatDateLabel(value?: string) {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(parsed);
  } catch {
    return parsed.toDateString();
  }
}

function getTemplateById(id?: string | null): WeddingTemplateDefinition {
  if (!id) return weddingTemplateCatalog[0];
  return (
    weddingTemplateCatalog.find((template) => template.id === id) ??
    weddingTemplateCatalog[0]
  );
}

const infoSections = [
  {
    key: "headline",
    label: "Headline",
    description:
      "Set your names, event date, and city/state for the hero header.",
  },
  {
    key: "design",
    label: "Design",
    description:
      "Pick a color story that picks the palette for the hero preview.",
  },
  {
    key: "our-story",
    label: "Our Story",
    description:
      "Tell the story of how you met, what you love about each other, and why this day is special.",
  },
  {
    key: "photos",
    label: "Photos",
    description:
      "Upload up to five gallery photos. Landscape-oriented shots keep the layout tidy.",
  },
  {
    key: "wedding-party",
    label: "Wedding Party",
    description:
      "Introduce the people standing with you-names, roles, and a short note about their connection.",
  },
  {
    key: "travel",
    label: "Travel",
    description:
      "Share arrival guidance, airport tips, shuttles, and parking info so guests travel with confidence.",
  },
  {
    key: "things-to-do",
    label: "Things To Do",
    description:
      "Highlight nearby activities, restaurants, or guided experiences that pair well with your weekend.",
  },
  {
    key: "registry",
    label: "Registry",
    description:
      "Drop your registry links here. We'll feature them on a dedicated page once the site is live.",
  },
];

type TravelEntry = {
  id: string;
  name: string;
  detail: string;
  link?: string;
};

type TravelDirection = {
  id: string;
  title: string;
  instructions: string;
};

type ActivityItem = {
  id: string;
  title: string;
  description: string;
};

type PartyMember = {
  name: string;
  id: string;
  role: string;
  bio: string;
};

type StoryEntry = {
  id: string;
  title: string;
  text: string;
  photoUrl: string | null;
};

type PartyGroupDefinition = {
  key: string;
  label: string;
  keywords: string[];
};

type StoryBlockTemplate = {
  key: string;
  badge: string;
  keywords: string[];
  fallbackName: string;
  fallbackCaption: string;
};

type PartyHighlight = {
  id: string;
  label: string;
  name: string;
  role: string;
  copy: string;
};

type VipHonor = {
  id: string;
  name: string;
  role: string;
  note: string;
};

type StoryBlockEntry = {
  id: string;
  badge: string;
  name: string;
  caption: string;
};

type FunFactEntry = {
  id: string;
  text: string;
};

type PartyModuleId =
  | "hero"
  | "highlights"
  | "vips"
  | "stories"
  | "fun-facts"
  | "banner"
  | "closing";

type PartyModuleDefinition = {
  id: PartyModuleId;
  label: string;
  description: string;
  icon: ReactNode;
};

const BRIDE_PARTY_GROUPS: PartyGroupDefinition[] = [
  {
    key: "maid-of-honor",
    label: "Maid of Honor",
    keywords: ["maid of honor", "matron of honor"],
  },
  {
    key: "bridesmaids",
    label: "Bridesmaids",
    keywords: ["bridesmaid"],
  },
  {
    key: "junior-bridesmaid",
    label: "Junior Bridesmaid",
    keywords: ["junior bridesmaid"],
  },
  {
    key: "flower-girl",
    label: "Flower Girl",
    keywords: ["flower girl"],
  },
];

const GROOM_PARTY_GROUPS: PartyGroupDefinition[] = [
  {
    key: "best-man",
    label: "Best Man",
    keywords: ["best man"],
  },
  {
    key: "groomsmen",
    label: "Groomsmen",
    keywords: ["groomsman"],
  },
  {
    key: "ring-bearer",
    label: "Ring Bearer",
    keywords: ["ring bearer"],
  },
  {
    key: "junior-groomsman",
    label: "Junior Groomsman",
    keywords: ["junior groomsman"],
  },
];

const VIP_ROLE_KEYWORDS = [
  "mother",
  "father",
  "parent",
  "grandparent",
  "godparent",
  "aunt",
  "uncle",
];

const STORY_BLOCK_TEMPLATES: StoryBlockTemplate[] = [
  {
    key: "best-friend",
    badge: "Best friends",
    keywords: ["best man", "groomsman"],
    fallbackName: "Daniel",
    fallbackCaption:
      "Met in middle school. Keeper of every secret and professional hype man.",
  },
  {
    key: "sisterhood",
    badge: "Sisterhood",
    keywords: ["maid of honor", "matron of honor"],
    fallbackName: "Livia",
    fallbackCaption:
      "My sister, my calm in chaos, the one who makes sure we're laughing.",
  },
  {
    key: "college-crew",
    badge: "College crew",
    keywords: ["bridesmaid", "groomsman"],
    fallbackName: "College friends",
    fallbackCaption:
      "Dorm neighbors turned lifelong family—still telling the same stories.",
  },
  {
    key: "work-fam",
    badge: "Work fam",
    keywords: ["coworker"],
    fallbackName: "Work friends",
    fallbackCaption:
      "Promoted from coworkers to family over countless coffees.",
  },
  {
    key: "family-roots",
    badge: "Family roots",
    keywords: ["brother", "sister", "cousin", "parent"],
    fallbackName: "Family",
    fallbackCaption:
      "The original hype team who taught us what love looks like.",
  },
];

const AVATAR_COLORS = [
  "bg-amber-100 text-amber-800",
  "bg-rose-100 text-rose-700",
  "bg-sky-100 text-sky-700",
  "bg-emerald-100 text-emerald-700",
  "bg-stone-200 text-stone-700",
];

const DEFAULT_PARTY_HERO = {
  title: "Our People",
  subtext:
    "These are the hearts who've stood by us through every chapter. We can't wait for you to meet them.",
  groupPhotoCaption: "Forever grateful for our people.",
  closingNote:
    "Thank you to our friends and family who make life brighter. We are honored to have you celebrate with us.",
};

const DEFAULT_PARTY_HIGHLIGHTS: PartyHighlight[] = [
  {
    id: "highlight-maid",
    label: "Maid of Honor",
    name: "Livia Hart",
    role: "Sister & confidante",
    copy: "My calm in chaos—the reason we're always laughing.",
  },
  {
    id: "highlight-bestman",
    label: "Best Man",
    name: "Daniel Brooks",
    role: "Childhood best friend",
    copy: "Keeper of every secret and professional hype man.",
  },
];

const DEFAULT_VIP_HONORS: VipHonor[] = [
  {
    id: "vip-mother",
    name: "Celeste Hart",
    role: "Mother of the Bride",
    note: "Heart of every family tradition and the best advice-giver.",
  },
  {
    id: "vip-father",
    name: "David Quinn",
    role: "Father of the Groom",
    note: "Storyteller-in-chief and forever our steady compass.",
  },
];

const DEFAULT_STORY_BLOCKS: StoryBlockEntry[] = [
  {
    id: "story-sisterhood",
    badge: "Sisterhood",
    name: "College roomies",
    caption:
      "Dorm neighbors turned lifelong family—still telling the same stories.",
  },
  {
    id: "story-besties",
    badge: "Best friends",
    name: "Daniel & Theo",
    caption: "Met in middle school and never stopped scheming adventures.",
  },
  {
    id: "story-family",
    badge: "Family roots",
    name: "The Quinn crew",
    caption: "Original hype team who taught us what love looks like.",
  },
  {
    id: "story-work",
    badge: "Work fam",
    name: "Studio nights",
    caption: "Promoted from coworkers to family over countless coffees.",
  },
];

const DEFAULT_FUN_FACTS: FunFactEntry[] = [
  {
    id: "fact-travel",
    text: "Our wedding party has traveled to 17 countries combined.",
  },
  {
    id: "fact-roommates",
    text: "Two were roommates in college.",
  },
  {
    id: "fact-dance",
    text: "Three can't dance but will try anyway.",
  },
  {
    id: "fact-memes",
    text: "One is responsible for 90% of the group chat memes.",
  },
];

const PARTY_MODULES: PartyModuleDefinition[] = [
  {
    id: "hero",
    label: "Title",
    description: "Set your hero headline + intro.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M6 21V3h5.5a3.5 3.5 0 010 7H6" strokeWidth="1.6" />
        <path d="M6 12h5.5A3.5 3.5 0 0115 15.5V21" strokeWidth="1.6" />
        <path d="M21 8h-6M18 11V5" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "highlights",
    label: "Featured",
    description: "Spotlight maid of honor or best man.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path
          d="M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 17l-4.9 1.2.9-5.5-4-3.9 5.5-.8z"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "vips",
    label: "VIP Honors",
    description: "Parents, grandparents, godparents.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect x="4" y="6" width="16" height="12" rx="3" strokeWidth="1.6" />
        <path d="M8 10h1.5L12 16l2.5-6H16" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    id: "stories",
    label: "Story Tiles",
    description: "How you met each member.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect x="4" y="4" width="16" height="16" rx="2" strokeWidth="1.6" />
        <path d="M4 10h16M10 4v16" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    id: "fun-facts",
    label: "Fun Facts",
    description: "Travel counts, inside jokes, etc.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="8" strokeWidth="1.6" />
        <path d="M12 8v5M12 16h.01" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "banner",
    label: "Group Banner",
    description: "Full-width photo caption.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect x="3" y="6" width="18" height="12" rx="2" strokeWidth="1.6" />
        <path d="M7 15l2.5-3 2 2.5L13 12l4 3" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    id: "closing",
    label: "Closing Note",
    description: "Final thank-you message.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path
          d="M5 5h14v14H5zM7 9h10M7 13h7"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

const BRIDE_ROLE_PRESETS = [
  "Maid of Honor",
  "Matron of Honor",
  "Bridesmaid",
  "Junior Bridesmaid",
  "Flower Girl",
];

const GROOM_ROLE_PRESETS = [
  "Best Man",
  "Groomsman",
  "Junior Groomsman",
  "Ring Bearer",
];

type PartyMemberPreview = PartyMember & {
  displayName: string;
  displayRole: string;
  displayBio: string;
  roleSearch: string;
};

type PartyGroupWithMembers = PartyGroupDefinition & {
  members: PartyMemberPreview[];
};

type FeaturedPerson = {
  key: string;
  label: string;
  name: string;
  role: string;
  copy: string;
};

type StoryCollageEntry = StoryBlockTemplate & {
  name: string;
  caption: string;
};

type WeddingPartyPreview = {
  normalizedMembers: PartyMemberPreview[];
  brideGroups: PartyGroupWithMembers[];
  groomGroups: PartyGroupWithMembers[];
  derivedVipMembers: PartyMemberPreview[];
  fallbackHighlights: FeaturedPerson[];
  fallbackStoryCollage: StoryCollageEntry[];
  isPlaceholder: boolean;
};

export default function WeddingTemplateCustomizePage() {
  const search = useSearchParams();
  const router = useRouter();

  const templateId = search?.get("templateId") ?? weddingTemplateCatalog[0].id;
  const defaultDate = search?.get("d") ?? undefined;

  const template = useMemo(() => getTemplateById(templateId), [templateId]);
  const variationParam = search?.get("variationId") ?? "";
  const firstVariationId = template.variations[0]?.id ?? "";
  const [selectedVariationId, setSelectedVariationId] = useState(
    variationParam || firstVariationId
  );
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [sectionNotes, setSectionNotes] = useState<Record<string, string>>({});
  const [photoFiles, setPhotoFiles] = useState<
    Array<{ file: File; previewUrl: string }>
  >([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [customTitles, setCustomTitles] = useState<Record<string, string>>({});
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const generateId = useCallback(
    () =>
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2, 10),
    []
  );
  const [travelHotels, setTravelHotels] = useState<TravelEntry[]>([]);
  const [travelAirports, setTravelAirports] = useState<TravelEntry[]>([]);
  const [travelDirections, setTravelDirections] = useState<TravelDirection[]>(
    []
  );
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [partyMembers, setPartyMembers] = useState<PartyMember[]>([]);
  const [partyHeroTitle, setPartyHeroTitle] = useState(
    DEFAULT_PARTY_HERO.title
  );
  const [partyHeroSubtext, setPartyHeroSubtext] = useState(
    DEFAULT_PARTY_HERO.subtext
  );
  const [partyGroupPhotoCaption, setPartyGroupPhotoCaption] = useState(
    DEFAULT_PARTY_HERO.groupPhotoCaption
  );
  const [partyClosingNote, setPartyClosingNote] = useState(
    DEFAULT_PARTY_HERO.closingNote
  );
  const [partyHighlights, setPartyHighlights] = useState<PartyHighlight[]>(() =>
    DEFAULT_PARTY_HIGHLIGHTS.map((entry) => ({ ...entry }))
  );
  const [vipHonors, setVipHonors] = useState<VipHonor[]>(() =>
    DEFAULT_VIP_HONORS.map((entry) => ({ ...entry }))
  );
  const [storyBlocks, setStoryBlocks] = useState<StoryBlockEntry[]>(() =>
    DEFAULT_STORY_BLOCKS.map((entry) => ({ ...entry }))
  );
  const [funFactEntries, setFunFactEntries] = useState<FunFactEntry[]>(() =>
    DEFAULT_FUN_FACTS.map((entry) => ({ ...entry }))
  );
  const [activePartyModules, setActivePartyModules] = useState<PartyModuleId[]>(
    []
  );
  const [storyEntries, setStoryEntries] = useState<StoryEntry[]>([]);
  const storyEntriesRef = useRef<StoryEntry[]>([]);
  const photoFilesRef = useRef<Array<{ file: File; previewUrl: string }>>([]);
  useEffect(() => {
    storyEntriesRef.current = storyEntries;
  }, [storyEntries]);
  useEffect(() => {
    photoFilesRef.current = photoFiles;
    // Reset carousel index if current index is out of bounds
    if (currentPhotoIndex >= photoFiles.length && photoFiles.length > 0) {
      setCurrentPhotoIndex(photoFiles.length - 1);
    } else if (photoFiles.length === 0) {
      setCurrentPhotoIndex(0);
    }
  }, [photoFiles, currentPhotoIndex]);
  useEffect(() => {
    return () => {
      storyEntriesRef.current.forEach((entry) => {
        if (entry.photoUrl) {
          URL.revokeObjectURL(entry.photoUrl);
        }
      });
      // Clean up photo preview URLs
      photoFilesRef.current.forEach((photo) => {
        URL.revokeObjectURL(photo.previewUrl);
      });
    };
  }, []);
  const addStoryEntry = () => {
    setStoryEntries((prev) => [
      ...prev,
      { id: generateId(), title: "", text: "", photoUrl: null },
    ]);
  };
  const removeStoryEntry = (entryId: string) => {
    setStoryEntries((prev) => {
      const target = prev.find((entry) => entry.id === entryId);
      if (target?.photoUrl) {
        URL.revokeObjectURL(target.photoUrl);
      }
      return prev.filter((entry) => entry.id !== entryId);
    });
  };
  const handleStoryPhotoChange = (
    entryId: string,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setStoryEntries((prev) =>
      prev.map((entry) => {
        if (entry.id !== entryId) return entry;
        if (entry.photoUrl) {
          URL.revokeObjectURL(entry.photoUrl);
        }
        return { ...entry, photoUrl: url };
      })
    );
    event.target.value = "";
  };
  const clearStoryPhoto = (entryId: string) => {
    setStoryEntries((prev) =>
      prev.map((entry) => {
        if (entry.id !== entryId) return entry;
        if (entry.photoUrl) {
          URL.revokeObjectURL(entry.photoUrl);
        }
        return { ...entry, photoUrl: null };
      })
    );
  };
  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    const remainingSlots = 5 - photoFiles.length;
    if (remainingSlots <= 0) return;

    const filesToAdd = files.slice(0, remainingSlots);
    const newPhotos = filesToAdd.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setPhotoFiles((prev) => [...prev, ...newPhotos]);

    // Reset input to allow selecting the same file again if needed
    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
  };

  const removePhoto = (index: number) => {
    setPhotoFiles((prev) => {
      const photo = prev[index];
      if (photo) {
        URL.revokeObjectURL(photo.previewUrl);
      }
      const newPhotos = prev.filter((_, i) => i !== index);
      // Adjust carousel index if needed
      if (currentPhotoIndex >= newPhotos.length && newPhotos.length > 0) {
        setCurrentPhotoIndex(newPhotos.length - 1);
      } else if (newPhotos.length === 0) {
        setCurrentPhotoIndex(0);
      }
      return newPhotos;
    });
  };

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photoFiles.length);
  };
  const prevPhoto = () => {
    setCurrentPhotoIndex(
      (prev) => (prev - 1 + photoFiles.length) % photoFiles.length
    );
  };

  useEffect(() => {
    if (variationParam) {
      setSelectedVariationId(variationParam);
      return;
    }
    if (firstVariationId) {
      setSelectedVariationId(firstVariationId);
    }
  }, [variationParam, firstVariationId]);

  const resolvedVariation: ResolvedTemplateVariation = useMemo(() => {
    const variation =
      template.variations.find((v) => v.id === selectedVariationId) ??
      template.variations[0];
    return resolveTemplateVariation(variation);
  }, [template, selectedVariationId]);

  const resolvedVariations = useMemo(
    () =>
      template.variations.map((variation) =>
        resolveTemplateVariation(variation)
      ),
    [template.variations]
  );

  const displayVariations = useMemo(() => {
    const trimmed = resolvedVariations.slice(0, 16);
    if (
      trimmed.some((variation) => variation.id === selectedVariationId) ||
      trimmed.length < 6
    ) {
      return trimmed;
    }
    const selected = resolvedVariations.find(
      (variation) => variation.id === selectedVariationId
    );
    if (!selected) {
      return trimmed;
    }
    return [...trimmed.slice(0, trimmed.length - 1), selected];
  }, [resolvedVariations, selectedVariationId]);

  const renderSectionContent = (sectionKey: string) => {
    if (sectionKey === "headline") {
      return (
        <div className="space-y-4">
          <label className="block text-sm font-medium text-stone-700">
            Partner one
            <input
              type="text"
              value={partnerOne}
              onChange={(e) => setPartnerOne(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
              placeholder="First partner name"
            />
          </label>
          <label className="block text-sm font-medium text-stone-700">
            Partner two
            <input
              type="text"
              value={partnerTwo}
              onChange={(e) => setPartnerTwo(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
              placeholder="Second partner name"
            />
          </label>
          <label className="block text-sm font-medium text-stone-700">
            Event date
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
            />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block text-sm font-medium text-stone-700">
              City
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
              />
            </label>
            <label className="block text-sm font-medium text-stone-700">
              State
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
              />
            </label>
          </div>
        </div>
      );
    }
    if (sectionKey === "design") {
      return (
        <div className={styles.variationSection}>
          <span className={styles.variationKicker}>Color stories</span>
          <div className={styles.variationRow}>
            {displayVariations.map((variation) => {
              const isActiveVariation = variation.id === selectedVariationId;
              return (
                <button
                  key={variation.id}
                  type="button"
                  aria-pressed={isActiveVariation}
                  className={`${styles.variationButton} ${
                    isActiveVariation ? styles.variationActive : ""
                  }`}
                  onClick={() => setSelectedVariationId(variation.id)}
                >
                  <div className={styles.variationSwatches}>
                    {variation.swatches.map((color) => (
                      <span
                        key={color}
                        className={styles.paletteDot}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className={styles.variationLabel}>
                    <span>{variation.label}</span>
                    <small>{variation.tagline}</small>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      );
    }
    if (sectionKey === "travel") {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <TileButton
              icon={tileIcons.hotel}
              label="Add hotel"
              onClick={() =>
                setTravelHotels((prev) => [
                  ...prev,
                  { id: generateId(), name: "", detail: "", link: "" },
                ])
              }
            />
            <TileButton
              icon={tileIcons.airport}
              label="Add airport"
              onClick={() =>
                setTravelAirports((prev) => [
                  ...prev,
                  { id: generateId(), name: "", detail: "", link: "" },
                ])
              }
            />
            <TileButton
              icon={tileIcons.directions}
              label="Add directions"
              onClick={() =>
                setTravelDirections((prev) => [
                  ...prev,
                  { id: generateId(), title: "", instructions: "" },
                ])
              }
            />
          </div>
          {travelHotels.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">
                Hotels
              </p>
              {travelHotels.map((hotel) => (
                <div
                  key={hotel.id}
                  className="rounded-2xl border border-stone-200 bg-white/80 p-4 shadow-sm"
                >
                  <input
                    type="text"
                    placeholder="Hotel name"
                    value={hotel.name}
                    onChange={(event) =>
                      setTravelHotels((prev) =>
                        prev.map((entry) =>
                          entry.id === hotel.id
                            ? { ...entry, name: event.target.value }
                            : entry
                        )
                      )
                    }
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
                  />
                  <textarea
                    placeholder="Booking link, code, or walking instructions"
                    value={hotel.detail}
                    onChange={(event) =>
                      setTravelHotels((prev) =>
                        prev.map((entry) =>
                          entry.id === hotel.id
                            ? { ...entry, detail: event.target.value }
                            : entry
                        )
                      )
                    }
                    rows={2}
                    className="mt-2 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
                  />
                  <input
                    type="url"
                    placeholder="Link (optional)"
                    value={hotel.link ?? ""}
                    onChange={(event) =>
                      setTravelHotels((prev) =>
                        prev.map((entry) =>
                          entry.id === hotel.id
                            ? { ...entry, link: event.target.value }
                            : entry
                        )
                      )
                    }
                    className="mt-2 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    className="mt-3 text-xs font-semibold uppercase tracking-[0.3em] text-stone-500"
                    onClick={() =>
                      setTravelHotels((prev) =>
                        prev.filter((entry) => entry.id !== hotel.id)
                      )
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
          {travelAirports.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">
                Airports
              </p>
              {travelAirports.map((airport) => (
                <div
                  key={airport.id}
                  className="rounded-2xl border border-stone-200 bg-white/80 p-4 shadow-sm"
                >
                  <input
                    type="text"
                    placeholder="Airport name or code"
                    value={airport.name}
                    onChange={(event) =>
                      setTravelAirports((prev) =>
                        prev.map((entry) =>
                          entry.id === airport.id
                            ? { ...entry, name: event.target.value }
                            : entry
                        )
                      )
                    }
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
                  />
                  <textarea
                    placeholder="Recommended routes or airlines"
                    value={airport.detail}
                    onChange={(event) =>
                      setTravelAirports((prev) =>
                        prev.map((entry) =>
                          entry.id === airport.id
                            ? { ...entry, detail: event.target.value }
                            : entry
                        )
                      )
                    }
                    rows={2}
                    className="mt-2 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
                  />
                  <input
                    type="url"
                    placeholder="Airport site (optional)"
                    value={airport.link ?? ""}
                    onChange={(event) =>
                      setTravelAirports((prev) =>
                        prev.map((entry) =>
                          entry.id === airport.id
                            ? { ...entry, link: event.target.value }
                            : entry
                        )
                      )
                    }
                    className="mt-2 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    className="mt-3 text-xs font-semibold uppercase tracking-[0.3em] text-stone-500"
                    onClick={() =>
                      setTravelAirports((prev) =>
                        prev.filter((entry) => entry.id !== airport.id)
                      )
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
          {travelDirections.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">
                Directions & transit
              </p>
              {travelDirections.map((direction) => (
                <div
                  key={direction.id}
                  className="rounded-2xl border border-stone-200 bg-white/80 p-4 shadow-sm"
                >
                  <input
                    type="text"
                    placeholder="Shuttle name or driving route"
                    value={direction.title}
                    onChange={(event) =>
                      setTravelDirections((prev) =>
                        prev.map((entry) =>
                          entry.id === direction.id
                            ? { ...entry, title: event.target.value }
                            : entry
                        )
                      )
                    }
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
                  />
                  <textarea
                    placeholder="Pickup times, ride-share notes, parking passes"
                    value={direction.instructions}
                    onChange={(event) =>
                      setTravelDirections((prev) =>
                        prev.map((entry) =>
                          entry.id === direction.id
                            ? { ...entry, instructions: event.target.value }
                            : entry
                        )
                      )
                    }
                    rows={2}
                    className="mt-2 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    className="mt-3 text-xs font-semibold uppercase tracking-[0.3em] text-stone-500"
                    onClick={() =>
                      setTravelDirections((prev) =>
                        prev.filter((entry) => entry.id !== direction.id)
                      )
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    if (sectionKey === "things-to-do") {
      return (
        <div className="space-y-4">
          <TileButton
            icon={tileIcons.highlight}
            label="Add highlight"
            onClick={() =>
              setActivities((prev) => [
                ...prev,
                { id: generateId(), title: "", description: "" },
              ])
            }
          />
          {activities.length > 0 && (
            <div className="space-y-2">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="rounded-2xl border border-stone-200 bg-white/80 p-4 shadow-sm"
                >
                  <input
                    type="text"
                    placeholder="Activity title"
                    value={activity.title}
                    onChange={(event) =>
                      setActivities((prev) =>
                        prev.map((entry) =>
                          entry.id === activity.id
                            ? { ...entry, title: event.target.value }
                            : entry
                        )
                      )
                    }
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
                  />
                  <textarea
                    placeholder="Why you love it, distance, reservations"
                    value={activity.description}
                    onChange={(event) =>
                      setActivities((prev) =>
                        prev.map((entry) =>
                          entry.id === activity.id
                            ? { ...entry, description: event.target.value }
                            : entry
                        )
                      )
                    }
                    rows={2}
                    className="mt-2 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    className="mt-3 text-xs font-semibold uppercase tracking-[0.3em] text-stone-500"
                    onClick={() =>
                      setActivities((prev) =>
                        prev.filter((entry) => entry.id !== activity.id)
                      )
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    if (sectionKey === "our-story") {
      return (
        <div className="space-y-4">
          <TileButton
            icon={tileIcons.story}
            label="Add story"
            onClick={addStoryEntry}
          />
          {storyEntries.length > 0 && (
            <div className="space-y-3">
              {storyEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-2xl border border-stone-200 bg-white/80 p-4 shadow-sm"
                >
                  <label className="block text-sm font-medium text-stone-700">
                    Story title
                    <input
                      type="text"
                      value={entry.title}
                      onChange={(event) =>
                        setStoryEntries((prev) =>
                          prev.map((story) =>
                            story.id === entry.id
                              ? { ...story, title: event.target.value }
                              : story
                          )
                        )
                      }
                      className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
                      placeholder="From swipe right to 'I do'"
                    />
                  </label>
                  <label className="mt-3 block text-sm font-medium text-stone-700">
                    Story text
                    <textarea
                      rows={4}
                      value={entry.text}
                      onChange={(event) =>
                        setStoryEntries((prev) =>
                          prev.map((story) =>
                            story.id === entry.id
                              ? { ...story, text: event.target.value }
                              : story
                          )
                        )
                      }
                      className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
                      placeholder="Share the meet-cute, proposal, or a favorite adventure."
                    />
                  </label>
                  <label className="mt-3 block text-sm font-medium text-stone-700">
                    Photo (optional)
                    <input
                      type="file"
                      accept="image/*"
                      className="mt-2"
                      onChange={(event) =>
                        handleStoryPhotoChange(entry.id, event)
                      }
                    />
                    <p className="mt-1.5 text-xs text-stone-500">
                      Recommended: Landscape orientation (16:9 or 4:3),
                      1920×1080px or larger. JPG or PNG format, under 10MB.
                    </p>
                  </label>
                  {entry.photoUrl && (
                    <div className="mt-3 space-y-2">
                      <img
                        src={entry.photoUrl}
                        alt="Story preview"
                        className="h-32 w-full rounded-2xl object-cover"
                      />
                      <button
                        type="button"
                        className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500"
                        onClick={() => clearStoryPhoto(entry.id)}
                      >
                        Remove photo
                      </button>
                    </div>
                  )}
                  <button
                    type="button"
                    className="mt-4 text-xs font-semibold uppercase tracking-[0.3em] text-rose-500"
                    onClick={() => removeStoryEntry(entry.id)}
                  >
                    Remove story
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    if (sectionKey === "photos") {
      return (
        <div className="space-y-3">
          <div className="flex flex-col gap-2">
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoChange}
              className="hidden"
              id="photo-upload-input"
              disabled={photoFiles.length >= 5}
            />
            <label
              htmlFor="photo-upload-input"
              className={`inline-flex cursor-pointer items-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-50 ${
                photoFiles.length >= 5 ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <rect
                  x="3"
                  y="3"
                  width="18"
                  height="18"
                  rx="2"
                  strokeWidth="1.6"
                />
                <circle cx="8.5" cy="8.5" r="1.5" strokeWidth="1.6" />
                <path
                  d="M21 15l-5-5L5 21"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Choose Files</span>
            </label>
            <p className="text-xs text-stone-500">
              Selected {photoFiles.length}{" "}
              {photoFiles.length === 1 ? "photo" : "photos"} (max 5).
            </p>
            <p className="text-xs text-stone-500">
              💡 Best results: Landscape photos (16:9 or 4:3), 1920×1080px or
              larger. JPG or PNG, under 10MB per image.
            </p>
          </div>
          {photoFiles.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
              {photoFiles.map((photo, index) => (
                <div
                  key={index}
                  className="relative group rounded-lg overflow-hidden border border-stone-200 bg-white"
                >
                  <img
                    src={photo.previewUrl}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove photo"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      className="h-4 w-4"
                      strokeWidth="2"
                    >
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    if (sectionKey === "wedding-party") {
      return (
        <div className="space-y-6">
          <div>
            <p className="text-sm font-semibold text-stone-700">
              Make it yours by adding sections to your wedding party page.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {PARTY_MODULES.map((module) => {
                const isActive = activePartyModules.includes(module.id);
                return (
                  <button
                    key={module.id}
                    type="button"
                    onClick={() => addPartyModule(module.id)}
                    disabled={isActive}
                    className={`flex flex-col items-center justify-center gap-2 rounded-2xl border px-4 py-5 text-center shadow-sm transition ${
                      isActive
                        ? "border-stone-300 bg-stone-50 text-stone-400"
                        : "border-stone-200 bg-white text-stone-900 hover:border-stone-400"
                    }`}
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-full border border-stone-200">
                      <span className="h-6 w-6 text-stone-800 [&>svg]:h-full [&>svg]:w-full">
                        {module.icon}
                      </span>
                    </span>
                    <span className="text-sm font-semibold uppercase tracking-[0.2em]">
                      {module.label}
                    </span>
                    <span className="text-xs text-stone-500">
                      {isActive ? "Added" : module.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-stone-200 bg-white/90 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
                  {"Bride's party"}
                </p>
                <span className="text-xs uppercase tracking-[0.2em] text-stone-400">
                  {partnerOne
                    ? `${partnerOne.split(" ")[0]}'s side`
                    : "Partner A"}
                </span>
              </div>
              <p className="mt-2 text-sm text-stone-600">
                Quick-add attendants tied to the bride/partner A side.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {BRIDE_ROLE_PRESETS.map((role) => (
                  <QuickAddButton
                    key={role}
                    label={role}
                    onClick={() => addPartyMemberWithRole(role)}
                  />
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white/90 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
                  {"Groom's party"}
                </p>
                <span className="text-xs uppercase tracking-[0.2em] text-stone-400">
                  {partnerTwo
                    ? `${partnerTwo.split(" ")[0]}'s side`
                    : "Partner B"}
                </span>
              </div>
              <p className="mt-2 text-sm text-stone-600">
                Add best men, groomsmen, or junior roles to highlight them.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {GROOM_ROLE_PRESETS.map((role) => (
                  <QuickAddButton
                    key={role}
                    label={role}
                    onClick={() => addPartyMemberWithRole(role)}
                  />
                ))}
              </div>
            </div>
          </div>
          <PartyModuleCard title="Wedding party grid" removable={false}>
            <TileButton
              icon={tileIcons.attendant}
              label="Add attendant"
              onClick={() =>
                setPartyMembers((prev) => [
                  ...prev,
                  { id: generateId(), name: "", role: "", bio: "" },
                ])
              }
            />
            {partyMembers.length > 0 && (
              <div className="space-y-3">
                {partyMembers.map((member) => (
                  <div
                    key={member.id}
                    className="rounded-2xl border border-stone-200 bg-white/80 p-4 shadow-sm"
                  >
                    <input
                      type="text"
                      placeholder="Name"
                      value={member.name}
                      onChange={(event) =>
                        setPartyMembers((prev) =>
                          prev.map((entry) =>
                            entry.id === member.id
                              ? { ...entry, name: event.target.value }
                              : entry
                          )
                        )
                      }
                      className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Role (Maid of Honor, Best Man)"
                      value={member.role}
                      onChange={(event) =>
                        setPartyMembers((prev) =>
                          prev.map((entry) =>
                            entry.id === member.id
                              ? { ...entry, role: event.target.value }
                              : entry
                          )
                        )
                      }
                      className="mt-2 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
                    />
                    <textarea
                      placeholder="Share a fun fact or connection story"
                      value={member.bio}
                      onChange={(event) =>
                        setPartyMembers((prev) =>
                          prev.map((entry) =>
                            entry.id === member.id
                              ? { ...entry, bio: event.target.value }
                              : entry
                          )
                        )
                      }
                      rows={2}
                      className="mt-2 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      className="mt-3 text-xs font-semibold uppercase tracking-[0.3em] text-stone-500"
                      onClick={() =>
                        setPartyMembers((prev) =>
                          prev.filter((entry) => entry.id !== member.id)
                        )
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </PartyModuleCard>
          {activePartyModules.length === 0 && (
            <p className="text-center text-sm text-stone-500">
              Tap a tile above to insert optional sections like hero, featured,
              or VIP notes.
            </p>
          )}
          <div className="space-y-4">
            {activePartyModules.includes("hero") && (
              <PartyModuleCard title="Hero message" moduleId="hero">
                <input
                  type="text"
                  value={partyHeroTitle}
                  onChange={(event) => setPartyHeroTitle(event.target.value)}
                  placeholder="Section title"
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
                />
                <textarea
                  value={partyHeroSubtext}
                  onChange={(event) => setPartyHeroSubtext(event.target.value)}
                  placeholder="Share why your people mean so much"
                  rows={3}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
                />
              </PartyModuleCard>
            )}
            {activePartyModules.includes("highlights") && (
              <PartyModuleCard title="Featured people" moduleId="highlights">
                <button
                  type="button"
                  className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-600"
                  onClick={() =>
                    setPartyHighlights((prev) => [
                      ...prev,
                      {
                        id: generateId(),
                        label: "Featured role",
                        name: "",
                        role: "",
                        copy: "",
                      },
                    ])
                  }
                >
                  + Add highlight
                </button>
                {partyHighlights.length > 0 && (
                  <div className="space-y-3">
                    {partyHighlights.map((highlight) => (
                      <div
                        key={highlight.id}
                        className="rounded-2xl border border-stone-200 bg-white/80 p-4 shadow-sm"
                      >
                        <input
                          type="text"
                          placeholder="Card label (Maid of Honor)"
                          value={highlight.label}
                          onChange={(event) =>
                            setPartyHighlights((prev) =>
                              prev.map((entry) =>
                                entry.id === highlight.id
                                  ? { ...entry, label: event.target.value }
                                  : entry
                              )
                            )
                          }
                          className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
                        />
                        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <input
                            type="text"
                            placeholder="Name"
                            value={highlight.name}
                            onChange={(event) =>
                              setPartyHighlights((prev) =>
                                prev.map((entry) =>
                                  entry.id === highlight.id
                                    ? { ...entry, name: event.target.value }
                                    : entry
                                )
                              )
                            }
                            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Role note"
                            value={highlight.role}
                            onChange={(event) =>
                              setPartyHighlights((prev) =>
                                prev.map((entry) =>
                                  entry.id === highlight.id
                                    ? { ...entry, role: event.target.value }
                                    : entry
                                )
                              )
                            }
                            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
                          />
                        </div>
                        <textarea
                          placeholder="Share a one-sentence story"
                          value={highlight.copy}
                          onChange={(event) =>
                            setPartyHighlights((prev) =>
                              prev.map((entry) =>
                                entry.id === highlight.id
                                  ? { ...entry, copy: event.target.value }
                                  : entry
                              )
                            )
                          }
                          rows={2}
                          className="mt-2 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
                        />
                        <button
                          type="button"
                          className="mt-3 text-xs font-semibold uppercase tracking-[0.3em] text-stone-500"
                          onClick={() =>
                            setPartyHighlights((prev) =>
                              prev.filter((entry) => entry.id !== highlight.id)
                            )
                          }
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </PartyModuleCard>
            )}
            {activePartyModules.includes("vips") && (
              <PartyModuleCard title="Honorary VIPs" moduleId="vips">
                <button
                  type="button"
                  className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-600"
                  onClick={() =>
                    setVipHonors((prev) => [
                      ...prev,
                      { id: generateId(), name: "", role: "", note: "" },
                    ])
                  }
                >
                  + Add VIP
                </button>
                {vipHonors.length > 0 && (
                  <div className="space-y-3">
                    {vipHonors.map((vip) => (
                      <div
                        key={vip.id}
                        className="rounded-2xl border border-stone-200 bg-white/80 p-4 shadow-sm"
                      >
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <input
                            type="text"
                            placeholder="Name"
                            value={vip.name}
                            onChange={(event) =>
                              setVipHonors((prev) =>
                                prev.map((entry) =>
                                  entry.id === vip.id
                                    ? { ...entry, name: event.target.value }
                                    : entry
                                )
                              )
                            }
                            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Role"
                            value={vip.role}
                            onChange={(event) =>
                              setVipHonors((prev) =>
                                prev.map((entry) =>
                                  entry.id === vip.id
                                    ? { ...entry, role: event.target.value }
                                    : entry
                                )
                              )
                            }
                            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
                          />
                        </div>
                        <textarea
                          placeholder="Short note"
                          value={vip.note}
                          onChange={(event) =>
                            setVipHonors((prev) =>
                              prev.map((entry) =>
                                entry.id === vip.id
                                  ? { ...entry, note: event.target.value }
                                  : entry
                              )
                            )
                          }
                          rows={2}
                          className="mt-2 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
                        />
                        <button
                          type="button"
                          className="mt-3 text-xs font-semibold uppercase tracking-[0.3em] text-stone-500"
                          onClick={() =>
                            setVipHonors((prev) =>
                              prev.filter((entry) => entry.id !== vip.id)
                            )
                          }
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </PartyModuleCard>
            )}
            {activePartyModules.includes("stories") && (
              <PartyModuleCard title="Story collage" moduleId="stories">
                <button
                  type="button"
                  className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-600"
                  onClick={() =>
                    setStoryBlocks((prev) => [
                      ...prev,
                      { id: generateId(), badge: "", name: "", caption: "" },
                    ])
                  }
                >
                  + Add story
                </button>
                {storyBlocks.length > 0 && (
                  <div className="space-y-3">
                    {storyBlocks.map((block) => (
                      <div
                        key={block.id}
                        className="rounded-2xl border border-stone-200 bg-white/80 p-4 shadow-sm"
                      >
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <input
                            type="text"
                            placeholder="Badge (Sisterhood, College Crew)"
                            value={block.badge}
                            onChange={(event) =>
                              setStoryBlocks((prev) =>
                                prev.map((entry) =>
                                  entry.id === block.id
                                    ? { ...entry, badge: event.target.value }
                                    : entry
                                )
                              )
                            }
                            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Heading"
                            value={block.name}
                            onChange={(event) =>
                              setStoryBlocks((prev) =>
                                prev.map((entry) =>
                                  entry.id === block.id
                                    ? { ...entry, name: event.target.value }
                                    : entry
                                )
                              )
                            }
                            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
                          />
                        </div>
                        <textarea
                          placeholder="Mini caption"
                          value={block.caption}
                          onChange={(event) =>
                            setStoryBlocks((prev) =>
                              prev.map((entry) =>
                                entry.id === block.id
                                  ? { ...entry, caption: event.target.value }
                                  : entry
                              )
                            )
                          }
                          rows={2}
                          className="mt-2 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
                        />
                        <button
                          type="button"
                          className="mt-3 text-xs font-semibold uppercase tracking-[0.3em] text-stone-500"
                          onClick={() =>
                            setStoryBlocks((prev) =>
                              prev.filter((entry) => entry.id !== block.id)
                            )
                          }
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </PartyModuleCard>
            )}
            {activePartyModules.includes("fun-facts") && (
              <PartyModuleCard title="Fun facts" moduleId="fun-facts">
                <button
                  type="button"
                  className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-600"
                  onClick={() =>
                    setFunFactEntries((prev) => [
                      ...prev,
                      { id: generateId(), text: "" },
                    ])
                  }
                >
                  + Add fact
                </button>
                {funFactEntries.length > 0 && (
                  <div className="space-y-3">
                    {funFactEntries.map((fact) => (
                      <div
                        key={fact.id}
                        className="rounded-2xl border border-stone-200 bg-white/80 p-4 shadow-sm"
                      >
                        <textarea
                          placeholder="Fun tidbit"
                          value={fact.text}
                          onChange={(event) =>
                            setFunFactEntries((prev) =>
                              prev.map((entry) =>
                                entry.id === fact.id
                                  ? { ...entry, text: event.target.value }
                                  : entry
                              )
                            )
                          }
                          rows={2}
                          className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
                        />
                        <button
                          type="button"
                          className="mt-3 text-xs font-semibold uppercase tracking-[0.3em] text-stone-500"
                          onClick={() =>
                            setFunFactEntries((prev) =>
                              prev.filter((entry) => entry.id !== fact.id)
                            )
                          }
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </PartyModuleCard>
            )}
            {activePartyModules.includes("banner") && (
              <PartyModuleCard title="Group photo banner" moduleId="banner">
                <input
                  type="text"
                  value={partyGroupPhotoCaption}
                  onChange={(event) =>
                    setPartyGroupPhotoCaption(event.target.value)
                  }
                  placeholder="Banner caption"
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
                />
              </PartyModuleCard>
            )}
            {activePartyModules.includes("closing") && (
              <PartyModuleCard title="Closing note" moduleId="closing">
                <textarea
                  value={partyClosingNote}
                  onChange={(event) => setPartyClosingNote(event.target.value)}
                  placeholder="Thank your friends and family"
                  rows={3}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
                />
              </PartyModuleCard>
            )}
          </div>
        </div>
      );
    }
    if (sectionKey === "registry") {
      return (
        <label className="block text-sm font-medium text-stone-700">
          Registry link
          <input
            type="url"
            placeholder="https://www.example.com/your-registry"
            className="mt-2"
          />
        </label>
      );
    }
    const value = sectionNotes[sectionKey] ?? "";
    return (
      <label className="block text-sm font-medium text-stone-700">
        Details
        <textarea
          rows={3}
          value={value}
          onChange={(event) =>
            setSectionNotes((prev) => ({
              ...prev,
              [sectionKey]: event.target.value,
            }))
          }
          placeholder="Share a short description to appear on the page."
          className="mt-2"
        />
      </label>
    );
  };

  const activeSectionData = activeSection
    ? infoSections.find((section) => section.key === activeSection)
    : undefined;
  const handleBack = () => {
    setActiveSection(null);
  };
  useEffect(() => {
    if (!activeSection) {
      setEditingTitle(null);
      setRenameDraft("");
    }
  }, [activeSection]);
  const menuLabel = (key: string, label: string) => customTitles[key] ?? label;
  const startEditTitle = () => {
    if (!activeSection) return;
    setEditingTitle(activeSection);
    setRenameDraft(
      customTitles[activeSection] ?? activeSectionData?.label ?? activeSection
    );
  };
  const saveTitle = () => {
    if (!activeSection || renameDraft.trim() === "") return;
    setCustomTitles((prev) => ({
      ...prev,
      [activeSection]: renameDraft.trim(),
    }));
    setEditingTitle(null);
  };
  const storyPreviewEntries = storyEntries.filter(
    (entry) =>
      entry.title.trim() !== "" ||
      entry.text.trim() !== "" ||
      Boolean(entry.photoUrl)
  );
  const hasStoryDetails = storyPreviewEntries.length > 0;
  const hasTravelDetails =
    travelHotels.length > 0 ||
    travelAirports.length > 0 ||
    travelDirections.length > 0;
  const hasActivityHighlights = activities.length > 0;
  const hasPhotos = photoFiles.length > 0;

  const previewNames =
    template.preview?.coupleName ?? DEFAULT_PREVIEW.coupleName ?? "";
  const [defaultLeft, defaultRight] = (previewNames || "")
    .split("&")
    .map((s) => s.trim());
  const location = template.preview?.location ?? DEFAULT_PREVIEW.location;
  const [defaultCity, defaultState] = location.split(",").map((s) => s.trim());

  const [partnerOne, setPartnerOne] = useState(defaultLeft ?? "");
  const [partnerTwo, setPartnerTwo] = useState(defaultRight ?? "");
  const [eventDate, setEventDate] = useState(
    parseDateInput(
      defaultDate ?? template.preview?.dateLabel ?? DEFAULT_PREVIEW.dateLabel
    )
  );
  const [city, setCity] = useState(defaultCity ?? "");
  const [state, setState] = useState(defaultState ?? "");

  const previewCoupleName =
    partnerOne && partnerTwo ? `${partnerOne} & ${partnerTwo}` : previewNames;
  const previewDateLabel =
    formatDateLabel(eventDate) ??
    template.preview?.dateLabel ??
    DEFAULT_PREVIEW.dateLabel;
  const previewLocation =
    city || state
      ? [city, state]
          .filter((v) => Boolean(v) && typeof v === "string")
          .join(", ")
      : location;

  const weddingPartyPreview = useMemo<WeddingPartyPreview>(() => {
    const normalizedMembers: PartyMemberPreview[] = partyMembers.map(
      (member, index) => {
        const displayRole = member.role?.trim() || "Wedding party";
        return {
          ...member,
          displayName: member.name?.trim() || `Attendant ${index + 1}`,
          displayRole,
          displayBio:
            member.bio?.trim() ||
            `Standing with us as ${displayRole.toLowerCase()}.`,
          roleSearch: member.role?.toLowerCase() ?? "",
        };
      }
    );
    const matchRole = (role: string, keywords: string[]) =>
      keywords.some((keyword) => role.includes(keyword));
    const buildGroups = (defs: PartyGroupDefinition[]) =>
      defs.map<PartyGroupWithMembers>((group) => ({
        ...group,
        members: normalizedMembers.filter((member) =>
          matchRole(member.roleSearch, group.keywords)
        ),
      }));
    const brideGroups = buildGroups(BRIDE_PARTY_GROUPS);
    const groomGroups = buildGroups(GROOM_PARTY_GROUPS);
    const vipMembers = normalizedMembers.filter((member) =>
      matchRole(member.roleSearch, VIP_ROLE_KEYWORDS)
    );
    const storyCollage = STORY_BLOCK_TEMPLATES.map((template, index) => {
      const match =
        normalizedMembers.length > 0
          ? normalizedMembers.find((member) =>
              matchRole(member.roleSearch, template.keywords)
            ) ?? normalizedMembers[index % normalizedMembers.length]
          : null;
      return {
        ...template,
        name: match?.displayName ?? template.fallbackName,
        caption:
          match?.bio?.trim() || match?.displayBio || template.fallbackCaption,
      };
    });
    return {
      normalizedMembers,
      brideGroups,
      groomGroups,
      derivedVipMembers: vipMembers,
      fallbackHighlights: [],
      fallbackStoryCollage: storyCollage,
      isPlaceholder: false,
    };
  }, [partyMembers]);

  const addPartyMemberWithRole = (role: string) => {
    setPartyMembers((prev) => [
      ...prev,
      { id: generateId(), name: "", role, bio: "" },
    ]);
  };

  const hasWeddingParty = weddingPartyPreview.normalizedMembers.length > 0;
  const showWeddingPartyPreview = hasWeddingParty;
  const highlightCards = partyHighlights
    .map((highlight) =>
      highlight.name.trim() || highlight.role.trim() || highlight.copy.trim()
        ? {
            key: highlight.id,
            label: highlight.label || "Featured role",
            name: highlight.name || "Beloved friend",
            role: highlight.role || "",
            copy: highlight.copy || "",
          }
        : null
    )
    .filter(Boolean) as FeaturedPerson[];
  const vipCards =
    vipHonors.length > 0
      ? vipHonors.map((vip) => ({
          key: vip.id,
          name: vip.name || "Honorary guest",
          role: vip.role || "",
          note: vip.note || "",
        }))
      : weddingPartyPreview.derivedVipMembers.map((vip) => ({
          key: vip.id,
          name: vip.displayName,
          role: vip.displayRole,
          note: vip.displayBio,
        }));
  const storyCardData =
    storyBlocks.length > 0
      ? storyBlocks.map((block) => ({
          key: block.id,
          badge: block.badge || "Story",
          name: block.name || "Best friends",
          caption: block.caption || "",
        }))
      : weddingPartyPreview.fallbackStoryCollage;
  const funFactsRender =
    funFactEntries.length > 0 ? funFactEntries : DEFAULT_FUN_FACTS;
  const heroEnabled = activePartyModules.includes("hero");
  const highlightsEnabled = activePartyModules.includes("highlights");
  const vipEnabled = activePartyModules.includes("vips");
  const storiesEnabled = activePartyModules.includes("stories");
  const funFactsEnabled = activePartyModules.includes("fun-facts");
  const bannerEnabled = activePartyModules.includes("banner");
  const closingEnabled = activePartyModules.includes("closing");

  const tileIcons: Record<string, ReactNode> = {
    hotel: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        aria-hidden="true"
      >
        <rect x="4" y="8" width="16" height="12" rx="1.5" strokeWidth="1.6" />
        <path
          d="M9 4h6v4H9zM8 12h2M14 12h2M8 16h2M14 16h2"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
    airport: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          d="M3 12l18-5-2 7 2 7-18-5"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M3 12l6 6M3 12l6-6" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
    directions: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          d="M12 3l7 7-7 11-7-11 7-7z"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M12 8v4l2 2" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
    highlight: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        aria-hidden="true"
      >
        <circle cx="12" cy="10" r="3.5" strokeWidth="1.6" />
        <path
          d="M5.5 10c0 4.25 5.5 9.5 6.3 10.2.1.1.3.1.4 0 .8-.7 6.3-5.95 6.3-10.2A6.5 6.5 0 005.5 10z"
          strokeWidth="1.6"
        />
      </svg>
    ),
    story: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path d="M5 5h6a3 3 0 013 3v12H8a3 3 0 00-3 3V5z" strokeWidth="1.6" />
        <path d="M19 5h-6a3 3 0 00-3 3v12a3 3 0 013-3h6z" strokeWidth="1.6" />
        <path d="M8 9h4" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M8 12h3" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
    attendant: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        aria-hidden="true"
      >
        <circle cx="9" cy="8" r="3" strokeWidth="1.6" />
        <circle cx="17" cy="10" r="2.5" strokeWidth="1.6" />
        <path
          d="M4.5 19c0-3 2.5-5 4.5-5s4.5 2 4.5 5M14 19c0-2.5 1.5-4 3-4s3 1.5 3 4"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  };

  const getInitials = (name: string) => {
    const segments = name
      .split(/\s+/)
      .map((segment) => segment.trim())
      .filter(Boolean);
    if (segments.length === 0) {
      return "WP";
    }
    const [first, second] = segments;
    const initials = `${first?.[0] ?? ""}${second?.[0] ?? ""}`;
    return (initials || first?.[0] || "W").toUpperCase();
  };

  const getSideLabel = (name: string, fallback: string) => {
    const trimmed = name.trim();
    if (!trimmed) return fallback;
    const first = trimmed.split(/\s+/)[0];
    return first ? `${first}'s side` : fallback;
  };

  const TileButton = ({
    icon,
    label,
    onClick,
    disabled,
  }: {
    icon: ReactNode;
    label: string;
    onClick: () => void;
    disabled?: boolean;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-5 text-center text-sm shadow-sm transition hover:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400 ${
        disabled ? "opacity-50" : ""
      }`}
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full border border-stone-100 bg-stone-50 text-stone-500">
        <span className="h-8 w-8 text-stone-600 [&>svg]:h-full [&>svg]:w-full">
          {icon}
        </span>
      </span>
      <p className="text-sm font-semibold text-stone-900">{label}</p>
    </button>
  );

  const PreviewCard = ({
    title,
    children,
  }: {
    title: string;
    children: ReactNode;
  }) => (
    <div className="rounded-2xl border border-black/5 bg-white/80 p-5 shadow-sm backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">
        {title}
      </p>
      <div className="mt-3 space-y-3 text-sm text-stone-700">{children}</div>
    </div>
  );

  const PartyModuleCard = ({
    title,
    children,
    moduleId,
    removable = true,
  }: {
    title: string;
    children: ReactNode;
    moduleId?: PartyModuleId;
    removable?: boolean;
  }) => (
    <div className="rounded-2xl border border-stone-200 bg-white/90 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
          {title}
        </p>
        {removable && moduleId && (
          <button
            type="button"
            onClick={() => removePartyModule(moduleId)}
            className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500"
          >
            Remove
          </button>
        )}
      </div>
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  );

  const QuickAddButton = ({
    label,
    onClick,
  }: {
    label: string;
    onClick: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-stone-300 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-stone-700 transition hover:border-stone-500 hover:text-stone-900"
    >
      + {label}
    </button>
  );

  const heroImageSrc = `/templates/wedding-placeholders/${template.heroImageName}`;

  const addPartyModule = (moduleId: PartyModuleId) => {
    setActivePartyModules((prev) =>
      prev.includes(moduleId) ? prev : [...prev, moduleId]
    );
  };

  const removePartyModule = (moduleId: PartyModuleId) => {
    setActivePartyModules((prev) => prev.filter((id) => id !== moduleId));
  };

  const handleContinue = useCallback(() => {
    const params = new URLSearchParams();
    params.set("templateId", template.id);
    params.set("variationId", resolvedVariation.id);
    if (eventDate) {
      try {
        const iso = new Date(eventDate).toISOString();
        params.set("d", iso);
      } catch {}
    } else if (defaultDate) {
      params.set("d", defaultDate);
    }
    router.push(`/event/new?${params.toString()}`);
  }, [template.id, resolvedVariation.id, eventDate, defaultDate, router]);

  return (
    <main className="px-5 py-10">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 lg:flex-row">
        <div className="flex-1">
          <article className={styles.templateCard}>
            <div className={styles.cardBody}>
              <div className={styles.previewFrame}>
                <div
                  className={styles.previewHeader}
                  style={{ background: resolvedVariation.background }}
                >
                  <p
                    className={styles.previewNames}
                    style={{
                      color: resolvedVariation.titleColor,
                      fontFamily: resolvedVariation.titleFontFamily,
                      fontWeight:
                        resolvedVariation.titleWeight === "bold"
                          ? 700
                          : resolvedVariation.titleWeight === "semibold"
                          ? 600
                          : 400,
                    }}
                  >
                    {previewCoupleName}
                  </p>
                  <p
                    className={styles.previewMeta}
                    style={{ color: resolvedVariation.titleColor }}
                  >
                    {previewDateLabel} • {previewLocation}
                  </p>
                  <div
                    className={styles.previewNav}
                    style={{ color: resolvedVariation.titleColor }}
                  >
                    {template.menu.slice(0, 7).map((item) => (
                      <span key={item} className={styles.previewNavItem}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                <div className={styles.previewPhoto}>
                  <Image
                    src={heroImageSrc}
                    alt={`${template.name} preview`}
                    width={640}
                    height={360}
                    className={styles.previewPhotoImage}
                    priority={false}
                  />
                </div>
              </div>
              {(hasStoryDetails ||
                hasTravelDetails ||
                hasActivityHighlights ||
                hasWeddingParty ||
                hasPhotos) && (
                <div className="mt-4 space-y-4">
                  {hasStoryDetails && (
                    <PreviewCard title={menuLabel("our-story", "Our Story")}>
                      <div className="space-y-4">
                        {storyPreviewEntries.map((entry) => (
                          <div key={entry.id} className="space-y-2">
                            {entry.photoUrl && (
                              <img
                                src={entry.photoUrl}
                                alt="Our story preview"
                                className="h-40 w-full rounded-2xl object-cover"
                              />
                            )}
                            {entry.title && (
                              <p className="text-base font-semibold text-stone-900">
                                {entry.title}
                              </p>
                            )}
                            {entry.text && <p>{entry.text}</p>}
                          </div>
                        ))}
                      </div>
                    </PreviewCard>
                  )}
                  {showWeddingPartyPreview && (
                    <PreviewCard
                      title={menuLabel("wedding-party", "Wedding Party")}
                    >
                      <div className="space-y-10">
                        {heroEnabled && (
                          <div className="relative overflow-hidden rounded-3xl border border-stone-200 bg-gradient-to-br from-amber-50 via-white to-stone-50 p-8 text-stone-900">
                            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-200/60 blur-3xl" />
                            <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.3em] text-stone-600">
                              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-900">
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  className="h-5 w-5"
                                  strokeWidth="1.8"
                                >
                                  <path
                                    d="M12 21s-7-4.35-7-10a4 4 0 017-3 4 4 0 017 3c0 5.65-7 10-7 10z"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </span>
                              <span>
                                💛 {partyHeroTitle || DEFAULT_PARTY_HERO.title}
                              </span>
                            </div>
                            <h3 className="mt-4 text-3xl font-serif text-stone-900">
                              {partyHeroTitle || DEFAULT_PARTY_HERO.title}
                            </h3>
                            <p className="mt-3 max-w-2xl text-base text-stone-600">
                              {partyHeroSubtext || DEFAULT_PARTY_HERO.subtext}
                            </p>
                          </div>
                        )}

                        {highlightsEnabled && highlightCards.length > 0 && (
                          <div>
                            <div className="mb-4 flex items-center gap-3">
                              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 text-stone-900">
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  className="h-5 w-5"
                                  strokeWidth="1.6"
                                >
                                  <path
                                    d="M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 17l-4.9 1.2.9-5.5-4-3.9 5.5-.8z"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </span>
                              <div>
                                <p className="text-xs uppercase tracking-[0.3em] text-stone-500">
                                  Featured hearts
                                </p>
                                <p className="text-lg font-semibold text-stone-900">
                                  Spotlight stories
                                </p>
                              </div>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                              {highlightCards.map((featured) => (
                                <div
                                  key={featured.key}
                                  className="rounded-3xl border border-stone-900/10 bg-stone-900 p-6 text-white shadow-md"
                                >
                                  <p className="text-xs uppercase tracking-[0.4em] text-amber-200">
                                    {featured.label}
                                  </p>
                                  <p className="mt-3 text-2xl font-serif text-white">
                                    {featured.name}
                                  </p>
                                  <p className="text-xs uppercase tracking-[0.5em] text-white/70">
                                    {featured.role}
                                  </p>
                                  <p className="mt-4 text-base text-white/80">
                                    {featured.copy}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="relative overflow-hidden rounded-3xl border border-stone-200 bg-white/90 p-6 shadow-sm">
                          <div
                            className="pointer-events-none absolute left-1/2 top-0 hidden h-full w-32 -translate-x-1/2 opacity-30 md:block"
                            style={{
                              background:
                                "linear-gradient(140deg, rgba(0,0,0,0) 0%, rgba(16,24,40,0.12) 50%, rgba(0,0,0,0) 100%)",
                              transform: "skewX(-20deg)",
                            }}
                            aria-hidden="true"
                          />
                          <div className="relative grid gap-6 md:grid-cols-2">
                            <div>
                              <div className="flex items-center gap-3">
                                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 text-stone-900">
                                  <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    className="h-5 w-5"
                                    strokeWidth="1.6"
                                  >
                                    <circle cx="8" cy="8" r="3" />
                                    <circle cx="16" cy="10" r="2.5" />
                                    <path
                                      d="M3.5 19c0-3 2.5-5 4.5-5s4.5 2 4.5 5M12 19c0-2.5 1.5-4 3-4s3 1.5 3 4"
                                      strokeLinecap="round"
                                    />
                                  </svg>
                                </span>
                                <div>
                                  <p className="text-xs uppercase tracking-[0.3em] text-stone-500">
                                    {"Bride's party"}
                                  </p>
                                  <p className="text-lg font-semibold text-stone-900">
                                    {getSideLabel(partnerOne, "Bride's Side")}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-4 space-y-3">
                                {weddingPartyPreview.brideGroups.map(
                                  (group) => (
                                    <div key={group.key}>
                                      <p className="font-semibold text-stone-900">
                                        {group.label}
                                      </p>
                                      {group.members.length > 0 ? (
                                        <ul className="mt-1 flex flex-wrap gap-2">
                                          {group.members.map((member) => (
                                            <li
                                              key={member.id}
                                              className="rounded-full border border-stone-200 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-stone-600"
                                            >
                                              {member.displayName}
                                            </li>
                                          ))}
                                        </ul>
                                      ) : (
                                        <p className="text-sm text-stone-400">
                                          Add {group.label.toLowerCase()} to
                                          spotlight them.
                                        </p>
                                      )}
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center gap-3">
                                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 text-stone-900">
                                  <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    className="h-5 w-5"
                                    strokeWidth="1.6"
                                  >
                                    <circle cx="8" cy="8" r="3" />
                                    <circle cx="16" cy="10" r="2.5" />
                                    <path
                                      d="M3.5 19c0-3 2.5-5 4.5-5s4.5 2 4.5 5M12 19c0-2.5 1.5-4 3-4s3 1.5 3 4"
                                      strokeLinecap="round"
                                    />
                                  </svg>
                                </span>
                                <div>
                                  <p className="text-xs uppercase tracking-[0.3em] text-stone-500">
                                    {"Groom's party"}
                                  </p>
                                  <p className="text-lg font-semibold text-stone-900">
                                    {getSideLabel(partnerTwo, "Groom's Side")}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-4 space-y-3">
                                {weddingPartyPreview.groomGroups.map(
                                  (group) => (
                                    <div key={group.key}>
                                      <p className="font-semibold text-stone-900">
                                        {group.label}
                                      </p>
                                      {group.members.length > 0 ? (
                                        <ul className="mt-1 flex flex-wrap gap-2">
                                          {group.members.map((member) => (
                                            <li
                                              key={member.id}
                                              className="rounded-full border border-stone-200 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-stone-600"
                                            >
                                              {member.displayName}
                                            </li>
                                          ))}
                                        </ul>
                                      ) : (
                                        <p className="text-sm text-stone-400">
                                          Add {group.label.toLowerCase()} to
                                          spotlight them.
                                        </p>
                                      )}
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 text-stone-900">
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                className="h-5 w-5"
                                strokeWidth="1.6"
                              >
                                <circle cx="12" cy="12" r="4" />
                                <path
                                  d="M4 12h4M16 12h4M12 4v4M12 16v4"
                                  strokeLinecap="round"
                                />
                              </svg>
                            </span>
                            <div>
                              <p className="text-xs uppercase tracking-[0.3em] text-stone-500">
                                Modern grid
                              </p>
                              <p className="text-lg font-semibold text-stone-900">
                                Wedding Party Roll Call
                              </p>
                            </div>
                          </div>
                          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {weddingPartyPreview.normalizedMembers.map(
                              (member, index) => (
                                <div
                                  key={member.id}
                                  className="rounded-2xl border border-stone-200 bg-white/90 p-4 shadow-sm"
                                >
                                  <div className="flex items-center gap-4">
                                    <div
                                      className={`flex h-14 w-14 items-center justify-center rounded-full text-base font-semibold ${
                                        AVATAR_COLORS[
                                          index % AVATAR_COLORS.length
                                        ]
                                      }`}
                                    >
                                      {getInitials(member.displayName)}
                                    </div>
                                    <div>
                                      <p className="text-base font-semibold text-stone-900">
                                        {member.displayName}
                                      </p>
                                      <p className="text-xs uppercase tracking-[0.4em] text-stone-500">
                                        {member.displayRole}
                                      </p>
                                    </div>
                                  </div>
                                  <p className="mt-3 text-sm text-stone-600">
                                    {member.displayBio}
                                  </p>
                                </div>
                              )
                            )}
                          </div>
                        </div>

                        {vipEnabled && vipCards.length > 0 && (
                          <div className="rounded-3xl border border-stone-900/10 bg-gradient-to-br from-stone-900 to-stone-800 p-6 text-white">
                            <div className="flex items-center gap-3">
                              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white">
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  className="h-5 w-5"
                                  strokeWidth="1.6"
                                >
                                  <path
                                    d="M5 13l4 4L19 7"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </span>
                              <div>
                                <p className="text-xs uppercase tracking-[0.3em] text-amber-200">
                                  Our VIPs
                                </p>
                                <p className="text-lg font-semibold text-white">
                                  Honorary guests
                                </p>
                              </div>
                            </div>
                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                              {vipCards.map((vip) => (
                                <div
                                  key={vip.key}
                                  className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur"
                                >
                                  <p className="text-base font-semibold text-white">
                                    {vip.name}
                                  </p>
                                  <p className="text-xs uppercase tracking-[0.4em] text-white/70">
                                    {vip.role}
                                  </p>
                                  <p className="mt-2 text-sm text-white/80">
                                    {vip.note}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {storiesEnabled && storyCardData.length > 0 && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-3">
                              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 text-stone-900">
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  className="h-5 w-5"
                                  strokeWidth="1.6"
                                >
                                  <path
                                    d="M5 5h4l2 4h4l2 4h2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  <circle cx="6" cy="5" r="1" />
                                </svg>
                              </span>
                              <div>
                                <p className="text-xs uppercase tracking-[0.3em] text-stone-500">
                                  Story collage
                                </p>
                                <p className="text-lg font-semibold text-stone-900">
                                  How we know them
                                </p>
                              </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                              {storyCardData.slice(0, 4).map((story) => (
                                <div
                                  key={story.key}
                                  className="relative overflow-hidden rounded-2xl border border-stone-200 bg-stone-50/80 p-4 shadow-inner"
                                >
                                  <p className="text-xs uppercase tracking-[0.4em] text-stone-500">
                                    {story.badge}
                                  </p>
                                  <p className="mt-2 text-lg font-semibold text-stone-900">
                                    {story.name}
                                  </p>
                                  <p className="mt-1 text-sm text-stone-600">
                                    {story.caption}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {funFactsEnabled && funFactsRender.length > 0 && (
                          <div className="rounded-3xl border border-stone-200 bg-white/90 p-6 shadow-sm">
                            <div className="flex items-center gap-3">
                              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 text-stone-900">
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  className="h-5 w-5"
                                  strokeWidth="1.6"
                                >
                                  <path
                                    d="M6 9l4-4 4 4M18 15l-4 4-4-4"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </span>
                              <div>
                                <p className="text-xs uppercase tracking-[0.3em] text-stone-500">
                                  Fun things you should know
                                </p>
                                <p className="text-lg font-semibold text-stone-900">
                                  Fun facts
                                </p>
                              </div>
                            </div>
                            <ul className="mt-4 space-y-2 text-sm text-stone-700">
                              {funFactsRender.map((fact, index) => (
                                <li
                                  key={`${fact.id}-${index}`}
                                  className="flex items-start gap-3"
                                >
                                  <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-stone-900" />
                                  <span>{fact.text}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {bannerEnabled && (
                          <div className="relative overflow-hidden rounded-3xl border border-stone-200 bg-gradient-to-r from-stone-800 via-stone-700 to-stone-900 px-6 py-16 text-center text-white">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.2),_transparent_55%)] opacity-80" />
                            <p className="relative text-2xl font-semibold">
                              {partyGroupPhotoCaption ||
                                DEFAULT_PARTY_HERO.groupPhotoCaption}
                            </p>
                            <p className="relative mt-2 text-sm text-white/80">
                              Add your favorite group photo to make this banner
                              shine.
                            </p>
                          </div>
                        )}

                        {closingEnabled && (
                          <div className="text-center text-sm text-stone-600">
                            <p>
                              {partyClosingNote ||
                                DEFAULT_PARTY_HERO.closingNote}
                            </p>
                          </div>
                        )}
                      </div>
                    </PreviewCard>
                  )}

                  {hasPhotos && (
                    <PreviewCard title={menuLabel("photos", "Photos")}>
                      <div className="relative w-full">
                        {/* Main Carousel */}
                        <div className="relative overflow-hidden rounded-2xl bg-stone-100 aspect-[4/3]">
                          <div
                            className="flex h-full transition-transform duration-500 ease-in-out"
                            style={{
                              transform: `translateX(-${
                                currentPhotoIndex * 100
                              }%)`,
                            }}
                          >
                            {photoFiles.map((photo, index) => (
                              <div
                                key={index}
                                className="min-w-full h-full relative"
                              >
                                <img
                                  src={photo.previewUrl}
                                  alt={`Gallery photo ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                              </div>
                            ))}
                          </div>

                          {/* Navigation Arrows */}
                          {photoFiles.length > 1 && (
                            <>
                              <button
                                type="button"
                                onClick={prevPhoto}
                                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full p-2 shadow-lg transition-all hover:scale-110"
                                aria-label="Previous photo"
                              >
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  className="w-5 h-5 text-stone-700"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M15 18l-6-6 6-6" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={nextPhoto}
                                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full p-2 shadow-lg transition-all hover:scale-110"
                                aria-label="Next photo"
                              >
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  className="w-5 h-5 text-stone-700"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M9 18l6-6-6-6" />
                                </svg>
                              </button>
                            </>
                          )}

                          {/* Dots Indicator */}
                          {photoFiles.length > 1 && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
                              {photoFiles.map((_, index) => (
                                <button
                                  key={index}
                                  type="button"
                                  onClick={() => setCurrentPhotoIndex(index)}
                                  className={`h-2 rounded-full transition-all ${
                                    index === currentPhotoIndex
                                      ? "w-8 bg-white"
                                      : "w-2 bg-white/60 hover:bg-white/80"
                                  }`}
                                  aria-label={`Go to photo ${index + 1}`}
                                />
                              ))}
                            </div>
                          )}

                          {/* Photo Counter */}
                          {photoFiles.length > 1 && (
                            <div className="absolute top-4 right-4 z-10 bg-black/40 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full">
                              {currentPhotoIndex + 1} / {photoFiles.length}
                            </div>
                          )}
                        </div>

                        {/* Thumbnail Strip */}
                        {photoFiles.length > 1 && (
                          <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {photoFiles.map((photo, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => setCurrentPhotoIndex(index)}
                                className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                                  index === currentPhotoIndex
                                    ? "border-stone-400 scale-105 shadow-md"
                                    : "border-stone-200 hover:border-stone-300 opacity-70 hover:opacity-100"
                                }`}
                              >
                                <img
                                  src={photo.previewUrl}
                                  alt={`Thumbnail ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </PreviewCard>
                  )}
                </div>
              )}
            </div>
          </article>
        </div>
        <div className="w-full max-w-md space-y-5 rounded-2xl border border-black/5 bg-white/90 p-6 shadow-md">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-stone-500">
              Customize
            </p>
            <h2 className="text-2xl font-semibold text-stone-900">
              Add your details
            </h2>
          </div>
          <div className={styles.accordionWrapper}>
            <div
              className={`${styles.menuView} ${
                activeSection ? styles.menuHidden : ""
              }`}
            >
              {infoSections.map((section) => (
                <div key={section.key} className={styles.menuItem}>
                  <button
                    type="button"
                    className={styles.menuButton}
                    onClick={() => setActiveSection(section.key)}
                  >
                    <span>{menuLabel(section.key, section.label)}</span>
                    <span className={styles.menuButtonIcon}>➤</span>
                  </button>
                  <p>{section.description}</p>
                </div>
              ))}
            </div>
            {activeSectionData && (
              <div
                className={`${styles.detailPanel} ${styles.detailPanelOpen}`}
              >
                <div className={styles.detailHeader}>
                  <button
                    type="button"
                    className="text-sm font-semibold text-stone-600"
                    onClick={handleBack}
                  >
                    ← Back
                  </button>
                  <div className="flex items-center gap-2">
                    {editingTitle === activeSection ? (
                      <input
                        value={renameDraft}
                        onChange={(event) => setRenameDraft(event.target.value)}
                        onBlur={saveTitle}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            saveTitle();
                          }
                        }}
                        className="border-b border-stone-700 text-sm uppercase tracking-[0.3em] px-2 py-1"
                        autoFocus
                      />
                    ) : (
                      <h3 className={styles.detailTitle}>
                        {menuLabel(
                          activeSectionData.key,
                          activeSectionData.label
                        )}
                      </h3>
                    )}
                    {editingTitle !== activeSection && (
                      <button
                        type="button"
                        aria-label="Rename link"
                        className="text-xs uppercase tracking-[0.3em] text-stone-500"
                        onClick={startEditTitle}
                      >
                        <EditSquareIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <span />
                </div>
                <p className={styles.detailDesc}>
                  {activeSectionData.description}
                </p>
                <div className={styles.detailContent}>
                  {renderSectionContent(activeSectionData.key)}
                </div>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleContinue}
            className="w-full rounded-full bg-stone-900 px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-stone-800"
          >
            Preview and publish
          </button>
        </div>
      </section>
    </main>
  );
}
