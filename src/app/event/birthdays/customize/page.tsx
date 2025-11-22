// @ts-nocheck
"use client";

import React, { useRef, useState, useCallback } from "react";
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
  Menu,
  Cake,
  Calendar as CalendarIcon,
} from "lucide-react";
import {
  type BirthdayTemplateDefinition,
  birthdayTemplateCatalog,
} from "@/components/event-create/BirthdayTemplateGallery";

function getTemplateById(id?: string | null): BirthdayTemplateDefinition {
  if (!id) return birthdayTemplateCatalog[0];
  return (
    birthdayTemplateCatalog.find((template) => template.id === id) ??
    birthdayTemplateCatalog[0]
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
    id: "party_pop",
    name: "Party Pop",
    category: "Bold & Playful",
    bg: "bg-[#fff1f2]",
    text: "text-[#881337]",
    accent: "text-[#e11d48]",
    previewColor: "bg-[#ffe4e6]",
  },
  {
    id: "candy_dreams",
    name: "Candy Dreams",
    category: "Sweet & Whimsical",
    bg: "bg-[#fdf2f8]",
    text: "text-[#831843]",
    accent: "text-[#ec4899]",
    previewColor: "bg-[#fce7f3]",
  },
  {
    id: "rainbow_bash",
    name: "Rainbow Bash",
    category: "Vibrant & Energetic",
    bg: "bg-gradient-to-br from-pink-100 via-yellow-100 to-blue-100",
    text: "text-slate-900",
    accent: "text-purple-600",
    previewColor: "bg-gradient-to-br from-pink-200 via-yellow-200 to-blue-200",
  },
  {
    id: "playful_pals",
    name: "Playful Pals",
    category: "Casual & Friendly",
    bg: "bg-[#f0fdf4]",
    text: "text-[#1e293b]",
    accent: "text-[#10b981]",
    previewColor: "bg-[#d1fae5]",
  },
  {
    id: "birthday_burst",
    name: "Birthday Burst",
    category: "Relaxed & Cheerful",
    bg: "bg-[#fef3c7]",
    text: "text-[#78350f]",
    accent: "text-[#f59e0b]",
    previewColor: "bg-[#fde68a]",
  },
  {
    id: "sweet_celebration",
    name: "Sweet Celebration",
    category: "Flowing Handwriting",
    bg: "bg-[#fdf4ff]",
    text: "text-[#581c87]",
    accent: "text-[#a855f7]",
    previewColor: "bg-[#f3e8ff]",
  },
  {
    id: "super_star",
    name: "Super Star",
    category: "Elegant Flowing",
    bg: "bg-[#1e1b4b]",
    text: "text-white",
    accent: "text-[#fbbf24]",
    previewColor: "bg-[#312e81]",
  },
  {
    id: "happy_dance",
    name: "Happy Dance",
    category: "Lively Bouncing",
    bg: "bg-[#fef2f2]",
    text: "text-[#991b1b]",
    accent: "text-[#ef4444]",
    previewColor: "bg-[#fee2e2]",
  },
  {
    id: "magic_sparkle",
    name: "Magic Sparkle",
    category: "Charming Handwriting",
    bg: "bg-[#f0f9ff]",
    text: "text-[#0c4a6e]",
    accent: "text-[#0ea5e9]",
    previewColor: "bg-[#bae6fd]",
  },
  {
    id: "celebration_time",
    name: "Celebration Time",
    category: "Playful & Elegant",
    bg: "bg-[#fff7ed]",
    text: "text-[#9a3412]",
    accent: "text-[#f97316]",
    previewColor: "bg-[#ffedd5]",
  },
  {
    id: "fun_fiesta",
    name: "Fun Fiesta",
    category: "Bold & Dynamic",
    bg: "bg-[#ecfdf5]",
    text: "text-[#064e3b]",
    accent: "text-[#10b981]",
    previewColor: "bg-[#a7f3d0]",
  },
  {
    id: "joyful_jamboree",
    name: "Joyful Jamboree",
    category: "Clean & Elegant",
    bg: "bg-white",
    text: "text-slate-900",
    accent: "text-indigo-600",
    previewColor: "bg-indigo-50",
  },
  {
    id: "whimsical_wonder",
    name: "Whimsical Wonder",
    category: "Flowing Decorative",
    bg: "bg-[#fdf2f8]",
    text: "text-[#831843]",
    accent: "text-[#db2777]",
    previewColor: "bg-[#fbcfe8]",
  },
  {
    id: "cheerful_chaos",
    name: "Cheerful Chaos",
    category: "Loose & Stylish",
    bg: "bg-[#fefce8]",
    text: "text-[#713f12]",
    accent: "text-[#eab308]",
    previewColor: "bg-[#fef9c3]",
  },
  {
    id: "party_parade",
    name: "Party Parade",
    category: "Flowing Brush",
    bg: "bg-[#eff6ff]",
    text: "text-[#1e3a8a]",
    accent: "text-[#3b82f6]",
    previewColor: "bg-[#dbeafe]",
  },
  {
    id: "birthday_bliss",
    name: "Birthday Bliss",
    category: "Casual Vintage",
    bg: "bg-[#fffbeb]",
    text: "text-[#78350f]",
    accent: "text-[#f59e0b]",
    previewColor: "bg-[#fef3c7]",
  },
  {
    id: "sparkle_splash",
    name: "Sparkle Splash",
    category: "Elegant Calligraphic",
    bg: "bg-[#f8fafc]",
    text: "text-[#0f172a]",
    accent: "text-[#64748b]",
    previewColor: "bg-slate-100",
  },
  {
    id: "celebration_craze",
    name: "Celebration Craze",
    category: "Classic Cursive",
    bg: "bg-[#fdfbf7]",
    text: "text-[#451a03]",
    accent: "text-[#92400e]",
    previewColor: "bg-[#fef3c7]",
  },
  {
    id: "happy_hooray",
    name: "Happy Hooray",
    category: "Refined Thin",
    bg: "bg-white",
    text: "text-slate-800",
    accent: "text-slate-600",
    previewColor: "bg-gray-50",
  },
  {
    id: "party_palooza",
    name: "Party Palooza",
    category: "Vintage Flat Nib",
    bg: "bg-[#fff7ed]",
    text: "text-[#7c2d12]",
    accent: "text-[#ea580c]",
    previewColor: "bg-[#ffedd5]",
  },
  {
    id: "birthday_bonanza",
    name: "Birthday Bonanza",
    category: "Decorative Bold",
    bg: "bg-[#fef2f2]",
    text: "text-[#991b1b]",
    accent: "text-[#dc2626]",
    previewColor: "bg-[#fee2e2]",
  },
  {
    id: "sweet_surprise",
    name: "Sweet Surprise",
    category: "Delicate Cursive",
    bg: "bg-[#fdf4ff]",
    text: "text-[#6b21a8]",
    accent: "text-[#9333ea]",
    previewColor: "bg-[#e9d5ff]",
  },
  {
    id: "party_perfect",
    name: "Party Perfect",
    category: "Relaxed Handwritten",
    bg: "bg-[#f0fdf4]",
    text: "text-[#14532d]",
    accent: "text-[#22c55e]",
    previewColor: "bg-[#bbf7d0]",
  },
  {
    id: "birthday_bash",
    name: "Birthday Bash",
    category: "Ornate & Formal",
    bg: "bg-[#1e293b]",
    text: "text-white",
    accent: "text-[#fbbf24]",
    previewColor: "bg-[#334155]",
  },
];

