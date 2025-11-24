// @ts-nocheck
"use client";

import React, { useRef, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Edit2,
  Heart,
  Users,
  Image as ImageIcon,
  Type,
  Palette,
  CheckSquare,
  Gift,
  Upload,
  Trash2,
  Calendar as CalendarIcon,
  Check,
  X as XIcon,
  Sparkles,
} from "lucide-react";
import {
  type GenderRevealTemplateDefinition,
  genderRevealTemplateCatalog,
} from "@/components/event-create/GenderRevealTemplateGallery";
import { useMobileDrawer } from "@/hooks/useMobileDrawer";

function getTemplateById(id?: string | null): GenderRevealTemplateDefinition {
  if (!id) return genderRevealTemplateCatalog[0];
  return (
    genderRevealTemplateCatalog.find((template) => template.id === id) ??
    genderRevealTemplateCatalog[0]
  );
}

const FONTS = {
  playfair: { name: "Playfair Display", preview: "var(--font-playfair)" },
  montserrat: { name: "Montserrat", preview: "var(--font-montserrat)" },
  poppins: { name: "Poppins", preview: "var(--font-poppins)" },
  dancing: { name: "Dancing Script", preview: "var(--font-dancing)" },
  allura: { name: "Allura", preview: "var(--font-allura)" },
  parisienne: { name: "Parisienne", preview: "var(--font-parisienne)" },
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
    id: "pink_blue",
    name: "Pink & Blue",
    category: "Classic",
    bg: "bg-gradient-to-br from-pink-50 to-blue-50",
    text: "text-slate-900",
    accent: "text-pink-600",
    previewColor: "bg-gradient-to-br from-pink-100 to-blue-100",
  },
  {
    id: "neutral_gold",
    name: "Neutral Gold",
    category: "Elegant",
    bg: "bg-[#fef9e7]",
    text: "text-slate-900",
    accent: "text-amber-700",
    previewColor: "bg-amber-50",
  },
  {
    id: "lavender_dream",
    name: "Lavender Dream",
    category: "Dreamy",
    bg: "bg-[#fdf4ff]",
    text: "text-[#581c87]",
    accent: "text-[#a855f7]",
    previewColor: "bg-[#f3e8ff]",
  },
  {
    id: "mint_peach",
    name: "Mint & Peach",
    category: "Soft",
    bg: "bg-gradient-to-br from-green-50 to-orange-50",
    text: "text-slate-900",
    accent: "text-green-600",
    previewColor: "bg-gradient-to-br from-green-100 to-orange-100",
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
];

const INITIAL_DATA = {
  eventTitle: "Gender Reveal Party",
  parentsName: "Sarah & Michael",
  date: (() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 2);
    return date.toISOString().split("T")[0];
  })(),
  time: "14:00",
  city: "Chicago",
  state: "IL",
  address: "123 Main Street",
  eventDetails: {
    expectingDate: (() => {
      const date = new Date();
      date.setMonth(date.getMonth() + 3);
      return date.toISOString().split("T")[0];
    })(),
    notes:
      "We are so excited to reveal the gender of our little one! Join us for an afternoon of games, delicious treats, and the big reveal. We can't wait to share this special moment with our closest family and friends.",
  },
  hosts: [
    { id: 1, name: "Sarah & Michael", role: "Parents-to-be" },
    { id: 2, name: "Grandma Mary", role: "Grandmother" },
    { id: 3, name: "Aunt Jessica", role: "Aunt" },
  ],
  theme: {
    font: "playfair",
    fontSize: "medium",
    themeId: "pink_blue",
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
      caption: "Gender reveal setup",
    },
    {
      id: 2,
      url: "https://images.unsplash.com/photo-1511988617509-a57c8a288659?w=800",
      caption: "Decorations",
    },
  ],
};

const MenuCard = ({ title, icon, desc, onClick }) => (
  <div
    onClick={onClick}
    className="group bg-white border border-slate-200 rounded-xl p-5 cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all duration-200 flex items-start gap-4"
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
  </div>
);

const EditorLayout = ({ title, onBack, children }) => (
  <div className="animate-fade-in-right">
    <div className="flex items-center mb-6 pb-4 border-b border-slate-100">
      <button
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
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
    />
  </div>
);

