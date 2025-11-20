"use client";

import Image from "next/image";
import { ArrowRight, Sparkles, Check } from "lucide-react";
import { useState } from "react";
import AuthModal from "@/components/auth/AuthModal";

export default function Hero() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");

  const openSignup = () => {
    setAuthMode("signup");
    setAuthModalOpen(true);
  };

  // Reusable Phone Component
  const Phone = ({
    className,
    app,
    eventTitle,
    time,
    color,
  }: {
    className?: string;
    app: "google" | "apple" | "outlook";
    eventTitle: string;
    time: string;
    color: string;
  }) => (
    <div
      className={`relative w-[280px] h-[580px] bg-white rounded-[3rem] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.12)] border-[6px] border-white ring-1 ring-gray-900/5 overflow-hidden ${className}`}
    >
      {/* Notch */}
      <div className="absolute top-0 inset-x-0 h-7 bg-white z-20 flex justify-center">
        <div className="w-32 h-6 bg-black rounded-b-2xl" />
      </div>

      {/* Status Bar Placeholder */}
      <div className="h-12 w-full bg-white flex justify-between items-center px-6 pt-2 text-[10px] font-bold text-gray-900">
        <span>9:41</span>
        <div className="flex gap-1">
          <div className="w-4 h-2.5 bg-black rounded-[1px]" />
          <div className="w-0.5 h-2.5 bg-black/30 rounded-[1px]" />
        </div>
      </div>

      {/* App Header */}
      <div className={`px-6 pb-4 ${app === "apple" ? "pt-2" : "pt-4"}`}>
        <div className="flex justify-between items-end mb-4">
          <span
            className={`text-2xl font-bold ${
              app === "google"
                ? "text-blue-600"
                : app === "outlook"
                ? "text-blue-700"
                : "text-red-500"
            }`}
          >
            {app === "google"
              ? "Sep"
              : app === "outlook"
              ? "September"
              : "September"}
          </span>
          <span className="text-gray-400 text-sm">2025</span>
        </div>
        {/* Calendar Grid Mockup */}
        <div className="grid grid-cols-7 gap-2 mb-4 text-center text-[10px] text-gray-400 font-medium">
          <span>S</span>
          <span>M</span>
          <span>T</span>
          <span>W</span>
          <span>T</span>
          <span>F</span>
          <span>S</span>
          {Array.from({ length: 7 }).map((_, i) => (
            <span
              key={i}
              className={`py-1 ${
                i === 3 ? `bg-${color}-100 text-${color}-700 rounded-full` : ""
              }`}
            >
              {10 + i}
            </span>
          ))}
        </div>
      </div>

      {/* Event Card */}
      <div className="px-4">
        <div
          className={`p-4 rounded-2xl border-l-4 ${
            app === "google"
              ? "bg-blue-50 border-blue-500"
              : app === "outlook"
              ? "bg-blue-50/50 border-blue-700"
              : "bg-red-50 border-red-500"
          } shadow-sm mb-3 animate-fade-in-up`}
        >
          <div className="text-xs font-semibold opacity-60 mb-1 uppercase tracking-wide">
            {time}
          </div>
          <div className="font-bold text-gray-900 text-lg leading-tight mb-1">
            {eventTitle}
          </div>
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <Check size={10} /> Synced
          </div>
        </div>

        {/* Fake events below */}
        <div className="space-y-3 opacity-40 blur-[0.5px]">
          <div className="h-16 w-full bg-gray-50 rounded-xl" />
          <div className="h-16 w-full bg-gray-50 rounded-xl" />
          <div className="h-16 w-full bg-gray-50 rounded-xl" />
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="absolute bottom-0 inset-x-0 h-16 bg-white border-t border-gray-50 flex justify-around items-center text-gray-300">
        <div className="w-8 h-8 rounded-full bg-gray-100" />
        <div className="w-8 h-8 rounded-full bg-gray-100" />
        <div className="w-8 h-8 rounded-full bg-gray-100" />
      </div>
    </div>
  );

  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
        {/* Text Content */}
        <div className="relative z-10 max-w-2xl lg:max-w-none">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-semibold tracking-wide uppercase mb-8">
            <Sparkles size={12} className="text-blue-500" />
            <span>AI-Powered Event Planning</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 leading-[1.1] mb-6">
            Your calendar, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">
              automagically
            </span>{" "}
            filled.
          </h1>

          <p className="text-xl text-gray-600 leading-relaxed mb-10 max-w-lg">
            Turn messy flyers, screenshots, and invites into real calendar
            events in seconds. No typing required.
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <button
              onClick={openSignup}
              className="group relative px-8 py-4 bg-black text-white rounded-full text-lg font-semibold shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                Start for free{" "}
                <ArrowRight
                  size={18}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>

            <div className="flex items-center gap-4 px-4 py-2">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-white bg-gray-100 overflow-hidden relative"
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300`}
                    />
                  </div>
                ))}
              </div>
              <div className="text-sm font-medium text-gray-600">
                <span className="text-black font-bold">2k+</span> events snapped
              </div>
            </div>
          </div>
        </div>

        {/* Visual Content: The 3 White Phones */}
        <div className="relative h-[600px] w-full flex items-center justify-center perspective-[2000px]">
          {/* Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-gradient-to-tr from-blue-100/40 via-violet-100/40 to-transparent rounded-full blur-3xl -z-10" />

          {/* Phone 1: Outlook (Left, Back) */}
          <div className="absolute left-0 lg:left-8 top-12 transform -rotate-6 scale-90 hover:scale-95 hover:z-20 hover:rotate-0 transition-all duration-500 origin-bottom-right z-10 opacity-90">
            <Phone
              app="outlook"
              eventTitle="Project Sync"
              time="10:00 AM"
              color="blue"
            />
            <div className="absolute -top-4 left-4 bg-blue-700 text-white text-xs font-bold px-2 py-1 rounded shadow-lg">
              Outlook
            </div>
          </div>

          {/* Phone 2: Apple (Right, Back) */}
          <div className="absolute right-0 lg:right-8 top-24 transform rotate-6 scale-90 hover:scale-95 hover:z-20 hover:rotate-0 transition-all duration-500 origin-bottom-left z-10 opacity-90">
            <Phone
              app="apple"
              eventTitle="Alice's Birthday"
              time="2:00 PM"
              color="red"
            />
            <div className="absolute -top-4 right-4 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow-lg">
              Apple Cal
            </div>
          </div>

          {/* Phone 3: Google (Center, Front) */}
          <div className="absolute z-20 top-0 transform hover:-translate-y-2 transition-transform duration-500">
            <Phone
              app="google"
              eventTitle="Soccer Practice"
              time="5:30 PM"
              color="blue"
            />
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded shadow-lg">
              Google Cal
            </div>
          </div>
        </div>
      </div>

      <AuthModal
        open={authModalOpen}
        mode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onModeChange={setAuthMode}
      />
    </section>
  );
}