const INITIAL_DATA = {
  childName: "Emma",
  age: 5,
  date: (() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().split("T")[0];
  })(),
  time: "14:00",
  city: "Chicago",
  state: "IL",
  address: "123 Main Street",
  venue: "Fun Zone Playground",
  partyDetails: {
    theme: "Princess Party",
    activities:
      "Face painting, bouncy castle, magic show, piñata, arts & crafts",
    notes:
      "Join us for an amazing birthday celebration! We'll have games, cake, and lots of fun activities. Can't wait to celebrate with you!",
  },
  hosts: [
    { id: 1, name: "Sarah & Michael", role: "Parents" },
    { id: 2, name: "Grandma Linda", role: "Grandmother" },
  ],
  theme: {
    font: "playfair",
    fontSize: "medium",
    themeId: "rainbow_bash",
  },
  images: {
    hero: null,
    headlineBg: null,
  },
  registries: [
    {
      id: 1,
      label: "Amazon Wishlist",
      url: "https://www.amazon.com/wishlist/emma-5th-birthday",
    },
    {
      id: 2,
      label: "Target Wishlist",
      url: "https://www.target.com/wishlist/emma-party",
    },
  ],
  rsvp: {
    isEnabled: true,
    deadline: (() => {
      const date = new Date();
      date.setDate(date.getDate() + 14);
      return date.toISOString().split("T")[0];
    })(),
  },
  gallery: [
    {
      id: 1,
      url: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=800",
      caption: "Last year's party",
    },
    {
      id: 2,
      url: "https://images.unsplash.com/photo-1511988617509-a57c8a288659?w=800",
      caption: "Birthday cake",
    },
    {
      id: 3,
      url: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800",
      caption: "Party decorations",
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

export default function BirthdayTemplateCustomizePage() {
  const search = useSearchParams();
  const router = useRouter();
  const defaultDate = search?.get("d") ?? undefined;
  const editEventId = search?.get("edit") ?? undefined;
  const templateId = search?.get("templateId");

  const template = getTemplateById(templateId);

  const [activeView, setActiveView] = useState("main");
  const [data, setData] = useState(INITIAL_DATA);
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [designOpen, setDesignOpen] = useState(true);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const updateData = (field, value) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const updateTheme = (field, value) => {
    setData((prev) => ({
      ...prev,
      theme: { ...prev.theme, [field]: value },
    }));
  };

  const updatePartyDetails = (field, value) => {
    setData((prev) => ({
      ...prev,
      partyDetails: { ...prev.partyDetails, [field]: value },
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

  const heroImageSrc =
    template?.heroImageName &&
    typeof template.heroImageName === "string" &&
    template.heroImageName.trim()
      ? `/templates/birthdays/${template.heroImageName}`
      : "/templates/birthdays/rainbow-bash.webp";

  const getAgeSuffix = (age: number) => {
    if (age === 1) return "st";
    if (age === 2) return "nd";
    if (age === 3) return "rd";
    return "th";
  };

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

      const locationParts = [data.venue, data.city, data.state].filter(Boolean);
      const location =
        locationParts.length > 0 ? locationParts.join(", ") : undefined;

      const payload: any = {
        title: `${data.childName}'s ${data.age}${getAgeSuffix(
          data.age
        )} Birthday`,
        data: {
          category: "Birthdays",
          createdVia: "template",
          createdManually: true,
          startISO,
          endISO,
          location,
          venue: data.venue || undefined,
          description: data.partyDetails.notes || undefined,
          rsvp: data.rsvp.isEnabled
            ? data.rsvp.deadline || undefined
            : undefined,
          numberOfGuests: 0,
          templateId: template.id,
          // Customization data
          birthdayName: data.childName,
          age: data.age,
          partyDetails: data.partyDetails,
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

  const MainMenu = () => (
    <div className="space-y-4 animate-fade-in pb-8">
      <div className="mb-6">
        <h2 className="text-2xl font-serif font-semibold text-slate-800 mb-1">
          Add your details
        </h2>
        <p className="text-slate-500 text-sm">
          Customize every aspect of your birthday party website.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <MenuCard
          title="Headline"
          icon={<Type size={18} />}
          desc="Child's name, age, date, location."
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
          title="Party Details"
          icon={<Cake size={18} />}
          desc="Theme, activities, notes."
          onClick={() => setActiveView("partyDetails")}
        />
        <MenuCard
          title="Hosts"
          icon={<Users size={18} />}
          desc="Who's organizing the party."
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
          title="Wishlist"
          icon={<Gift size={18} />}
          desc="Gift wishlist links."
          onClick={() => setActiveView("registry")}
        />
      </div>
    </div>
  );

  const HeadlineEditor = () => (
    <EditorLayout title="Headline" onBack={() => setActiveView("main")}>
      <div className="space-y-6">
        <InputGroup
          label="Child's Name"
          value={data.childName}
          onChange={(v) => updateData("childName", v)}
          placeholder="Child's name"
        />
        <InputGroup
          label="Age"
          type="number"
          value={data.age}
          onChange={(v) => updateData("age", Number.parseInt(v, 10) || 0)}
          placeholder="5"
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
          label="Venue"
          value={data.venue}
          onChange={(v) => updateData("venue", v)}
          placeholder="Party venue (optional)"
        />
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

  const ImagesEditor = () => (
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

  const DesignEditor = () => (
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

  const PartyDetailsEditor = () => (
    <EditorLayout title="Party Details" onBack={() => setActiveView("main")}>
      <div className="space-y-4">
        <InputGroup
          label="Party Theme"
          value={data.partyDetails.theme}
          onChange={(v) => updatePartyDetails("theme", v)}
          placeholder="e.g. Princess, Superhero, Unicorn"
        />
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wider">
            Activities
          </label>
          <textarea
            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[100px] text-slate-700 text-sm"
            value={data.partyDetails.activities}
            onChange={(e) => updatePartyDetails("activities", e.target.value)}
            placeholder="Games, activities, special events..."
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wider">
            Notes
          </label>
          <textarea
            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[200px] text-slate-700 text-sm"
            value={data.partyDetails.notes}
            onChange={(e) => updatePartyDetails("notes", e.target.value)}
            placeholder="Share details about the party..."
          />
        </div>
      </div>
    </EditorLayout>
  );

  const HostsEditor = () => {
    const [newHost, setNewHost] = useState({ name: "", role: "" });

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
              placeholder="e.g. Parents, Grandparents"
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

  const PhotosEditor = () => (
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

  const RSVPEditor = () => (
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

  const RegistryEditor = () => {
    const [newRegistry, setNewRegistry] = useState({ label: "", url: "" });

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
      <EditorLayout title="Wishlist" onBack={() => setActiveView("main")}>
        <div className="space-y-6">
          <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase">
              Add Wishlist
            </h4>
            <InputGroup
              label="Wishlist Name"
              value={newRegistry.label}
              onChange={(v) => setNewRegistry({ ...newRegistry, label: v })}
              placeholder="e.g. Amazon, Target, Toys R Us"
            />
            <InputGroup
              label="Wishlist URL"
              type="url"
              value={newRegistry.url}
              onChange={(v) => setNewRegistry({ ...newRegistry, url: v })}
              placeholder="https://www.example.com/wishlist"
            />
            <button
              onClick={addRegistry}
              className="w-full py-2 bg-indigo-600 text-white text-sm rounded-md font-medium hover:bg-indigo-700"
            >
              Add Wishlist
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
                    {registry.label || "Wishlist"}
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
    <div className="flex h-screen w-full bg-slate-100 overflow-hidden font-sans text-slate-900">
      <div
        ref={previewRef}
        className="flex-1 relative overflow-y-auto scrollbar-hide bg-[#f0f2f5] flex justify-center"
      >
        <div className="w-full max-w-[100%] md:max-w-[calc(100%-40px)] xl:max-w-[1000px] my-4 md:my-8 transition-all duration-500 ease-in-out">
          <div
            key={`preview-${data.theme.themeId}`}
            className={`min-h-[800px] w-full shadow-2xl md:rounded-xl overflow-hidden flex flex-col ${currentTheme.bg} ${currentFont.preview} transition-all duration-500 relative z-0`}
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
                    style={{ fontFamily: currentFont.preview }}
                  >
                    {data.childName}'s {data.age}
                    {getAgeSuffix(data.age)} Birthday
                    <span className="inline-block ml-2 opacity-0 group-hover:opacity-50 transition-opacity">
                      <Edit2 size={24} />
                    </span>
                  </h1>
                  <div
                    className={`flex items-center gap-4 ${currentSize.body} font-medium opacity-90 tracking-wide`}
                  >
                    <span>
                      {new Date(data.date).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-current opacity-50"></span>
                    <span>{data.time}</span>
                    {(data.city || data.state) && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-current opacity-50"></span>
                        <span>
                          {[data.venue, data.city, data.state]
                            .filter(Boolean)
                            .join(", ")}
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
                  <h2 className={`text-2xl mb-6 ${currentTheme.accent}`}>
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

              {(data.address || data.venue) && (
                <section className="text-center py-12 border-t border-white/10">
                  <h2 className={`text-2xl mb-4 ${currentTheme.accent}`}>
                    Location
                  </h2>
                  {data.venue && (
                    <div className="font-semibold text-lg mb-2">
                      {data.venue}
                    </div>
                  )}
                  {(data.address || data.city || data.state) && (
                    <div className="opacity-80">
                      {[data.address, data.city, data.state]
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                  )}
                </section>
              )}

              {data.partyDetails.notes && (
                <section className="max-w-2xl mx-auto text-center p-6 md:p-8">
                  <h2
                    className={`${currentSize.h2} mb-4 ${currentTheme.accent}`}
                  >
                    Party Details
                  </h2>
                  <p
                    className={`${currentSize.body} leading-relaxed opacity-90 whitespace-pre-wrap`}
                  >
                    {data.partyDetails.notes}
                  </p>
                  {data.partyDetails.theme && (
                    <div className="mt-4">
                      <span
                        className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${currentTheme.accent} bg-white/10`}
                      >
                        Theme: {data.partyDetails.theme}
                      </span>
                    </div>
                  )}
                  {data.partyDetails.activities && (
                    <div className="mt-4 text-left">
                      <h3 className="font-semibold mb-2">Activities:</h3>
                      <p className="opacity-80 whitespace-pre-wrap">
                        {data.partyDetails.activities}
                      </p>
                    </div>
                  )}
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
                  <h2 className={`text-2xl mb-6 ${currentTheme.accent}`}>
                    Wishlist
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
                          {registry.label || "Wishlist"}
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
                            Attending?
                          </label>
                          <div className="grid grid-cols-2 gap-4">
                            <label className="relative cursor-pointer group">
                              <input
                                type="radio"
                                name="attending"
                                className="peer sr-only"
                                defaultChecked
                              />
                              <div className="p-6 rounded-xl border-2 border-white/20 bg-white/5 hover:bg-white/10 transition-all flex flex-col items-center gap-3 peer-checked:border-current peer-checked:bg-white/20">
                                <div className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center">
                                  <div className="w-5 h-5 rounded-full bg-current opacity-0 peer-checked:opacity-100 transition-opacity" />
                                </div>
                                <span className="font-semibold">
                                  Joyfully Accept
                                </span>
                              </div>
                            </label>
                            <label className="relative cursor-pointer group">
                              <input
                                type="radio"
                                name="attending"
                                className="peer sr-only"
                              />
                              <div className="p-6 rounded-xl border-2 border-white/20 bg-white/5 hover:bg-white/10 transition-all flex flex-col items-center gap-3 peer-checked:border-current peer-checked:bg-white/20">
                                <div className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center">
                                  <div className="w-5 h-5 rounded-full bg-current opacity-0 peer-checked:opacity-100 transition-opacity" />
                                </div>
                                <span className="font-semibold">
                                  Regretfully Decline
                                </span>
                              </div>
                            </label>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRsvpSubmitted(true);
                          }}
                          className="w-full py-4 mt-2 bg-white text-slate-900 font-bold uppercase tracking-widest text-sm rounded-lg hover:bg-slate-200 transition-colors shadow-lg"
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
                  Powered by{" "}
                  <span className="font-semibold opacity-80">Envitefy</span>.
                  Create. Share. Enjoy
                </p>
              </footer>
            </div>
          </div>
        </div>
      </div>

      <div
        className="w-full md:w-[400px] bg-white border-l border-slate-200 flex flex-col shadow-2xl z-20 absolute md:relative h-full transition-transform duration-300 transform md:translate-x-0"
        style={{ transform: `translateX(${mobileMenuOpen ? "0" : ""})` }}
      >
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {activeView === "main" && <MainMenu />}
            {activeView === "headline" && <HeadlineEditor />}
            {activeView === "images" && <ImagesEditor />}
            {activeView === "design" && <DesignEditor />}
            {activeView === "partyDetails" && <PartyDetailsEditor />}
            {activeView === "hosts" && <HostsEditor />}
            {activeView === "photos" && <PhotosEditor />}
            {activeView === "rsvp" && <RSVPEditor />}
            {activeView === "registry" && <RegistryEditor />}
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
    </div>
  );
}
