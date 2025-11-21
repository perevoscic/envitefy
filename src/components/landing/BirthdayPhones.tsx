"use client";

import { Gift, MapPin, Calendar, Cake } from "lucide-react";

// Reusable Birthday Phone Component
const BirthdayPhone = ({
  className,
  birthdayName,
  date,
  gradient,
}: {
  className?: string;
  birthdayName: string;
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
      {/* Hero Section */}
      <div
        className={`h-48 bg-gradient-to-br ${gradient} relative overflow-hidden`}
      >
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-6 z-10">
          <Cake className="w-10 h-10 mb-2 fill-white" />
          <h1 className="text-2xl font-bold text-center mb-1">
            {birthdayName}'s Birthday
          </h1>
          <p className="text-sm opacity-90">{date}</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-2 px-4 py-3 border-b border-gray-100 overflow-x-auto">
        {["Home", "RSVP", "Registry", "Photos"].map((item) => (
          <span
            key={item}
            className={`text-xs px-3 py-1 rounded-full whitespace-nowrap ${
              item === "Home"
                ? "bg-blue-100 text-blue-700 font-semibold"
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
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold">When</span>
          </div>
          <p className="text-xs text-gray-600 pl-6">{date}</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gray-700">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold">Location</span>
          </div>
          <p className="text-xs text-gray-600 pl-6">Party Palace, Main Hall</p>
          <p className="text-xs text-gray-500 pl-6">
            456 Celebration Ave, Los Angeles, CA 90001
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gray-700">
            <Gift className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold">Gifts</span>
          </div>
          <p className="text-xs text-gray-600 pl-6">Registry links available</p>
        </div>
      </div>

      {/* Fixed RSVP Button at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
        <button className="w-full bg-blue-600 text-white text-sm font-semibold py-3 rounded-lg">
          RSVP Now
        </button>
      </div>
    </div>
  </div>
);

export default function BirthdayPhones() {
  return (
    <div className="relative h-[700px] w-full flex items-center justify-center perspective-[2000px]">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-gradient-to-tr from-blue-100/40 via-cyan-100/40 to-transparent rounded-full blur-3xl -z-10" />

      {/* Single Phone: Birthday View (Center) */}
      <div className="relative z-20 transform hover:-translate-y-2 transition-transform duration-500">
        <BirthdayPhone
          birthdayName="Alice"
          date="June 15, 2026 at 2:00 PM"
          gradient="from-blue-500 to-cyan-600"
        />
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-700 text-white text-xs font-bold px-2 py-1 rounded shadow-lg">
          Birthday Page
        </div>
      </div>
    </div>
  );
}
