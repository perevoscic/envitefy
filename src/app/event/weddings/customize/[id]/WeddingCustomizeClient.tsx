"use client";

import React, { useMemo, useState } from "react";
import {
  Calendar as CalendarIcon,
  CheckSquare,
  Coffee,
  Gift,
  Heart,
  Image as ImageIcon,
  MapPin,
  Palette,
  Type,
  Users,
} from "lucide-react";
import DesignThemes from "./_components/DesignThemes";
import WeddingRenderer from "./_components/WeddingRenderer";

type WeddingCustomizeClientProps = {
  event: any;
  template: any;
};

const MENU_ITEMS = [
  { key: "headline", title: "Headline", icon: <Type size={18} />, desc: "Names, date, location." },
  { key: "design", title: "Design", icon: <Palette size={18} />, desc: "Theme, fonts, colors." },
  { key: "images", title: "Images", icon: <ImageIcon size={18} />, desc: "Hero & background photos." },
  { key: "schedule", title: "Schedule", icon: <CalendarIcon size={18} />, desc: "Events, times, and locations." },
  { key: "story", title: "Our Story", icon: <Heart size={18} />, desc: "How you met." },
  { key: "party", title: "Wedding Party", icon: <Users size={18} />, desc: "VIPs and roles." },
  { key: "travel", title: "Travel", icon: <MapPin size={18} />, desc: "Hotels, shuttles & airports." },
  { key: "thingsToDo", title: "Things To Do", icon: <Coffee size={18} />, desc: "Local recommendations." },
  { key: "photos", title: "Photos", icon: <ImageIcon size={18} />, desc: "Photo gallery." },
  { key: "rsvp", title: "RSVP", icon: <CheckSquare size={18} />, desc: "RSVP settings." },
  { key: "registry", title: "Registry", icon: <Gift size={18} />, desc: "Gift registries." },
];

export default function WeddingCustomizeClient({ event, template }: WeddingCustomizeClientProps) {
  const [activeView, setActiveView] = useState<string>("main");
  const [activeDesignView, setActiveDesignView] = useState<string>("themes");

  const eventPreview = useMemo(
    () => ({
      ...event,
      title: event?.title || `${event?.partner1 || "Partner 1"} & ${event?.partner2 || "Partner 2"}`,
    }),
    [event]
  );

  const renderPlaceholder = (title: string) => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveView("main")}
          className="text-sm text-slate-500 hover:text-slate-800 transition"
        >
          ← Back
        </button>
        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      </div>
      <p className="text-sm text-slate-600">
        Customize your {title.toLowerCase()} here. Theme selection lives under Design → Themes.
      </p>
    </div>
  );

  const renderDesignView = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveView("main")}
          className="text-sm text-slate-500 hover:text-slate-800 transition"
        >
          ← Back
        </button>
        <h3 className="text-lg font-semibold text-slate-800">Design</h3>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveDesignView("themes")}
          className={`px-3 py-2 text-sm rounded-t-md ${
            activeDesignView === "themes"
              ? "bg-white border border-slate-200 border-b-white font-medium"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Themes
        </button>
      </div>

      {activeDesignView === "themes" && <DesignThemes event={event} />}
    </div>
  );

  return (
    <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6">
      <div className="space-y-4">
        <WeddingRenderer template={template} event={eventPreview} />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
        <div className="mb-4">
          <h2 className="text-2xl font-serif font-semibold text-slate-800 mb-1">
            Add your details
          </h2>
          <p className="text-slate-500 text-sm">
            Customize every aspect of your wedding website.
          </p>
        </div>

        {activeView === "main" && (
          <div className="grid grid-cols-1 gap-3 animate-fade-in pb-4">
            {MENU_ITEMS.map((item) => (
              <MenuCard
                key={item.key}
                title={item.title}
                icon={item.icon}
                desc={item.desc}
                onClick={() => setActiveView(item.key)}
              />
            ))}
          </div>
        )}

        {activeView === "design" && renderDesignView()}
        {activeView === "headline" && renderPlaceholder("Headline")}
        {activeView === "images" && renderPlaceholder("Images")}
        {activeView === "schedule" && renderPlaceholder("Schedule")}
        {activeView === "story" && renderPlaceholder("Our Story")}
        {activeView === "party" && renderPlaceholder("Wedding Party")}
        {activeView === "travel" && renderPlaceholder("Travel")}
        {activeView === "thingsToDo" && renderPlaceholder("Things To Do")}
        {activeView === "photos" && renderPlaceholder("Photos")}
        {activeView === "rsvp" && renderPlaceholder("RSVP")}
        {activeView === "registry" && renderPlaceholder("Registry")}
      </div>
    </div>
  );
}

function MenuCard({
  title,
  icon,
  desc,
  onClick,
}: {
  title: string;
  icon: React.ReactNode;
  desc: string;
  onClick: () => void;
}) {
  return (
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
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
