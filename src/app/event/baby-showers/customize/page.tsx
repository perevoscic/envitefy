// @ts-nocheck
"use client";

import { useProgressNavigation } from "@/components/UnsavedProgressProvider";
import LegacyTemplateDraftButton from "@/components/templates/LegacyTemplateDraftButton";
import { BRIDAL_PRESETS } from "@/lib/public-template-catalog";
import TemplateGalleryBackLink from "@/components/templates/TemplateGalleryBackLink";
import { useTemplateEditor, useTemplateState, useTemplateSearchParams } from "@/components/templates/TemplateEditorContext";

import BabyShowerTemplateView from "@/components/BabyShowerTemplateView";
import { BABY_SHOWER_DESIGNS, getBabyShowerDesign, getBabyShowerTheme, resolveBabyShowerHero } from "@/lib/baby-shower-designs";
import { familyTemplateDate, getFamilyTemplateDesign } from "@/lib/family-template-designs";
import EventGuestPlanningEditor from "@/components/event-templates/EventGuestPlanningEditor";
import { normalizeEventGuestPlanning, type EventGuestPlanning } from "@/lib/event-guest-planning";
import {
  useRef,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Edit2,
  Heart,
  Users,
  Image as ImageIcon,
  Type,
  CheckSquare,
  Gift,
  Upload,
  Trash2,
  Baby,
} from "lucide-react";
import {
  type BabyShowerTemplateDefinition,
  babyShowerTemplateCatalog,
} from "@/components/event-create/BabyShowersTemplateGallery";
import ScrollHandoffContainer from "@/components/ScrollHandoffContainer";
import { useMobileDrawer } from "@/hooks/useMobileDrawer";
import { buildEventPath } from "@/utils/event-url";
import { persistImageMediaValue as persistExistingImage } from "@/utils/media-upload-client";

// Import constants from wedding page (we'll reuse FONTS, FONT_SIZES, DESIGN_THEMES)
// For now, let's create a simplified version with essential features

function getTemplateById(id?: string | null): BabyShowerTemplateDefinition {
  if (!id) return babyShowerTemplateCatalog[0];
  const bridal = BRIDAL_PRESETS.find((preset) => preset.id === id);
  if (bridal) return { ...babyShowerTemplateCatalog[0], id: bridal.id, name: bridal.name, description: bridal.description };
  return (
    babyShowerTemplateCatalog.find((template) => template.id === (getBabyShowerDesign(id)?.id || id)) ??
    babyShowerTemplateCatalog[0]
  );
}

// Simplified constants - we'll expand these
const FONTS = {
  playfair: { name: "Playfair Display", preview: "var(--font-playfair)" },
  montserrat: { name: "Montserrat", preview: "var(--font-montserrat)" },
  poppins: { name: "Poppins", preview: "var(--font-poppins)" },
  dancing: { name: "Dancing Script", preview: "var(--font-dancing)" },
  allura: { name: "Allura", preview: "var(--font-allura)" },
  parisienne: { name: "Parisienne", preview: "var(--font-parisienne)" },
  ...Object.fromEntries(BABY_SHOWER_DESIGNS.map((design) => [design.font, { name: design.displayFont, preview: `"${design.displayFont}", Georgia, serif` }])),
};

const FONT_SIZES = {
  small: {
    h1: "text-2xl md:text-4xl",
    h2: "text-2xl md:text-3xl",
    body: "text-sm",
  },
  medium: {
    h1: "text-3xl md:text-5xl",
    h2: "text-3xl md:text-4xl",
    body: "text-base",
  },
  large: {
    h1: "text-4xl md:text-6xl",
    h2: "text-4xl md:text-5xl",
    body: "text-lg",
  },
};

const DESIGN_THEMES = [
  {
    id: "soft_neutrals",
    name: "Soft Neutrals",
    category: "Classic",
    bg: "bg-[#fdfbf7]",
    text: "text-slate-900",
    accent: "text-slate-600",
    previewColor: "bg-[#fdfbf7]",
  },
  {
    id: "blush_pink",
    name: "Blush Pink",
    category: "Sweet",
    bg: "bg-[#fff1f2]",
    text: "text-[#881337]",
    accent: "text-[#e11d48]",
    previewColor: "bg-[#ffe4e6]",
  },
  {
    id: "sage_green",
    name: "Sage Green",
    category: "Botanical",
    bg: "bg-[#f0fdf4]",
    text: "text-[#1e293b]",
    accent: "text-[#3f6212]",
    previewColor: "bg-[#dcfce7]",
  },
  {
    id: "lavender",
    name: "Lavender",
    category: "Botanical",
    bg: "bg-[#fdf4ff]",
    text: "text-[#581c87]",
    accent: "text-[#a855f7]",
    previewColor: "bg-[#f3e8ff]",
  },
  {
    id: "baby_blue",
    name: "Baby Blue",
    category: "Classic",
    bg: "bg-[#eff6ff]",
    text: "text-[#1e3a8a]",
    accent: "text-[#3b82f6]",
    previewColor: "bg-[#dbeafe]",
  },
  {
    id: "sunrise_sorbet",
    name: "Sunrise Sorbet",
    category: "Gradient",
    bg: "",
    bgStyle: {
      backgroundImage:
        "linear-gradient(135deg, #ffe0c8 0%, #ffb3c0 40%, #ff9fe1 80%)",
    },
    text: "text-slate-900",
    accent: "text-[#d14b8f]",
    previewColor: "",
    previewStyle: {
      backgroundImage: "linear-gradient(135deg, #ffe8d8, #ffc7d9, #ffb5ef)",
    },
  },
  {
    id: "minty_aurora",
    name: "Minty Aurora",
    category: "Gradient",
    bg: "",
    bgStyle: {
      backgroundImage:
        "linear-gradient(145deg, #b7f8d0 0%, #9fe9ff 50%, #d4c6ff 100%)",
    },
    text: "text-slate-900",
    accent: "text-[#0f766e]",
    previewColor: "",
    previewStyle: {
      backgroundImage: "linear-gradient(145deg, #c7fce0, #b7f0ff, #e5dbff)",
    },
  },
  {
    id: "golden_hour",
    name: "Golden Hour",
    category: "Warm Glow",
    bg: "",
    bgStyle: {
      backgroundImage:
        "linear-gradient(135deg, #fff3d6 0%, #ffd59f 55%, #f7b267 100%)",
    },
    text: "text-[#5c2c00]",
    accent: "text-[#d97706]",
    previewColor: "",
    previewStyle: {
      backgroundImage: "linear-gradient(135deg, #fff7e5, #ffe1b8, #f8c089)",
    },
  },
  ...BABY_SHOWER_DESIGNS.map(getBabyShowerTheme),
];

