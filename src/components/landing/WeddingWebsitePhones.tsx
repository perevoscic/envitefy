"use client";

import { Heart, MapPin, Gift, Calendar } from "lucide-react";

// Reusable Wedding Website Phone Component
const WeddingPhone = ({
  className,
  view,
  coupleName,
  date,
  gradient,
}: {
  className?: string;
  view: "home" | "rsvp" | "registry";
  coupleName: string;
  date: string;
  gradient: string;
}) => (
  <div
    className={`relative w-[280px] h-[580px] bg-[#F8F5FF] rounded-[3rem] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.12)] border-[6px] border-[#F8F5FF] ring-1 ring-gray-900/5 overflow-hidden ${className}`}
  >
    {/* Notch */}
    <div className="absolute top-0 inset-x-0 h-7 bg-[#F8F5FF] z-20 flex justify-center">
      <div className="w-32 h-6 bg-black rounded-b-2xl" />
    </div>

    {/* Website Content */}
    <div className="absolute top-7 left-0 right-0 bottom-0 overflow-y-auto bg-white">
      {view === "home" && (
        <>
          {/* Hero Section */}
          <div
            className={`h-48 bg-gradient-to-br ${gradient} relative overflow-hidden`}
          >
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-6 z-10">
              <Heart className="w-8 h-8 mb-2 fill-white" />
              <h1 className="text-2xl font-bold text-center mb-1">
                {coupleName}
              </h1>
              <p className="text-sm opacity-90">{date}</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex gap-2 px-4 py-3 border-b border-gray-100 overflow-x-auto">
            {["Home", "RSVP", "Registry", "Venue"].map((item) => (
              <span
                key={item}
                className={`text-xs px-3 py-1 rounded-full whitespace-nowrap ${
                  item === "Home"
                    ? "bg-rose-100 text-rose-700 font-semibold"
                    : "text-gray-600"
                }`}
              >
                {item}
              </span>
            ))}
          </div>

          {/* Content Sections */}
          <div className="px-4 py-6 pb-24 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-700">
                <Calendar className="w-4 h-4 text-rose-600" />
                <span className="text-sm font-semibold">Save the Date</span>
              </div>
              <p className="text-xs text-gray-600 pl-6">{date}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="w-4 h-4 text-rose-600" />
                <span className="text-sm font-semibold">Venue</span>
              </div>
              <p className="text-xs text-gray-600 pl-6">
                Grand Ballroom, Downtown
              </p>
              <p className="text-xs text-gray-500 pl-6">
                123 Main Street, Chicago, IL 60601
              </p>
            </div>
          </div>

          {/* Fixed RSVP Button at Bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
            <button className="w-full bg-rose-600 text-white text-sm font-semibold py-3 rounded-lg">
              RSVP Now
            </button>
          </div>
        </>
      )}

      {view === "rsvp" && (
        <>
          {/* Header */}
          <div className={`h-32 bg-gradient-to-br ${gradient} relative`}>
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute bottom-4 left-4 right-4 z-10">
              <h2 className="text-xl font-bold text-white mb-1">RSVP</h2>
              <p className="text-xs text-white/90">{coupleName}</p>
            </div>
          </div>

          {/* RSVP Form */}
          <div className="px-4 py-6 space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-2">
                Will you be attending?
              </label>
              <div className="flex gap-2">
                <button className="flex-1 bg-green-50 border-2 border-green-500 text-green-700 text-sm font-semibold py-2 rounded-lg">
                  Yes
                </button>
                <button className="flex-1 bg-gray-50 border-2 border-gray-200 text-gray-600 text-sm font-semibold py-2 rounded-lg">
                  No
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-2">
                Number of guests
              </label>
              <input
                type="number"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="2"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-2">
                Dietary restrictions
              </label>
              <textarea
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm h-20"
                placeholder="Optional..."
              />
            </div>

            <button className="w-full bg-rose-600 text-white text-sm font-semibold py-3 rounded-lg mt-4">
              Submit RSVP
            </button>
          </div>
        </>
      )}

      {view === "registry" && (
        <>
          {/* Header */}
          <div className={`h-32 bg-gradient-to-br ${gradient} relative`}>
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute bottom-4 left-4 right-4 z-10">
              <h2 className="text-xl font-bold text-white mb-1">Registry</h2>
              <p className="text-xs text-white/90">
                Gift ideas for {coupleName}
              </p>
            </div>
          </div>

          {/* Registry Links */}
          <div className="px-4 py-6 space-y-3">
            <div className="flex items-center gap-3 p-4 bg-white border-2 border-gray-100 rounded-xl">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-orange-600 font-bold text-xs">A</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">Amazon</p>
                <p className="text-xs text-gray-500">View registry</p>
              </div>
              <Gift className="w-5 h-5 text-gray-400" />
            </div>

            <div className="flex items-center gap-3 p-4 bg-white border-2 border-gray-100 rounded-xl">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-red-600 font-bold text-xs">T</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">Target</p>
                <p className="text-xs text-gray-500">View registry</p>
              </div>
              <Gift className="w-5 h-5 text-gray-400" />
            </div>

            <div className="flex items-center gap-3 p-4 bg-white border-2 border-gray-100 rounded-xl">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-bold text-xs">Z</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">Zola</p>
                <p className="text-xs text-gray-500">View registry</p>
              </div>
              <Gift className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </>
      )}
    </div>
  </div>
);

export default function WeddingWebsitePhones() {
  return (
    <div className="relative h-[700px] w-full flex items-center justify-center perspective-[2000px]">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-gradient-to-tr from-rose-100/40 via-pink-100/40 to-transparent rounded-full blur-3xl -z-10" />

      {/* Single Phone: Home View (Center) */}
      <div className="relative z-20 transform hover:-translate-y-2 transition-transform duration-500">
        <WeddingPhone
          view="home"
          coupleName="Sarah & James"
          date="June 15, 2026"
          gradient="from-rose-500 to-pink-600"
        />
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-rose-700 text-white text-xs font-bold px-2 py-1 rounded shadow-lg">
          Wedding Page
        </div>
      </div>
    </div>
  );
}
