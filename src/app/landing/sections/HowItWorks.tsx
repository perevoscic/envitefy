import Image from "next/image";
import { Camera, Sparkles, Share2, Zap } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      id: 1,
      title: "Snap",
      subtitle: "No typing needed.",
      description:
        "Take a photo of any flyer, invitation, or schedule. Or just upload a screenshot.",
      icon: <Camera className="w-6 h-6 text-white" />,
      color: "bg-blue-600",
      gradient: "from-blue-600 to-indigo-600",
      visual: (
        <div className="relative w-full h-32 bg-gray-100 rounded-xl overflow-hidden mt-6 border border-gray-200 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
          <div className="absolute inset-0 bg-[url('/flyer.jpg')] bg-cover bg-center opacity-50 blur-sm" />
          <div className="relative z-10 w-12 h-12 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
            <div className="w-8 h-8 border-2 border-white rounded-lg" />
          </div>
        </div>
      ),
    },
    {
      id: 2,
      title: "Extract",
      subtitle: "We do the work.",
      description:
        "We instantly identify the title, date, time, location, and even RSVP details.",
      icon: <Sparkles className="w-6 h-6 text-white" />,
      color: "bg-violet-600",
      gradient: "from-violet-600 to-purple-600",
      visual: (
        <div className="relative w-full h-32 bg-violet-50 rounded-xl overflow-hidden mt-6 border border-violet-100 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
          <div className="w-3/4 space-y-2">
            <div className="h-2 w-full bg-violet-200/50 rounded-full overflow-hidden">
              <div className="h-full w-2/3 bg-violet-500 animate-[shimmer_2s_infinite]" />
            </div>
            <div className="h-2 w-3/4 bg-violet-200/50 rounded-full" />
            <div className="h-2 w-1/2 bg-violet-200/50 rounded-full" />
          </div>
          <div className="absolute top-2 right-2 text-xs font-bold text-violet-600 bg-white px-2 py-1 rounded-md shadow-sm">
            AI
          </div>
        </div>
      ),
    },
    {
      id: 3,
      title: "Sync",
      subtitle: "Calendar ready.",
      description:
        "Add to Google, Outlook, or Apple Calendar in one tap and get a shareable link.",
      icon: <Share2 className="w-6 h-6 text-white" />,
      color: "bg-pink-600",
      gradient: "from-pink-600 to-rose-600",
      visual: (
        <div className="relative w-full h-32 bg-pink-50 rounded-xl overflow-hidden mt-6 border border-pink-100 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center overflow-hidden p-2">
              <Image
                src="/brands/google.svg"
                alt="Google"
                width={24}
                height={24}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center overflow-hidden p-2">
              <Image
                src="/brands/microsoft.svg"
                alt="Outlook"
                width={24}
                height={24}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center overflow-hidden p-2">
              <Image
                src="/brands/apple-black.svg"
                alt="Apple"
                width={24}
                height={24}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <div className="absolute bottom-2 text-[10px] font-medium text-pink-600 uppercase tracking-wide">
            synced
          </div>
        </div>
      ),
    },
  ];

  return (
    <section id="how-it-works" className="py-32 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        {/* Hero-style Header */}
        <div className="text-center max-w-3xl mx-auto mb-24">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-semibold tracking-wide uppercase mb-6">
            <Zap size={12} className="text-blue-500" />
            <span>The Process</span>
          </div>

          <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 mb-6">
            From paper to plans <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">
              in seconds.
            </span>
          </h2>

          <p className="text-xl text-gray-600">
            Stop typing out dates. Let our us handle the boring parts.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-[2px] bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 -z-10" />

          {steps.map((step) => (
            <div key={step.id} className="relative group">
              <div className="h-full bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] transition-all duration-300 flex flex-col">
                {/* Icon Header */}
                <div className="flex items-center justify-between mb-6">
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-lg text-white`}
                  >
                    {step.icon}
                  </div>
                  <span className="text-5xl font-bold text-gray-50 select-none font-serif italic">
                    {step.id}
                  </span>
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {step.title}
                </h3>
                <p className="text-sm font-medium text-blue-600 mb-3 uppercase tracking-wide">
                  {step.subtitle}
                </p>
                <p className="text-gray-600 leading-relaxed mb-6">
                  {step.description}
                </p>

                {/* Visual Footer */}
                <div className="mt-auto">{step.visual}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