const INITIAL_DATA = {
  babyName: "Emma",
  momName: "Sarah",
  date: (() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 2);
    return date.toISOString().split("T")[0];
  })(),
  time: "14:00",
  endDate: "",
  endTime: "",
  guestPlanning: {} as EventGuestPlanning,
  city: "Chicago",
  state: "IL",
  address: "123 Main Street",
  babyDetails: {
    expectingDate: (() => {
      const date = new Date();
      date.setMonth(date.getMonth() + 3);
      return date.toISOString().split("T")[0];
    })(),
    gender: "Girl",
    notes:
      "We are so excited to celebrate the upcoming arrival of our little one! Join us for an afternoon of games, delicious treats, and lots of love. We can't wait to share this special day with our closest family and friends.",
  },
  momDetails: {
    notes:
      "We're so excited to celebrate Sarah and the upcoming arrival of baby Emma! Join us for an afternoon of games, delicious treats, and lots of love.",
  },
  hosts: [
    { id: 1, name: "Sarah & Michael", role: "Parents-to-be" },
    { id: 2, name: "Grandma Mary", role: "Grandmother" },
    { id: 3, name: "Aunt Jessica", role: "Aunt" },
  ],
  theme: {
    font: "playfair",
    fontSize: "medium",
    themeId: "blush_pink",
  },
  images: {
    hero: null,
    headlineBg: null,
  },
  registries: [
    {
      id: 1,
      label: "Amazon",
      url: "https://www.amazon.com/baby-reg",
    },
    {
      id: 2,
      label: "Target",
      url: "https://www.target.com/baby-registry",
    },
  ],
  rsvp: {
    isEnabled: true,
    deadline: (() => {
      const date = new Date();
      date.setMonth(date.getMonth() + 1);
      return date.toISOString().split("T")[0];
    })(),
  },
  gallery: [
    {
      id: 1,
      url: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=800",
      caption: "Baby shower setup",
    },
    {
      id: 2,
      url: "https://images.unsplash.com/photo-1511988617509-a57c8a288659?w=800",
      caption: "Decorations",
    },
    {
      id: 3,
      url: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800",
      caption: "Gifts",
    },
  ],
};

const MenuCard = ({ title, icon, desc, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full text-left group bg-white border border-slate-200 rounded-xl p-5 cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all duration-200 flex items-start gap-4"
  >
    <div className="bg-slate-50 p-3 rounded-lg text-slate-600 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors">
      {icon}
    </div>
    <div className="flex-1">
      <div className="flex justify-between items-center mb-1">
        <h3 className="font-semibold text-slate-800">{title}</h3>
        <ChevronRight
          size={16}
          className="text-slate-300 group-hover:text-indigo-400 transform group-hover:translate-x-1 transition-all"
        />
      </div>
      <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
    </div>
  </button>
);

const EditorLayout = ({ title, onBack, children }) => (
  <div className="animate-fade-in-right">
    <div className="flex items-center mb-6 pb-4 border-b border-slate-100">
      <button
        aria-label="Back to details"
        onClick={onBack}
        className="mr-3 p-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ChevronLeft size={20} />
      </button>
      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-auto">
        Customize
      </span>
      <h2 className="text-lg font-serif font-bold text-slate-800 absolute left-1/2 transform -translate-x-1/2">
        {title}
      </h2>
    </div>
    {children}
  </div>
);

const InputGroup = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
}) => (
  <div>
    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wider">
      {label}
    </label>
    <input
      aria-label={label}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
    />
  </div>
);