export default function GenderRevealTemplateCustomizePage() {
  const search = useSearchParams();
  const router = useRouter();
  const defaultDate = search?.get("d") ?? undefined;
  const editEventId = search?.get("edit") ?? undefined;
  const templateId = search?.get("templateId");

  const template = getTemplateById(templateId);

  const [activeView, setActiveView] = useState("main");
  const [data, setData] = useState(INITIAL_DATA);
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [rsvpAttending, setRsvpAttending] = useState<boolean | null>(null);
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
  const [newHost, setNewHost] = useState({ name: "", role: "" });
  const [newRegistry, setNewRegistry] = useState({ label: "", url: "" });

  const updateData = (field, value) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const updateTheme = (field, value) => {
    setData((prev) => ({
      ...prev,
      theme: { ...prev.theme, [field]: value },
    }));
  };

  const updateEventDetails = (field, value) => {
    setData((prev) => ({
      ...prev,
      eventDetails: { ...prev.eventDetails, [field]: value },
    }));
  };

  const handleImageUpload = (field, e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
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
      url: URL.createObjectURL(file),
    }));
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
  const currentSize = FONT_SIZES[data.theme.fontSize] || FONT_SIZES.medium;
  
  // Detect dark background for title color
  const isDarkBackground = useMemo(() => {
    const bg = currentTheme?.bg?.toLowerCase() ?? "";
    const darkTokens = [
      "black",
      "slate-9",
      "stone-9",
      "neutral-9",
      "gray-9",
      "grey-9",
      "indigo-9",
      "purple-9",
      "violet-9",
      "emerald-9",
      "teal-9",
      "blue-9",
      "navy",
      "midnight",
    ];
    const hasDarkToken = darkTokens.some((token) => bg.includes(token));
    const hasDarkHex = /#0[0-9a-f]{5,}/i.test(bg) || /#1[0-3][0-9a-f]{4}/i.test(bg) || /#2[0-3][0-9a-f]{4}/i.test(bg);
    return hasDarkToken || hasDarkHex;
  }, [currentTheme]);
  
  const titleColor = isDarkBackground ? { color: "#f5e6d3" } : undefined;

  const heroImageSrc = "/templates/baby-showers/moon-back.webp";

  const handlePublish = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      let startISO: string | null = null;
      let endISO: string | null = null;
      if (data.date) {
        const start = new Date(`${data.date}T${data.time || "14:00"}:00`);
        const end = new Date(start);
        end.setHours(end.getHours() + 3);
        startISO = start.toISOString();
        endISO = end.toISOString();
      }

      const location =
        data.city && data.state ? `${data.city}, ${data.state}` : undefined;

      const payload: any = {
        title: data.eventTitle || "Gender Reveal Party",
        data: {
          category: "Gender Reveal",
          createdVia: "template",
          createdManually: true,
          startISO,
          endISO,
          location,
          description: data.eventDetails.notes || undefined,
          rsvp: data.rsvp.isEnabled
            ? data.rsvp.deadline || undefined
            : undefined,
          numberOfGuests: 0,
          templateId: template.id,
          // Customization data
          eventTitle: data.eventTitle,
          parentsName: data.parentsName,
          eventDetails: data.eventDetails,
          hosts: data.hosts,
          theme: data.theme,
          registries: data.registries
            .filter((r) => r.url.trim())
            .map((r) => ({
              label: r.label.trim() || "Registry",
              url: r.url.trim(),
            })),
          customHeroImage: data.images.hero || undefined,
        },
      };

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
        router.push(`/event/${id}${editEventId ? "?updated=1" : "?created=1"}`);
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
  }, [submitting, data, template.id, editEventId, router]);

  // Render helpers instead of nested components so inputs keep focus across state updates.
  const renderMainMenu = () => (
    <div className="space-y-4 animate-fade-in pb-8">
      <div className="mb-6">
        <h2 className="text-2xl font-serif font-semibold text-slate-800 mb-1">
          Add your details
        </h2>
        <p className="text-slate-500 text-sm">
          Customize every aspect of your gender reveal website.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <MenuCard
          title="Headline"
          icon={<Type size={18} />}
          desc="Event title, date, location."
          onClick={() => setActiveView("headline")}
        />
        <MenuCard
          title="Design"
          icon={<Palette size={18} />}
          desc="Theme, fonts, colors."
          onClick={() => setActiveView("design")}
        />
        <MenuCard
          title="Images"
          icon={<ImageIcon size={18} />}
          desc="Hero & background photos."
          onClick={() => setActiveView("images")}
        />
        <MenuCard
          title="Event Details"
          icon={<Sparkles size={18} />}
          desc="Expecting date, notes about the reveal."
          onClick={() => setActiveView("eventDetails")}
        />
        <MenuCard
          title="Hosts"
          icon={<Users size={18} />}
          desc="Who's hosting the reveal."
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
          label="Event Title"
          value={data.eventTitle}
          onChange={(v) => updateData("eventTitle", v)}
          placeholder="Gender Reveal Party"
        />
        <InputGroup
          label="Parents' Names"
          value={data.parentsName}
          onChange={(v) => updateData("parentsName", v)}
          placeholder="Sarah & Michael"
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
        <InputGroup
          label="Address"
          value={data.address}
          onChange={(v) => updateData("address", v)}
          placeholder="Street address (optional)"
        />
        <div className="grid grid-cols-2 gap-4">
          <InputGroup
            label="City"
            value={data.city}
            onChange={(v) => updateData("city", v)}
          />
          <InputGroup
            label="State"
            value={data.state}
            onChange={(v) => updateData("state", v)}
          />
        </div>
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
                    currentTheme.previewColor.split(" ")[0]
                  }`}
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
                  className={`h-12 w-full rounded-md mb-3 ${theme.previewColor} border border-black/5 shadow-inner flex items-center justify-center relative overflow-hidden`}
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
          <div className="relative">
            <select
              value={data.theme.font}
              onChange={(e) => updateTheme("font", e.target.value)}
              className="w-full p-3 bg-white border border-slate-200 rounded-lg appearance-none text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow"
            >
              {Object.entries(FONTS).map(([key, font]) => (
                <option
                  key={key}
                  value={key}
                  style={{ fontFamily: font.preview }}
                >
                  {font.name}
                </option>
              ))}
            </select>
            <ChevronDown
              className="absolute right-3 top-3.5 text-slate-400 pointer-events-none"
              size={16}
            />
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

  const renderEventDetailsEditor = () => (
    <EditorLayout title="Event Details" onBack={() => setActiveView("main")}>
      <div className="space-y-4">
        <InputGroup
          label="Expected Due Date"
          type="date"
          value={data.eventDetails.expectingDate}
          onChange={(v) => updateEventDetails("expectingDate", v)}
        />
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wider">
            About the Reveal
          </label>
          <textarea
            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[200px] text-slate-700 text-sm"
            value={data.eventDetails.notes}
            onChange={(e) => updateEventDetails("notes", e.target.value)}
            placeholder="Share any special details about the gender reveal event..."
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
    <div className="relative flex h-screen w-full bg-slate-100 overflow-hidden font-sans text-slate-900">
      <div
        ref={previewRef}
        {...previewTouchHandlers}
        className="flex-1 relative overflow-y-auto scrollbar-hide bg-[#f0f2f5] flex justify-center"
        style={{
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
        }}
      >
        <div className="w-full max-w-[100%] md:max-w-[calc(100%-40px)] xl:max-w-[1000px] my-4 md:my-8 transition-all duration-500 ease-in-out">
          <div
            className={`min-h-[800px] w-full bg-white shadow-2xl md:rounded-xl overflow-hidden flex flex-col ${currentTheme.bg} ${currentFont.preview} transition-colors duration-500 relative z-0`}
          >
            <div className="relative z-10">
              <div
                className={`p-6 md:p-8 border-b border-white/10 flex justify-between items-start ${currentTheme.text}`}
              >
                <div
                  className="cursor-pointer hover:opacity-80 transition-opacity group"
                  onClick={() => setActiveView("headline")}
                >
                  <h1
                    className={`${currentSize.h1} mb-2 leading-tight`}
                    style={{ fontFamily: currentFont.preview, ...(titleColor || {}) }}
                  >
                    {data.eventTitle}
                    <span className="inline-block ml-2 opacity-0 group-hover:opacity-50 transition-opacity">
                      <Edit2 size={24} />
                    </span>
                  </h1>
                  <div
                    className={`flex flex-col md:flex-row md:items-center gap-2 md:gap-4 ${currentSize.body} font-medium opacity-90 tracking-wide`}
                  >
                    <span>
                      {new Date(data.date).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span className="hidden md:inline-block w-1 h-1 rounded-full bg-current opacity-50"></span>
                    <span>{data.time}</span>
                    {(data.city || data.state) && (
                      <>
                        <span className="hidden md:inline-block w-1 h-1 rounded-full bg-current opacity-50"></span>
                        <span className="md:truncate">
                          {[data.city, data.state].filter(Boolean).join(", ")}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="relative w-full h-64 md:h-96">
                {data.images.hero ? (
                  <img
                    src={data.images.hero}
                    alt="Hero"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Image
                    src={heroImageSrc}
                    alt="Hero"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 1000px"
                  />
                )}
              </div>

              {data.hosts.length > 0 && (
                <section className="text-center py-12 border-t border-white/10">
                  <h2 className={`text-2xl mb-6 ${currentTheme.accent}`} style={titleColor}>
                    Hosted By
                  </h2>
                  <div className="flex flex-wrap justify-center gap-6">
                    {data.hosts.map((host) => (
                      <div key={host.id} className="text-center">
                        <div className="font-semibold text-lg mb-1">
                          {host.name}
                        </div>
                        {host.role && (
                          <div className="text-sm opacity-70">{host.role}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {(data.address || data.city || data.state) && (
                <section className="text-center py-12 border-t border-white/10">
                  <h2 className={`text-2xl mb-4 ${currentTheme.accent}`} style={titleColor}>
                    Location
                  </h2>
                  {(data.address || data.city || data.state) && (
                    <div className="opacity-80">
                      {[data.address, data.city, data.state]
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                  )}
                </section>
              )}

              {data.eventDetails.notes && (
                <section className="max-w-2xl mx-auto text-center p-6 md:p-8">
                  <h2
                    className={`${currentSize.h2} mb-4 ${currentTheme.accent}`}
                    style={titleColor}
                  >
                    About the Reveal
                  </h2>
                  <p
                    className={`${currentSize.body} leading-relaxed opacity-90 whitespace-pre-wrap`}
                  >
                    {data.eventDetails.notes}
                  </p>
                </section>
              )}

              {data.gallery.length > 0 && (
                <section className="py-12 border-t border-white/10">
                  <h2
                    className={`text-2xl mb-6 text-center ${currentTheme.accent}`}
                  >
                    Photo Gallery
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto px-4">
                    {data.gallery.map((img) => (
                      <div key={img.id} className="relative aspect-square">
                        <img
                          src={img.url}
                          alt={img.caption || "Gallery"}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        {img.caption && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2 rounded-b-lg">
                            {img.caption}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {data.registries.length > 0 && (
                <section className="text-center py-12 border-t border-white/10">
                  <h2 className={`text-2xl mb-6 ${currentTheme.accent}`} style={titleColor}>
                    Registry
                  </h2>
                  <div className="flex flex-wrap justify-center gap-4">
                    {data.registries.map((registry) => (
                      <a
                        key={registry.id}
                        href={registry.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-6 py-3 bg-white/10 border border-white/20 rounded-full hover:bg-white/20 transition-colors"
                      >
                        <span className="uppercase tracking-widest text-sm font-semibold">
                          {registry.label || "Registry"}
                        </span>
                      </a>
                    ))}
                  </div>
                </section>
              )}

              {data.rsvp.isEnabled && (
                <section className="max-w-xl mx-auto text-center p-6 md:p-8">
                  <h2
                    className={`${currentSize.h2} mb-6 ${currentTheme.accent}`}
                    style={titleColor}
                  >
                    RSVP
                  </h2>
                  <div className="bg-white/5 border border-white/10 p-8 rounded-xl text-left">
                    {!rsvpSubmitted ? (
                      <div className="space-y-6">
                        <div className="text-center mb-4">
                          <p className="opacity-80">
                            {data.rsvp.deadline
                              ? `Kindly respond by ${new Date(
                                  data.rsvp.deadline
                                ).toLocaleDateString()}`
                              : "Please RSVP"}
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider opacity-70 mb-2">
                            Full Name
                          </label>
                          <input
                            className="w-full p-4 rounded-lg bg-white/10 border border-white/20 focus:border-white/50 outline-none transition-colors text-inherit placeholder:text-inherit/30"
                            placeholder="Guest Name"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider opacity-70 mb-3">
                            Will you be attending?
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <label className="group relative cursor-pointer">
                              <input
                                type="radio"
                                name="gender-rsvp"
                                className="peer sr-only"
                                checked={rsvpAttending === true}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  setRsvpAttending(true);
                                }}
                              />
                              <div className="p-5 rounded-xl border-2 border-white/20 bg-white/10 hover:bg-white/20 transition-all flex items-start gap-3 peer-checked:border-current peer-checked:bg-white/25">
                                <div className="mt-0.5">
                                  <div className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center">
                                    <div className="w-3 h-3 rounded-full bg-current opacity-0 peer-checked:opacity-100 transition-opacity" />
                                  </div>
                                </div>
                                <div className="text-left">
                                  <div className="flex items-center gap-2 font-semibold text-base">
                                    <Check size={18} className="text-current" />
                                    Yes, I'll be there!
                                  </div>
                                  <p className="text-sm opacity-70">
                                    Count us in for the reveal.
                                  </p>
                                </div>
                              </div>
                            </label>
                            <label className="group relative cursor-pointer">
                              <input
                                type="radio"
                                name="gender-rsvp"
                                className="peer sr-only"
                                checked={rsvpAttending === false}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  setRsvpAttending(false);
                                }}
                              />
                              <div className="p-5 rounded-xl border-2 border-white/20 bg-white/10 hover:bg-white/20 transition-all flex items-start gap-3 peer-checked:border-current peer-checked:bg-white/25">
                                <div className="mt-0.5">
                                  <div className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center">
                                    <div className="w-3 h-3 rounded-full bg-current opacity-0 peer-checked:opacity-100 transition-opacity" />
                                  </div>
                                </div>
                                <div className="text-left">
                                  <div className="flex items-center gap-2 font-semibold text-base">
                                    <XIcon size={18} className="text-current" />
                                    Sorry, can't make it
                                  </div>
                                  <p className="text-sm opacity-70">
                                    We’ll be cheering from afar.
                                  </p>
                                </div>
                              </div>
                            </label>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (rsvpAttending !== null) {
                              setRsvpSubmitted(true);
                            }
                          }}
                          disabled={rsvpAttending === null}
                          className={`w-full py-4 mt-2 font-bold uppercase tracking-widest text-sm rounded-lg transition-colors shadow-lg ${
                            rsvpAttending !== null
                              ? "bg-white text-slate-900 hover:bg-slate-200"
                              : "bg-white/20 text-white/50 cursor-not-allowed"
                          }`}
                        >
                          Send RSVP
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="text-4xl mb-4">🎉</div>
                        <h3 className="text-2xl font-serif mb-2">Thank you!</h3>
                        <p className="opacity-70">Your RSVP has been sent.</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRsvpSubmitted(false);
                            setRsvpAttending(null);
                          }}
                          className="text-sm underline mt-6 opacity-50 hover:opacity-100"
                        >
                          Send another response
                        </button>
                      </div>
                    )}
                  </div>
                </section>
              )}

              <footer className="text-center py-8 border-t border-white/10 mt-1">
                <p className="text-sm opacity-60">
                  Powered By Envitefy. Creat. Share. Enjoy.
                </p>
              </footer>
            </div>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-slate-900/50 z-10"
          onClick={closeMobileMenu}
          role="presentation"
        ></div>
      )}

      <div
        className={`w-full md:w-[400px] bg-white border-l border-slate-200 flex flex-col shadow-2xl z-20 absolute md:relative top-0 right-0 bottom-0 h-full transition-transform duration-300 transform md:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        {...drawerTouchHandlers}
      >
        <div
          className="flex-1 overflow-y-auto"
          style={{
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
          }}
        >
          <div className="md:hidden sticky top-0 z-20 flex items-center justify-between bg-white border-b border-slate-100 px-4 py-3 gap-3">
            <button
              onClick={closeMobileMenu}
              className="flex items-center gap-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-full px-3 py-1"
            >
              <ChevronLeft size={14} />
              Back to preview
            </button>
            <span className="text-sm font-semibold text-slate-700">
              Customize
            </span>
          </div>
          <div className="p-6 pt-4 md:pt-6">
            {activeView === "main" && renderMainMenu()}
            {activeView === "headline" && renderHeadlineEditor()}
            {activeView === "images" && renderImagesEditor()}
            {activeView === "design" && renderDesignEditor()}
            {activeView === "eventDetails" && renderEventDetailsEditor()}
            {activeView === "hosts" && renderHostsEditor()}
            {activeView === "photos" && renderPhotosEditor()}
            {activeView === "rsvp" && renderRsvpEditor()}
            {activeView === "registry" && renderRegistryEditor()}
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 sticky bottom-0">
          <button
            onClick={handlePublish}
            disabled={submitting}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium text-sm tracking-wide transition-colors shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Publishing..." : "PREVIEW AND PUBLISH"}
          </button>
        </div>
      </div>

      {!mobileMenuOpen && (
        <div className="md:hidden fixed bottom-4 right-4 z-30">
          <button
            type="button"
            onClick={openMobileMenu}
            className="flex items-center gap-2 rounded-full bg-slate-900 text-white px-4 py-3 text-sm font-semibold shadow-lg"
          >
            <Edit2 size={18} />
            Edit
          </button>
        </div>
      )}
    </div>
  );
}
