"use client";

import Image from "next/image";
import {
  ArrowRight,
  Camera,
  PlayCircle,
  Heart,
  Calendar,
  MapPin,
  Wand2,
  CalendarCheck2,
  Check,
} from "lucide-react";
import { useState } from "react";
import AuthModal from "@/components/auth/AuthModal";

export default function Hero() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");

  const openSignup = () => {
    setAuthMode("signup");
    setAuthModalOpen(true);
  };

  return (
    <section className="relative overflow-hidden bg-white pt-32 pb-24 text-slate-800 lg:pt-44 lg:pb-32">
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="animate-float absolute top-[-12%] left-[-6%] h-[500px] w-[500px] rounded-full bg-green-200/30 blur-3xl" />
        <div className="animate-float-delayed absolute bottom-[8%] right-[-12%] h-[620px] w-[620px] rounded-full bg-purple-200/35 blur-3xl" />
        <div className="absolute top-[40%] right-[18%] h-[320px] w-[320px] rounded-full bg-amber-200/30 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,#fffcf5_0%,#ffffff_45%,#ffffff_100%)]" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:gap-20 lg:px-8">
        {/* Left copy */}
        <div className="max-w-2xl">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            Trusted by 2,000+ planners & parents
          </div>
          <h1 className="mb-6 font-serif text-5xl leading-[1.1] text-slate-900 sm:text-6xl lg:text-7xl">
            Your events, <br />
            <span className="italic text-slate-500">automagically</span> <br />
            organized.
          </h1>
          <p className="mb-10 max-w-xl text-lg leading-relaxed text-slate-600">
            Turn messy flyers, screenshots, and invitations into beautiful
            websites and calendar events in seconds. From funny{" "}
            <span className="font-semibold text-slate-900">birthdays</span> to
            chaotic{" "}
            <span className="font-semibold text-slate-900">weddings</span>. One
            link, one beautiful website, RSVPs and directions for every guest.
          </p>
          <div className="mb-12 flex flex-col gap-4 sm:flex-row">
            <button
              onClick={openSignup}
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-8 py-4 text-base font-medium text-white shadow-xl transition-all duration-300 hover:-translate-y-1 hover:bg-slate-800 hover:shadow-2xl"
            >
              <Camera
                size={18}
                className="transition-transform group-hover:-translate-y-0.5"
              />
              Snap your invite
            </button>
          </div>

          <div className="grid grid-cols-3 gap-6 border-t border-slate-200 pt-8">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 font-serif font-medium text-slate-900">
                <Wand2 size={16} className="text-amber-600" />
                Instant
              </div>
              <p className="text-xs text-slate-500">
                Extracts dates & locations from images.
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 font-serif font-medium text-slate-900">
                <CalendarCheck2 size={16} className="text-amber-600" />
                Syncs
              </div>
              <p className="text-xs text-slate-500">
                Google, Apple, & Outlook ready.
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 font-serif font-medium text-slate-900">
                <Heart size={16} className="text-amber-600" />
                RSVP
              </div>
              <p className="text-xs text-slate-500">
                Guests reply via text or email.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Camera Scanning Visual */}
        <div className="perspective-container relative h-[700px] w-full">
          {/* Background Flyer */}
          <div className="flyer-3d absolute right-0 top-10 z-0 h-96 w-72 origin-center rounded-lg border-8 border-white bg-yellow-50 p-6 shadow-2xl animate-float-delayed lg:right-10">
            <div className="h-full w-full border-4 border-dashed border-yellow-300 bg-white/50 p-4 text-center transition-all duration-500">
              <div className="mb-4 text-5xl">🦖</div>
              <h3 className="mb-2 font-serif text-3xl font-black leading-none text-slate-900">
                LEO&apos;S
                <br />
                DINO
                <br />
                BASH
              </h3>
              <div className="my-4 h-1 w-16 bg-slate-900" />
              <p className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Saturday
              </p>
              <p className="mb-2 text-4xl font-black text-slate-900">12</p>
              <p className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-800">
                July @ 2PM
              </p>
              <p className="text-xs italic text-slate-500">City Park Gazebo</p>
            </div>
          </div>

          {/* Phone (Camera View) */}
          <div className="phone-3d absolute left-0 top-0 z-10 h-[580px] w-[280px] rounded-[40px] border-4 border-slate-800 bg-slate-900 p-3 shadow-2xl animate-float lg:left-16">
            <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[32px] bg-black">
              {/* Camera feed */}
              <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-slate-800">
                <div className="absolute inset-0 bg-yellow-50 opacity-20 blur-md" />
                <div className="animate-flyer-blur relative w-64 scale-[0.65] border-4 border-dashed border-yellow-300 bg-white p-4 text-center shadow-2xl">
                  <div className="text-5xl mb-4">🦖</div>
                  <h3 className="mb-2 font-serif text-3xl font-black leading-none text-slate-900">
                    LEO&apos;S
                    <br />
                    DINO
                    <br />
                    BASH
                  </h3>
                  <div className="my-3 h-1 w-12 bg-slate-900" />
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Saturday
                  </p>
                  <p className="mb-1 text-3xl font-black text-slate-900">12</p>
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-800">
                    July @ 2PM
                  </p>
                  <p className="text-[10px] italic text-slate-500">
                    City Park Gazebo
                  </p>
                </div>
              </div>

              {/* Overlay */}
              <div className="absolute inset-0 z-20">
                <div className="absolute top-1/4 left-1/4 h-8 w-8 border-l-2 border-t-2 border-yellow-400 shadow-sm opacity-60" />
                <div className="absolute top-1/4 right-1/4 h-8 w-8 border-r-2 border-t-2 border-yellow-400 shadow-sm opacity-60" />
                <div className="absolute bottom-1/3 left-1/4 h-8 w-8 border-b-2 border-l-2 border-yellow-400 shadow-sm opacity-60" />
                <div className="absolute bottom-1/3 right-1/4 h-8 w-8 border-b-2 border-r-2 border-yellow-400 shadow-sm opacity-60" />

                <div className="animate-scan-cycle absolute left-0 top-0 h-2 w-full bg-yellow-400/90 blur-[2px] shadow-[0_0_25px_rgba(250,204,21,1)]" />

                <div className="animate-text-cycle absolute left-0 top-12 w-full text-center">
                  <span className="rounded-full bg-black/50 px-3 py-1 text-[10px] font-medium uppercase tracking-wide text-white backdrop-blur-sm">
                    Scanning...
                  </span>
                </div>
              </div>

              {/* Controls */}
              <div className="absolute bottom-0 z-20 flex h-24 w-full items-center justify-center gap-8 bg-black/40 pb-4 backdrop-blur-md">
                <div className="h-10 w-10 rounded-full border border-white/20 bg-black/50" />
                <div className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-full border-4 border-white transition-transform active:scale-95">
                  <div className="h-14 w-14 rounded-full bg-white" />
                </div>
                <div className="h-10 w-10 rounded-full border border-white/20 bg-black/50" />
              </div>

              {/* Success card */}
              <div className="animate-card-pop absolute bottom-0 left-0 z-30 w-full rounded-t-3xl bg-white p-5 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
                <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-slate-200" />

                <div className="mb-4 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-600">
                    <Check size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Event snapped!
                    </h4>
                    <p className="text-xs text-slate-500">Ready to RSVP</p>
                  </div>
                </div>

                <div className="mb-4 space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      What
                    </span>
                    <span className="text-xs font-semibold text-slate-800">
                      Leo&apos;s Dino Bash
                    </span>
                  </div>
                  <div className="h-[1px] w-full bg-slate-200" />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      When
                    </span>
                    <span className="text-xs font-semibold text-slate-800">
                      Jul 12 · 2:00 PM
                    </span>
                  </div>
                </div>

                <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-3 text-xs font-bold text-white transition-colors hover:bg-slate-800">
                  Add to Calendar
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Floating badges */}
          <div
            className="glass-panel absolute top-[20%] right-[-12px] z-30 flex max-w-[220px] items-center gap-3 rounded-xl border border-white/60 bg-white/70 px-4 py-3 shadow-xl backdrop-blur"
            style={{ animation: "float 6s ease-in-out infinite" }}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
              <Check size={16} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400">
                New RSVP
              </p>
              <p className="text-xs font-semibold text-slate-800">
                Aunt Carol is coming!
              </p>
            </div>
          </div>

          <div
            className="glass-panel absolute bottom-[24%] left-[-8px] z-30 flex items-center gap-3 rounded-xl border border-white/60 bg-white/70 px-4 py-3 shadow-xl backdrop-blur"
            style={{ animation: "float 6s ease-in-out 3s infinite" }}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
              <Calendar size={16} className="text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400">
                Synced
              </p>
              <p className="text-xs font-semibold text-slate-800">
                Added to calendar
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Social proof */}
      <div className="relative z-10 mt-16 px-4 sm:px-6 lg:px-8">
        <p className="mb-8 text-center text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
          Works perfectly with
        </p>
        <div className="flex flex-wrap justify-center gap-10 text-slate-800 opacity-70 transition-all duration-500 hover:opacity-100">
          <span className="flex items-center gap-2 text-lg font-bold">
            <Calendar size={18} /> Google Calendar
          </span>
          <span className="flex items-center gap-2 text-lg font-bold">
            <Calendar size={18} /> Apple Calendar
          </span>
          <span className="flex items-center gap-2 text-lg font-bold">
            <Calendar size={18} /> Outlook
          </span>
        </div>
      </div>

      <AuthModal
        open={authModalOpen}
        mode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onModeChange={setAuthMode}
      />

      <style jsx global>{`
        .glass-panel {
          background: rgba(255, 255, 255, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.5);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        .hero-gradient {
          background: radial-gradient(
            circle at 50% 0%,
            #fffcf5 0%,
            #ffffff 100%
          );
        }
        .perspective-container {
          perspective: 1200px;
        }
        .flyer-3d {
          transform: rotateY(10deg) rotateX(5deg) translateZ(-50px);
          box-shadow: -20px 20px 40px rgba(0, 0, 0, 0.1);
        }
        .phone-3d {
          transform: rotateY(-10deg) rotateX(5deg) translateZ(50px);
          box-shadow: 20px 20px 50px rgba(0, 0, 0, 0.2);
          transition: transform 0.3s ease;
        }
        .phone-3d:hover {
          transform: rotateY(-5deg) rotateX(2deg) translateZ(60px) scale(1.02);
        }

        .animate-scan-cycle {
          animation: scanCycle 8s linear infinite;
        }
        .animate-card-pop {
          animation: cardPop 8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .animate-flyer-blur {
          animation: flyerBlur 8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .animate-text-cycle {
          animation: textCycle 8s linear infinite;
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float 6s ease-in-out 3s infinite;
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        @keyframes scanCycle {
          0% {
            top: 5%;
            opacity: 0;
          }
          5% {
            opacity: 1;
          }
          30% {
            top: 95%;
            opacity: 1;
          }
          35% {
            top: 95%;
            opacity: 0;
          }
          100% {
            top: 95%;
            opacity: 0;
          }
        }
        @keyframes cardPop {
          0%,
          35% {
            transform: translateY(110%);
            opacity: 0;
          }
          40%,
          90% {
            transform: translateY(0);
            opacity: 1;
          }
          95%,
          100% {
            transform: translateY(110%);
            opacity: 0;
          }
        }
        @keyframes flyerBlur {
          0%,
          35% {
            filter: blur(0px);
            opacity: 1;
          }
          40%,
          90% {
            filter: blur(6px);
            opacity: 0.7;
          }
          95%,
          100% {
            filter: blur(0px);
            opacity: 1;
          }
        }
        @keyframes textCycle {
          0%,
          35% {
            opacity: 1;
          }
          36%,
          100% {
            opacity: 0;
          }
        }
      `}</style>
    </section>
  );
}