export default function BabyShowerTemplateCustomizePage() {
  const templateEditor = useTemplateEditor();
  const persistImageMediaValue = templateEditor ? async ({ value, fallbackValue }: Parameters<typeof persistExistingImage>[0]) => value || fallbackValue || null : persistExistingImage;
  const search = useTemplateSearchParams();
  const router = useRouter();
  const { allowNavigation } = useProgressNavigation();
  const defaultDate = search?.get("d") ?? undefined;
  const editEventId = search?.get("edit") ?? undefined;
  const templateId = search?.get("templateId");
  const isBridal = templateEditor?.category === "bridal-showers" || search?.get("occasion") === "bridal-shower";
  const [activeTemplateId, setActiveTemplateId] = useTemplateState<string | undefined>("activeTemplateId", 
    templateId || undefined
  );
  const template = useMemo(
    () => getTemplateById(activeTemplateId),
    [activeTemplateId]
  );

  const [activeView, setActiveView] = useTemplateState("activeView", "main");
  const selectedDesign = getBabyShowerDesign(template.id) ?? BABY_SHOWER_DESIGNS[0];
  const bridalPreset = BRIDAL_PRESETS.find((preset) => preset.id === template.id) || BRIDAL_PRESETS[0];
  const designDefaults = isBridal ? { heroImage: bridalPreset.heroImage, themeId: bridalPreset.themeId, font: "playfair" } : getFamilyTemplateDesign("baby-showers", template.id);
  const [data, setData] = useTemplateState("data", () => ({
    ...INITIAL_DATA,
    ...(!editEventId && !isBridal ? {
      babyName: selectedDesign.sample.babyName,
      momName: selectedDesign.sample.momName,
      time: selectedDesign.sample.time,
      address: selectedDesign.sample.venue,
      city: selectedDesign.sample.city,
      state: selectedDesign.sample.state,
      babyDetails: { expectingDate: "", gender: "", notes: selectedDesign.sample.notes },
      momDetails: { notes: selectedDesign.sample.hostNote },
      hosts: [{ id: 1, name: selectedDesign.sample.host, role: "Your hosts" }],
      registries: [],
      gallery: [],
      rsvp: { isEnabled: true, deadline: "" },
    } : {}),

    ...(isBridal ? { babyName: "", momName: "Sophia", eventTitle: "A toast to the bride", babyDetails: { expectingDate: "", gender: "", notes: "Join us for an afternoon of love, laughter, and a toast to the bride." }, momDetails: { notes: "" }, registries: [], hosts: [], gallery: [], images: { ...INITIAL_DATA.images, hero: bridalPreset.heroImage } } : {}),
    date: familyTemplateDate(defaultDate, editEventId || isBridal ? INITIAL_DATA.date : selectedDesign.sample.date),
    theme: editEventId ? INITIAL_DATA.theme : { ...INITIAL_DATA.theme, themeId: designDefaults.themeId, font: designDefaults.font },
  }));
  const {
    mobileMenuOpen,
    openMobileMenu,
    closeMobileMenu,
    previewTouchHandlers,
    drawerTouchHandlers,
  } = useMobileDrawer();
  const [designOpen, setDesignOpen] = useState(true);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [newHost, setNewHost] = useTemplateState("newHost", { name: "", role: "" });
  const [newRegistry, setNewRegistry] = useTemplateState("newRegistry", { label: "", url: "" });
  const [_loadingExisting, setLoadingExisting] = useState(false);
  const updateData = (field, value) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const updateTheme = (field, value) => {
    setData((prev) => ({
      ...prev,
      theme: { ...prev.theme, [field]: value },
    }));
  };

  const updateBabyDetails = (field, value) => {
    setData((prev) => ({
      ...prev,
      babyDetails: { ...prev.babyDetails, [field]: value },
    }));
  };

  const updateMomDetails = (field, value) => {
    setData((prev) => ({
      ...prev,
      momDetails: { ...prev.momDetails, [field]: value },
    }));
  };

  const handleImageUpload = (field, e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = (templateEditor ? templateEditor.previewPhoto(file) : URL.createObjectURL(file));
      if (!imageUrl) return;
      setData((prev) => ({
        ...prev,
        images: { ...prev.images, [field]: imageUrl },
      }));
    }
  };

  const handleGalleryUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newImages = files.map((file) => ({
      id: `${file.name}-${Date.now()}`,
      url: (templateEditor ? templateEditor.previewPhoto(file) : URL.createObjectURL(file)),
    })).filter((image) => image.url);
    setData((prev) => ({
      ...prev,
      gallery: [...prev.gallery, ...newImages],
    }));
  };

  const removeGalleryImage = (id) => {
    setData((prev) => ({
      ...prev,
      gallery: prev.gallery.filter((img) => img.id !== id),
    }));
  };

  const currentTheme =
    DESIGN_THEMES.find((c) => c.id === data.theme.themeId) || DESIGN_THEMES[0];
  const currentFont = FONTS[data.theme.font] || FONTS.playfair;
  const heroImageSrc = designDefaults.heroImage;

  // Keep template selection in sync with URL when not editing
  useEffect(() => {
    if (!editEventId && templateId) {
      setActiveTemplateId(templateId);
    }
  }, [editEventId, templateId]);

  // Load existing event data when editing so design choices persist
  useEffect(() => {
    const loadExisting = async () => {
      if (!editEventId) return;
      setLoadingExisting(true);
      try {
        const res = await fetch(`/api/history/${editEventId}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          console.error("[Baby Shower Edit] Failed to load event:", res.status);
          setLoadingExisting(false);
          return;
        }
        const json = await res.json();
        const existing = json?.data || {};

        const startIso =
          existing.startISO || existing.start || existing.startIso || null;
        let loadedDate: string | undefined;
        let loadedTime: string | undefined;
        if (startIso) {
          const d = new Date(startIso);
          if (!Number.isNaN(d.getTime())) {
            loadedDate = d.toISOString().split("T")[0];
            loadedTime = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
          }
        }

        const resolvedTemplateId =
          existing.templateId || existing.template?.id || activeTemplateId;
        if (resolvedTemplateId) {
          setActiveTemplateId(resolvedTemplateId);
        }

        const resolvedThemeId =
          existing.themeId ||
          existing.theme?.themeId ||
          existing.theme?.id ||
          INITIAL_DATA.theme.themeId;
        const resolvedFont =
          existing.theme?.font || existing.fontId || INITIAL_DATA.theme.font;
        const resolvedFontSize =
          existing.theme?.fontSize ||
          existing.fontSize ||
          INITIAL_DATA.theme.fontSize;

        // Restore full theme object from saved data, or fallback to theme from DESIGN_THEMES
        const savedTheme = existing.theme || {};
        const themeFromCatalog =
          DESIGN_THEMES.find((t) => t.id === resolvedThemeId) ||
          DESIGN_THEMES[0];
        // Merge saved theme with catalog theme, preserving saved properties (bg, text, accent, bgStyle, name, etc.)
        const restoredTheme = {
          ...themeFromCatalog,
          ...savedTheme, // Saved theme takes precedence
          // Ensure id and themeId are set
          id: resolvedThemeId,
          themeId: resolvedThemeId,
          // Preserve name from saved theme if available, otherwise use catalog
          name: savedTheme.name || themeFromCatalog.name,
          // Preserve font settings
          font: resolvedFont,
          fontSize: resolvedFontSize,
        };

        const resolvedRsvpDeadline =
          existing.rsvpDeadline ||
          (typeof existing.rsvp === "string"
            ? existing.rsvp
            : existing.rsvp?.deadline) ||
          null;

        const normalizedHosts =
          Array.isArray(existing.hosts)
            ? existing.hosts.map((host: any, idx: number) => ({
                id: host.id || idx + 1,
                name: host.name || "",
                role: host.role || "",
              }))
            : INITIAL_DATA.hosts;

        const normalizedRegistries =
          Array.isArray(existing.registries)
            ? existing.registries.map((reg: any, idx: number) => ({
                id: reg.id || idx + 1,
                label: reg.label || "Registry",
                url: reg.url || "",
              }))
            : INITIAL_DATA.registries;

        const storedEnd = existing.endISO || existing.end || existing.endAt;
        const parsedEnd = storedEnd ? new Date(storedEnd) : null;
        const validEnd = parsedEnd && !Number.isNaN(parsedEnd.getTime()) ? parsedEnd : null;
        const restoredEndDate = validEnd ? `${validEnd.getFullYear()}-${String(validEnd.getMonth() + 1).padStart(2, "0")}-${String(validEnd.getDate()).padStart(2, "0")}` : "";
        const restoredEndTime = validEnd ? `${String(validEnd.getHours()).padStart(2, "0")}:${String(validEnd.getMinutes()).padStart(2, "0")}` : "";

        setData((prev) => ({
          ...prev,
          babyName: existing.babyName || prev.babyName,
          momName: existing.momName || prev.momName,
          date: existing.date || loadedDate || prev.date,
          time: existing.time || loadedTime || prev.time,
          endDate: existing.endDate ?? restoredEndDate,
          endTime: existing.endTime ?? restoredEndTime,
          guestPlanning: normalizeEventGuestPlanning(existing.guestPlanning),
          city: existing.city || prev.city,
          state: existing.state || prev.state,
          address: existing.address || existing.location || prev.address,
          babyDetails: {
            ...prev.babyDetails,
            expectingDate:
              existing.babyDetails?.expectingDate ||
              existing.customFields?.expectingDate ||
              prev.babyDetails.expectingDate,
            gender:
              existing.babyDetails?.gender ||
              existing.customFields?.gender ||
              prev.babyDetails.gender,
            notes:
              existing.babyDetails?.notes ||
              existing.customFields?.aboutBaby ||
              existing.description ||
              prev.babyDetails.notes,
          },
          momDetails: {
            ...prev.momDetails,
            notes:
              existing.momDetails?.notes ||
              existing.customFields?.aboutMom ||
              prev.momDetails.notes,
          },
          hosts: normalizedHosts,
          theme: {
            ...prev.theme,
            ...restoredTheme,
            font: resolvedFont,
            fontSize: resolvedFontSize,
            themeId: resolvedThemeId,
          },
          images: {
            ...prev.images,
            hero:
              resolveBabyShowerHero(existing.heroImage || existing.images?.hero || prev.images.hero, getBabyShowerDesign(resolvedTemplateId)),
          },
          registries: normalizedRegistries,
          rsvp: {
            isEnabled:
              existing.rsvpEnabled ||
              Boolean(resolvedRsvpDeadline) ||
              Boolean(existing.rsvp?.isEnabled),
            deadline: resolvedRsvpDeadline || prev.rsvp.deadline,
          },
          gallery:
            Array.isArray(existing.gallery) && existing.gallery.length > 0
              ? existing.gallery
              : prev.gallery,
        }));
      } catch (err) {
        console.error("[Baby Shower Edit] Error loading event", err);
      } finally {
        setLoadingExisting(false);
      }
    };

    loadExisting();
  }, [editEventId, activeTemplateId, templateId]);

  const handlePublish = useCallback(async () => {
      if (templateEditor && !templateEditor.authenticated) { await templateEditor.requestSave(); return; }
    if (submitting) return;
    setSubmitting(true);
    try {
      let startISO: string | null = null;
      let endISO: string | null = null;
      if (!data.date || !data.time) throw new Error("Enter an event date and start time before publishing.");
      if (data.date) {
        const start = new Date(`${data.date}T${data.time}:00`);
        if (Number.isNaN(start.getTime())) throw new Error("Enter a valid event date and start time.");
        startISO = start.toISOString();
        if (data.endTime) {
          const end = new Date(`${data.endDate || data.date}T${data.endTime}:00`);
          if (Number.isNaN(end.getTime()) || end <= start) throw new Error("End time must be after the start time. Choose an end date for an overnight event.");
          endISO = end.toISOString();
        }
      }

      const location =
        data.city && data.state ? `${data.city}, ${data.state}` : undefined;

      // Resolve design selections
      const selectedTheme =
        DESIGN_THEMES.find((c) => c.id === data.theme.themeId) ||
        DESIGN_THEMES[0];
      const selectedFont = FONTS[data.theme.font] || FONTS.playfair;
      const selectedSize = FONT_SIZES[data.theme.fontSize] || FONT_SIZES.medium;

      const heroImageToSave =
        (await persistImageMediaValue({
          value: data.images.hero,
          eventId: editEventId || undefined,
          fileName: "baby-shower-hero.png",
          fallbackValue: heroImageSrc,
        })) || heroImageSrc;

      const registryLinks = data.registries
        .filter((r) => r.url.trim())
        .map((r) => ({
          label: r.label.trim() || "Registry",
          url: r.url.trim(),
        }));

      const registryText = registryLinks
        .map((r) => `${r.label}: ${r.url}`)
        .join(" • ");
      const hostsText = data.hosts
        .map((h) => (h.role ? `${h.name} (${h.role})` : h.name))
        .join(" • ");

      const detailFields = [
        { key: "location", label: "Location" },
        { key: "expectingDate", label: "Expected Arrival" },
        { key: "gender", label: "Baby's Gender" },
        { key: "hosts", label: "Hosted By" },
        { key: "registries", label: "Registries" },
        { key: "aboutBaby", label: "About Baby" },
        { key: "aboutMom", label: "About Parent" },
        { key: "rsvpDeadline", label: "RSVP By" },
      ];

      const payload: any = {
        title: isBridal ? data.eventTitle || `${data.momName}’s Bridal Shower` : `${data.babyName}'s Baby Shower`,
        data: {
          category: isBridal ? "Bridal Showers" : "Baby Showers",
          occasion: isBridal ? "bridal-shower" : "baby-shower",
          eventTitle: data.eventTitle,
          createdVia: "template",
          createdManually: true,
          date: data.date,
          time: data.time,
          startAt: startISO,
          start: startISO,
          startISO,
          endAt: endISO,
          end: endISO,
          endISO,
          endDate: data.endDate,
          endTime: data.endTime,
          guestPlanning: data.guestPlanning,
          location,
          address: data.address || undefined,
          city: data.city || undefined,
          state: data.state || undefined,
          description: data.babyDetails.notes || undefined,
          rsvp: data.rsvp.isEnabled
            ? data.rsvp.deadline || undefined
            : undefined,
          rsvpEnabled: data.rsvp.isEnabled,
          rsvpDeadline: data.rsvp.deadline || undefined,
          numberOfGuests: 0,
          templateId: template.id,
          templateConfig: {
            displayName: isBridal ? `${data.momName}’s Bridal Shower` : `${data.babyName}'s Baby Shower`,
            categoryLabel: isBridal ? "Bridal Shower" : "Baby Shower",
            detailFields,
            rsvpCopy: {
              editorTitle: "RSVP",
              toggleLabel: "Enable RSVP",
              deadlineLabel: "RSVP Deadline",
            },
          },
          customFields: {
            location: data.address || location,
            expectingDate: data.babyDetails.expectingDate,
            gender: data.babyDetails.gender,
            hosts: hostsText,
            registries: registryText,
            aboutBaby: data.babyDetails.notes,
            aboutMom: data.momDetails.notes,
            rsvpDeadline: data.rsvp.deadline,
          },
          babyName: data.babyName,
          momName: data.momName,
          babyDetails: data.babyDetails,
          hosts: data.hosts,
          themeId: selectedTheme.id,
          theme: {
            // Save the ENTIRE theme object directly (like gymnastics does with themeToSave)
            // This automatically includes ALL properties: id, name, category, bg, text, accent, bgStyle, previewColor, previewStyle
            ...selectedTheme,
            // Add font-related properties on top
            font: data.theme.font,
            fontSize: data.theme.fontSize,
            fontFamily: selectedFont.preview,
            fontSizeH1: selectedSize.h1,
            fontSizeH2: selectedSize.h2,
            fontSizeClass: selectedSize.h1,
          },
          fontId: data.theme.font,
          fontSize: data.theme.fontSize,
          fontFamily: selectedFont.preview,
          fontSizeClass: selectedSize.h1,
          registries: registryLinks,
          heroImage: heroImageToSave,
        },
      };

      if (templateEditor) { await templateEditor.persist(payload, "published"); return; }

      let id: string | undefined;

      if (editEventId) {
        await fetch(`/api/history/${editEventId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            title: payload.title,
            data: payload.data,
          }),
        });
        id = editEventId;
      } else {
        const r = await fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        const j = await r.json().catch(() => ({}));
        id = (j as any)?.id as string | undefined;
      }

      if (id) {
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent(editEventId ? "history:updated" : "history:created", {
              detail: editEventId
                ? { id }
                : {
                    id,
                    title: payload.title,
                    created_at: new Date().toISOString(),
                    data: payload.data,
                  },
            })
          );
        }
        const params = editEventId ? { updated: true } : { created: true };
        allowNavigation(() => router.push(buildEventPath(id, payload.title, params)));
      } else {
        throw new Error(
          editEventId ? "Failed to update event" : "Failed to create event"
        );
      }
    } catch (err: any) {
      const msg = String(err?.message || err || "Failed to create event");
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  }, [templateEditor, submitting, data, template.id, editEventId, router, heroImageSrc]);

  // Render helpers instead of nested components so inputs keep focus across state updates.
  const renderMainMenu = () => (
    <div className="space-y-4 animate-fade-in pb-8 flex flex-col items-center">
      <div className="mb-6 w-full max-w-sm text-center">
        {!editEventId && (
          <TemplateGalleryBackLink
            href={templateEditor
              ? `/${templateEditor.category}/templates`
              : isBridal
                ? "/bridal-showers/templates"
                : `/event/baby-showers${data.date ? `?${new URLSearchParams({ d: data.date })}` : ""}`}
          >
            {isBridal ? "All bridal shower designs" : "All baby shower designs"}
          </TemplateGalleryBackLink>
        )}
        <h2 className="text-2xl font-serif font-semibold text-slate-800 mb-1">
          Add your details
        </h2>
        <p className="text-slate-500 text-sm">
          Customize your {isBridal ? "bridal" : "baby"} shower invitation.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 w-full max-w-sm">
        {templateEditor && <MenuCard title="Design" icon={<Type size={18} />} desc="Choose your design and theme." onClick={() => setActiveView("design")} />}
          <MenuCard
          title="Headline"
          icon={<Type size={18} />}
          desc={isBridal ? "Bride’s name, date, location." : "Baby’s name, date, location."}
          onClick={() => setActiveView("headline")}
        />
        <MenuCard
          title="Images"
          icon={<ImageIcon size={18} />}
          desc="Hero & background photos."
          onClick={() => setActiveView("images")}
        />
        <MenuCard
          title={isBridal ? "Celebration details" : "About Baby"}
          icon={isBridal ? <Heart size={18} /> : <Baby size={18} />}
          desc={isBridal ? "Plans and host notes." : "Expecting date, gender, notes."}
          onClick={() => setActiveView("babyDetails")}
        />
        <MenuCard
          title={isBridal ? "About the bride" : "About Mom"}
          icon={<Heart size={18} />}
          desc={isBridal ? "A little about the bride." : "Share details about the mom-to-be."}
          onClick={() => setActiveView("momDetails")}
        />
        <MenuCard
          title="Hosts"
          icon={<Users size={18} />}
          desc="Who's hosting the shower."
          onClick={() => setActiveView("hosts")}
        />
        <MenuCard
          title="Photos"
          icon={<ImageIcon size={18} />}
          desc="Photo gallery."
          onClick={() => setActiveView("photos")}
        />
        <MenuCard
          title="RSVP"
          icon={<CheckSquare size={18} />}
          desc="RSVP settings."
          onClick={() => setActiveView("rsvp")}
        />
        <MenuCard
          title="Registry"
          icon={<Gift size={18} />}
          desc="Gift registries."
          onClick={() => setActiveView("registry")}
        />
      </div>
    </div>
  );

  const renderHeadlineEditor = () => (
    <EditorLayout title="Headline" onBack={() => setActiveView("main")}>
      <div className="space-y-6">
        <InputGroup
          label={isBridal ? "Invitation title" : "Baby’s Name"}
          value={isBridal ? data.eventTitle : data.babyName}
          onChange={(v) => updateData(isBridal ? "eventTitle" : "babyName", v)}
          placeholder={isBridal ? "A toast to the bride" : "Baby"}
        />
        <InputGroup
          label={isBridal ? "Bride’s name" : "Mom’s name"}
          value={data.momName}
          onChange={(v) => updateData("momName", v)}
          placeholder={isBridal ? "Bride" : "Mom"}
        />
        <div className="grid grid-cols-2 gap-4">
          <InputGroup
            label="Event Date"
            type="date"
            value={data.date}
            onChange={(v) => updateData("date", v)}
          />
          <InputGroup
            label="Start Time"
            type="time"
            value={data.time}
            onChange={(v) => updateData("time", v)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <InputGroup label="End Date (optional)" type="date" value={data.endDate} onChange={(v) => updateData("endDate", v)} />
          <InputGroup label="End Time (optional)" type="time" value={data.endTime} onChange={(v) => updateData("endTime", v)} />
        </div>
        <p className="text-xs text-slate-500">Leave the end date blank for the same day. Leave the end time blank if it is not confirmed.</p>
        <EventGuestPlanningEditor category={isBridal ? "bridal-showers" : "baby-showers"} value={data.guestPlanning} onChange={(value) => updateData("guestPlanning", value)} />
        <InputGroup
          label="Address"
          value={data.address}
          onChange={(v) => updateData("address", v)}
          placeholder="Street address (optional)"
        />
      </div>
    </EditorLayout>
  );

  const renderImagesEditor = () => (
    <EditorLayout title="Images" onBack={() => setActiveView("main")}>
      <div className="space-y-8">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-3 tracking-wider">
            Hero Image
          </label>
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors relative">
            {data.images.hero ? (
              <div className="relative w-full h-48 rounded-lg overflow-hidden">
                <img
                  src={data.images.hero}
                  alt="Hero"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() =>
                    setData((prev) => ({
                      ...prev,
                      images: { ...prev.images, hero: null },
                    }))
                  }
                  className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-red-50 text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <Upload size={20} />
                </div>
                <p className="text-sm text-slate-600 mb-1">Upload main photo</p>
                <p className="text-xs text-slate-400">
                  Recommended: 1600x900px
                </p>
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => handleImageUpload("hero", e)}
                />
              </>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-3 tracking-wider">
            Headline Background
          </label>
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors relative">
            {data.images.headlineBg ? (
              <div className="relative w-full h-32 rounded-lg overflow-hidden">
                <img
                  src={data.images.headlineBg}
                  alt="Headline Bg"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() =>
                    setData((prev) => ({
                      ...prev,
                      images: { ...prev.images, headlineBg: null },
                    }))
                  }
                  className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-red-50 text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <ImageIcon size={20} />
                </div>
                <p className="text-sm text-slate-600 mb-1">
                  Upload header texture
                </p>
                <p className="text-xs text-slate-400">
                  Optional pattern behind names
                </p>
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => handleImageUpload("headlineBg", e)}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </EditorLayout>
  );

  const renderDesignEditor = () => (
    <EditorLayout title="Design" onBack={() => setActiveView("main")}>
      <div className="space-y-6">
        <div>
          <button
            onClick={() => setDesignOpen(!designOpen)}
            className="flex items-center justify-between w-full text-left group"
          >
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block cursor-pointer mb-1">
                Themes
              </label>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                <div
                  className={`w-3 h-3 rounded-full border shadow-sm ${
                    (currentTheme.previewColor || "").split(" ")[0] ||
                    "bg-slate-200"
                  }`}
                  style={currentTheme.previewStyle}
                ></div>
                {currentTheme.name || "Select a theme"}
              </div>
            </div>
            <div
              className={`p-2 rounded-full bg-slate-50 text-slate-500 group-hover:bg-slate-100 transition-all ${
                designOpen ? "rotate-180 text-indigo-600 bg-indigo-50" : ""
              }`}
            >
              <ChevronDown size={16} />
            </div>
          </button>

          <div
            className={`grid grid-cols-2 gap-3 mt-4 overflow-y-auto transition-all duration-300 ease-in-out ${
              designOpen
                ? "max-h-[600px] opacity-100"
                : "max-h-0 opacity-0 hidden"
            }`}
          >
            {DESIGN_THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  updateTheme("themeId", theme.id);
                }}
                className={`relative overflow-hidden p-3 border rounded-lg text-left transition-all group ${
                  data.theme.themeId === theme.id
                    ? "border-indigo-600 ring-1 ring-indigo-600 shadow-md"
                    : "border-slate-200 hover:border-slate-400 hover:shadow-sm"
                }`}
              >
                <div
                  className={`h-12 w-full rounded-md mb-3 ${
                    theme.previewColor || ""
                  } border border-black/5 shadow-inner flex items-center justify-center relative overflow-hidden`}
                  style={theme.previewStyle}
                ></div>
                <span className="text-sm font-medium text-slate-700 block truncate">
                  {theme.name}
                </span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wide">
                  {theme.category}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">
            Typography
          </label>
          <div className="grid grid-cols-2 gap-3 max-h-none overflow-visible pr-1">
            {Object.entries(FONTS).map(([key, font]) => (
              <button
                key={key}
                onClick={() => updateTheme("font", key)}
                className={`border rounded-lg p-3 text-left transition-colors ${
                  data.theme.font === key
                    ? "border-indigo-600 bg-indigo-50"
                    : "border-slate-200 hover:border-indigo-300"
                }`}
              >
                <div
                  className="text-base font-semibold"
                  style={{ fontFamily: font.preview }}
                >
                  {font.name}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">
            Text Size
          </label>
          <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-lg">
            {["small", "medium", "large"].map((size) => (
              <button
                key={size}
                onClick={() => updateTheme("fontSize", size)}
                className={`py-2 text-sm font-medium rounded-md transition-all capitalize ${
                  data.theme.fontSize === size
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      </div>
    </EditorLayout>
  );

  const renderBabyDetailsEditor = () => (
    <EditorLayout title={isBridal ? "Celebration details" : "About Baby"} onBack={() => setActiveView("main")}>
      <div className="space-y-4">
        {!isBridal && <>
        <InputGroup
          label="Expected Due Date"
          type="date"
          value={data.babyDetails.expectingDate}
          onChange={(v) => updateBabyDetails("expectingDate", v)}
        />
        </>}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wider">
            Gender
          </label>
          <div className="grid grid-cols-3 gap-2">
            {["", "Boy", "Girl"].map((gender) => (
              <button
                key={gender}
                onClick={() => updateBabyDetails("gender", gender)}
                className={`py-2 text-sm font-medium rounded-md transition-all ${
                  data.babyDetails.gender === gender
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {gender || "Surprise"}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wider">
            Notes
          </label>
          <textarea
            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[200px] text-slate-700 text-sm"
            value={data.babyDetails.notes}
            onChange={(e) => updateBabyDetails("notes", e.target.value)}
            placeholder={isBridal ? "Share celebration plans and host notes…" : "Share any special details about the baby or shower..."}
          />
        </div>
      </div>
    </EditorLayout>
  );

  const renderMomDetailsEditor = () => (
    <EditorLayout title={isBridal ? "About the bride" : "About Mom"} onBack={() => setActiveView("main")}>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wider">
            About {data.momName || "Mom"}
          </label>
          <textarea
            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[200px] text-slate-700 text-sm"
            value={data.momDetails?.notes || ""}
            onChange={(e) => updateMomDetails("notes", e.target.value)}
            placeholder={isBridal ? "Share a little about the bride and your celebration…" : "Share details about the mom-to-be, her journey, or what makes this special..."}
          />
        </div>
      </div>
    </EditorLayout>
  );

  const renderHostsEditor = () => {
    const addHost = () => {
      if (newHost.name) {
        updateData("hosts", [...data.hosts, { ...newHost, id: Date.now() }]);
        setNewHost({ name: "", role: "" });
      }
    };

    return (
      <EditorLayout title="Hosts" onBack={() => setActiveView("main")}>
        <div className="space-y-6">
          <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase">
              Add Host
            </h4>
            <InputGroup
              label="Name"
              value={newHost.name}
              onChange={(v) => setNewHost({ ...newHost, name: v })}
              placeholder="Host name"
            />
            <InputGroup
              label="Role"
              value={newHost.role}
              onChange={(v) => setNewHost({ ...newHost, role: v })}
              placeholder="e.g. Grandmother, Best Friend"
            />
            <button
              onClick={addHost}
              className="w-full py-2 bg-indigo-600 text-white text-sm rounded-md font-medium hover:bg-indigo-700"
            >
              Add Host
            </button>
          </div>

          <div className="space-y-3">
            {data.hosts.map((host) => (
              <div
                key={host.id}
                className="bg-white p-3 border border-slate-200 rounded-lg flex justify-between items-center"
              >
                <div>
                  <div className="font-bold text-slate-800">{host.name}</div>
                  {host.role && (
                    <div className="text-xs text-slate-500">{host.role}</div>
                  )}
                </div>
                <button
                  onClick={() =>
                    updateData(
                      "hosts",
                      data.hosts.filter((h) => h.id !== host.id)
                    )
                  }
                  className="text-slate-400 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </EditorLayout>
    );
  };

  const renderPhotosEditor = () => (
    <EditorLayout title="Photos" onBack={() => setActiveView("main")}>
      <div className="space-y-6">
        <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group relative">
          <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Upload size={20} className="text-indigo-600" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 mb-1">
            Upload Photos
          </h3>
          <p className="text-xs text-slate-500">JPG or PNG up to 5MB</p>
          <input
            type="file"
            accept="image/*"
            multiple
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={handleGalleryUpload}
          />
        </div>

        {data.gallery.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {data.gallery.map((img) => (
              <div key={img.id} className="relative group">
                <img
                  src={img.url}
                  alt="Gallery"
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  onClick={() => removeGalleryImage(img.id)}
                  className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </EditorLayout>
  );

  const renderRsvpEditor = () => (
    <EditorLayout title="RSVP Settings" onBack={() => setActiveView("main")}>
      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
          <span className="font-medium text-slate-700 text-sm">
            Enable RSVP
          </span>
          <button
            onClick={() =>
              updateData("rsvp", {
                ...data.rsvp,
                isEnabled: !data.rsvp.isEnabled,
              })
            }
            className={`w-11 h-6 rounded-full transition-colors relative ${
              data.rsvp.isEnabled ? "bg-indigo-600" : "bg-slate-300"
            }`}
          >
            <span
              className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                data.rsvp.isEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            ></span>
          </button>
        </div>

        {data.rsvp.isEnabled && (
          <InputGroup
            label="RSVP Deadline"
            type="date"
            value={data.rsvp.deadline}
            onChange={(v) => updateData("rsvp", { ...data.rsvp, deadline: v })}
          />
        )}

        <div className="bg-blue-50 p-4 rounded-md text-blue-800 text-sm">
          <strong>Preview:</strong> Check the preview pane to see the RSVP form
          that your guests will see.
        </div>
      </div>
    </EditorLayout>
  );

  const renderRegistryEditor = () => {
    const addRegistry = () => {
      if (newRegistry.url) {
        updateData("registries", [
          ...data.registries,
          { ...newRegistry, id: Date.now() },
        ]);
        setNewRegistry({ label: "", url: "" });
      }
    };

    return (
      <EditorLayout title="Registry" onBack={() => setActiveView("main")}>
        <div className="space-y-6">
          <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase">
              Add Registry
            </h4>
            <InputGroup
              label="Registry Name"
              value={newRegistry.label}
              onChange={(v) => setNewRegistry({ ...newRegistry, label: v })}
              placeholder="e.g. Amazon, Target, Babylist"
            />
            <InputGroup
              label="Registry URL"
              type="url"
              value={newRegistry.url}
              onChange={(v) => setNewRegistry({ ...newRegistry, url: v })}
              placeholder="https://www.example.com/registry"
            />
            <button
              onClick={addRegistry}
              className="w-full py-2 bg-indigo-600 text-white text-sm rounded-md font-medium hover:bg-indigo-700"
            >
              Add Registry
            </button>
          </div>

          <div className="space-y-3">
            {data.registries.map((registry) => (
              <div
                key={registry.id}
                className="bg-white p-3 border border-slate-200 rounded-lg flex justify-between items-center"
              >
                <div>
                  <div className="font-bold text-slate-800">
                    {registry.label || "Registry"}
                  </div>
                  <div className="text-xs text-slate-500 truncate max-w-xs">
                    {registry.url}
                  </div>
                </div>
                <button
                  onClick={() =>
                    updateData(
                      "registries",
                      data.registries.filter((r) => r.id !== registry.id)
                    )
                  }
                  className="text-slate-400 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </EditorLayout>
    );
  };

  return (
    <div className="relative flex min-h-screen h-[100dvh] w-full bg-slate-100 overflow-hidden font-sans text-slate-900">
      <div
        ref={previewRef}
        {...previewTouchHandlers}
        className="flex-1 min-w-0 min-h-0 relative overflow-y-auto scrollbar-hide bg-[#f0f2f5] flex justify-center"
        style={{
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
        }}
      ><div className="w-full min-w-0 mb-4 md:mb-8">
          <BabyShowerTemplateView
            eventId=""
            eventTitle={isBridal ? data.eventTitle : `${data.babyName}'s Baby Shower`}
            eventData={{
              ...data,
              occasion: isBridal ? "bridal-shower" : undefined,
              location: [data.address, data.city, data.state].filter(Boolean).join(", "),
              templateId: template.id,
              heroImage: resolveBabyShowerHero(data.images.hero, selectedDesign),
              themeId: data.theme.themeId,
              theme: { ...currentTheme, fontFamily: currentFont.preview, fontSize: data.theme.fontSize },
              fontFamily: currentFont.preview,
              endISO: data.endTime && data.date ? `${data.endDate || data.date}T${data.endTime}:00` : undefined,
            }}
            shareUrl=""
            isOwner={false}
            isReadOnly
            editHref=""
            preview
          />
        </div>
      </div>

      {mobileMenuOpen && (
        <div
          className="nav-chrome-mobile-drawer-backdrop md:hidden fixed inset-0 z-10"
          onClick={closeMobileMenu}
          role="presentation"
        ></div>
      )}

      <div
        className={`nav-chrome-mobile-drawer w-full md:w-[400px] md:shrink-0 flex flex-col z-20 absolute md:relative top-0 right-0 bottom-0 h-full transition-transform duration-300 transform md:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        {...drawerTouchHandlers}
      >
        <ScrollHandoffContainer className="flex-1">
          {mobileMenuOpen && (
            <div className="nav-chrome-mobile-drawer-header md:hidden sticky top-0 z-20 flex items-center justify-between gap-3 px-4 py-3">
              <button
                onClick={closeMobileMenu}
                className="nav-chrome-mobile-drawer-back-button flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
              >
                <ChevronLeft size={14} />
                Back to preview
              </button>
              <span className="text-sm font-semibold text-slate-700">
                Customize
              </span>
            </div>
          )}
          <div className="p-6 pt-4 md:pt-6">
            {activeView === "main" && renderMainMenu()}
            {activeView === "headline" && renderHeadlineEditor()}
            {activeView === "images" && renderImagesEditor()}
            {activeView === "design" && renderDesignEditor()}
            {activeView === "babyDetails" && renderBabyDetailsEditor()}
            {activeView === "momDetails" && renderMomDetailsEditor()}
            {activeView === "hosts" && renderHostsEditor()}
            {activeView === "photos" && renderPhotosEditor()}
            {activeView === "rsvp" && renderRsvpEditor()}
            {activeView === "registry" && renderRegistryEditor()}
          </div>
        </ScrollHandoffContainer>

        <div className="sticky bottom-0 border-t border-[rgba(112,97,168,0.14)] bg-[rgba(246,241,255,0.92)] p-4 backdrop-blur-xl">
          <div className="flex gap-3">
            {editEventId && (
              <button
                onClick={() => router.push(`/event/${editEventId}`)}
                className="flex-1 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg font-medium text-sm tracking-wide transition-colors shadow-sm"
              >
                Cancel
              </button>
            )}
            {!templateEditor && <LegacyTemplateDraftButton category={isBridal ? "bridal-showers" : "baby-showers"} templateId={activeTemplateId} eventId={editEventId} snapshot={{ data, activeView, activeTemplateId, newHost, newRegistry }} disabled={submitting} ready={!_loadingExisting} />}
            <button
              onClick={handlePublish}
              disabled={submitting}
              className={`${
                editEventId ? "flex-1" : "w-full"
              } py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium text-sm tracking-wide transition-colors shadow-lg disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {submitting
                ? editEventId
                  ? "Saving..."
                  : "Publishing..."
                : editEventId
                ? "Save"
                : templateEditor && !templateEditor.authenticated ? "Save and continue" : "Publish"}
            </button>
          </div>
        </div>
      </div>

      {!mobileMenuOpen && (
        <div className="md:hidden fixed bottom-4 right-4 z-30">
          <button
            type="button"
            onClick={openMobileMenu}
            className="nav-chrome-mobile-drawer-trigger flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold"
          >
            <Edit2 size={18} />
            Edit Details
          </button>
        </div>
      )}
    </div>
  );
}
