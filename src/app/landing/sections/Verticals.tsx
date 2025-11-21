"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calendar, Gift, CheckSquare } from "lucide-react";
import { useState } from "react";
import AuthModal from "@/components/auth/AuthModal";
import WeddingWebsitePhones from "@/components/landing/WeddingWebsitePhones";
import BirthdayPhones from "@/components/landing/BirthdayPhones";
import BabyShowerPhones from "@/components/landing/BabyShowerPhones";
import SignupFormsPhones from "@/components/landing/SignupFormsPhones";

export default function Verticals() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");

  const openSignup = () => {
    setAuthMode("signup");
    setAuthModalOpen(true);
  };

  const blocks = [
    {
      id: "weddings",
      title: "Wedding Websites",
      subtitle: (
        <>
          Your big day, <br />
          <span className="italic text-red-500">beautifully</span>
          <br />
          organized.
        </>
      ),
      description:
        "Create a stunning wedding page in minutes. Collect RSVPs, link your registries (Amazon, Target, Zola), and share driving directions—all from one elegant link.",
      color: "from-rose-200 to-pink-100",
      icon: <WeddingIcon className="w-6 h-6 text-rose-600" />,
      image: "/images/wedding-mockup.png", // Placeholder
      orientation: "left",
      buttonText: "Create Wedding Page",
    },
    {
      id: "birthdays",
      title: "Birthdays & Parties",
      subtitle: (
        <>
          Invites that
          <br />
          <span className="italic text-blue-500">actually</span>
          <br />
          get replies.
        </>
      ),
      subtitleClass: "text-[#3b2d25]",
      description:
        "From 1st birthdays to 50th bashes. Snap a photo of the paper invite to digitize it, or pick a theme. Guests RSVP by text, and you get a headcount instantly.",
      color: "from-blue-200 to-cyan-100",
      icon: <Gift className="w-6 h-6 text-blue-600" />,
      image: "/images/birthday-mockup.png", // Placeholder
      orientation: "right",
      buttonText: "Plan a Birthday",
    },
    {
      id: "baby-showers",
      title: "Baby Showers",
      subtitle: (
        <>
          Sprinkle joy, <br />
          <span className="italic text-violet-500">not stress.</span>{" "}
        </>
      ),
      description:
        "Coordinate the perfect shower. Link your registry, track gifts, and share games or diaper raffle info. It’s the easiest way to gather loved ones.",
      color: "from-purple-200 to-violet-100",
      icon: <SparklesIcon className="w-6 h-6 text-purple-600" />,
      image: "/images/shower-mockup.png", // Placeholder
      orientation: "left",
      buttonText: "Host a Shower",
    },
    {
      id: "signup-forms",
      title: "Smart Sign-up Forms",
      subtitle: (
        <>
          Volunteers,
          <br />
          Potlucks,
          <br />
          <span className="italic text-teal-500">and Carpools.</span>{" "}
        </>
      ),
      description:
        "Ditch the reply-all chaos. Create a sign-up list for anything—classroom snacks, team volunteers, or potluck dishes. Slots update in real-time so no one brings double chips.",
      color: "from-emerald-200 to-teal-100",
      icon: <CheckSquare className="w-6 h-6 text-emerald-600" />,
      image: "/images/signup-mockup.png", // Placeholder
      orientation: "right",
      buttonText: "Create Sign-up Sheet",
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 space-y-32">
        {blocks.map((block) => (
          <div
            key={block.id}
            className={`flex flex-col lg:flex-row items-center gap-16 ${
              block.orientation === "right" ? "lg:flex-row-reverse" : ""
            }`}
          >
            {/* Text Side */}
            <div className="flex-1 space-y-6">
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-900 text-xs font-semibold tracking-wide uppercase`}
              >
                {block.icon}
                <span>{block.title}</span>
              </div>

              <h2
                className={`text-4xl md:text-5xl font-bold tracking-tight ${
                  block.subtitleClass ?? "text-gray-900"
                }`}
              >
                {block.subtitle}
              </h2>

              <p className="text-lg text-gray-600 leading-relaxed max-w-lg">
                {block.description}
              </p>

              <button
                onClick={openSignup}
                className="group inline-flex items-center gap-2 text-lg font-semibold text-black hover:gap-3 transition-all"
              >
                {block.buttonText} <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* Visual Side */}
            <div className="flex-1 w-full">
              {block.id === "weddings" ? (
                <WeddingWebsitePhones />
              ) : block.id === "birthdays" ? (
                <BirthdayPhones />
              ) : block.id === "baby-showers" ? (
                <BabyShowerPhones />
              ) : block.id === "signup-forms" ? (
                <SignupFormsPhones />
              ) : (
                <div
                  className={`relative aspect-[4/3] rounded-[2.5rem] bg-gradient-to-br ${block.color} p-8 sm:p-12 overflow-hidden shadow-sm group hover:shadow-md transition-shadow`}
                >
                  {/* Abstract Shapes/Pattern Background */}
                  <div className="absolute inset-0 opacity-40">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl mix-blend-overlay transform translate-x-1/4 -translate-y-1/4" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl mix-blend-overlay transform -translate-x-1/4 translate-y-1/4" />
                  </div>

                  {/* Mockup Card representing the feature */}
                  <div className="relative h-full w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col transform group-hover:-translate-y-2 transition-transform duration-500">
                    {/* Fake Header */}
                    <div className="h-14 border-b border-gray-100 flex items-center px-6 justify-between bg-white/50 backdrop-blur-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-400" />
                        <div className="w-3 h-3 rounded-full bg-amber-400" />
                        <div className="w-3 h-3 rounded-full bg-green-400" />
                      </div>
                      <div className="h-2 w-20 bg-gray-100 rounded-full" />
                    </div>

                    {/* Fake Content Body */}
                    <div className="flex-1 p-6 space-y-4 bg-gray-50/50">
                      <div className="h-8 w-3/4 bg-gray-200 rounded-lg animate-pulse" />
                      <div className="h-4 w-1/2 bg-gray-100 rounded-lg" />

                      <div className="grid grid-cols-3 gap-3 mt-4">
                        <div className="h-24 bg-white rounded-xl border border-gray-100 shadow-sm" />
                        <div className="h-24 bg-white rounded-xl border border-gray-100 shadow-sm" />
                        <div className="h-24 bg-white rounded-xl border border-gray-100 shadow-sm" />
                      </div>

                      {/* Specific UI hint based on type */}
                      {block.id === "signup-forms" && (
                        <div className="space-y-2 mt-4">
                          {[1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100"
                            >
                              <div className="w-5 h-5 rounded border border-gray-300" />
                              <div className="h-2 w-24 bg-gray-100 rounded" />
                              <div className="ml-auto h-6 w-6 rounded-full bg-gray-100" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Button Mock */}
                    <div className="p-4 border-t border-gray-100 bg-white">
                      <div className="w-full h-10 bg-black rounded-lg opacity-10" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
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

// Helper for the Sparkles icon which isn't standard in all Lucide versions or might conflict
function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M9 5H5" />
      <path d="M19 18v4" />
      <path d="M15 20h4" />
    </svg>
  );
}

// Wedding icon component
function WeddingIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 60 60"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      fill="currentColor"
      className={className}
    >
      <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
      <g
        id="SVGRepo_tracerCarrier"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></g>
      <g id="SVGRepo_iconCarrier">
        <g
          id="colored"
          stroke="none"
          strokeWidth="1"
          fill="none"
          fillRule="evenodd"
        >
          <g
            id="Holidays"
            transform="translate(5.000000, 3.000000)"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <g id="Wedding" transform="translate(0.000000, 4.000000)">
              <path
                d="M18.1327868,0.932322573 C15.5547756,1.92192834 14.5880122,5.65000968 15.9734603,9.25922531 C17.3573726,12.8644401 23,15.5000002 23,15.5000002 C23,15.5000002 28.9253523,12.8644401 30.3092646,9.25922531 C31.6947127,5.65000968 30.7279493,1.92192834 28.1499381,0.932322573 C26.5272972,0.30944908 24.653089,0.919921664 23.1413624,2.35789076 C23.1413624,2.35789076 19.7554277,0.30944908 18.1327868,0.932322573 Z"
                id="Oval-1690"
                fill="currentColor"
              ></path>
              <path
                d="M26.9244035,46.8154782 C29.294794,48.2040416 32.054444,49 35,49 C43.836556,49 51,41.836556 51,33 C51,24.163444 43.836556,17 35,17 C26.163444,17 19,24.163444 19,33 C19,36.2290072 19.9565195,39.2346073 21.6016685,41.7489103"
                id="Oval-1690"
              ></path>
              <path
                d="M20.1652501,20.1484669 C18.4248387,19.409055 16.5101893,19 14.5,19 C6.49187113,19 0,25.4918711 0,33.5 C0,41.5081289 6.49187113,48 14.5,48 C22.5081289,48 29,41.5081289 29,33.5 C29,30.1794472 27.8838346,27.1195888 26.0062229,24.675144"
                id="Oval-1690"
              ></path>
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
}
