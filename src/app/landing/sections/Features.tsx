import {
  Scan,
  Calendar,
  Share2,
  Users,
  Gift,
  CheckSquare,
  ArrowRight,
  Sparkles,
  Globe,
} from "lucide-react";

export default function Features() {
  return (
    <section
      id="features"
      className="py-10 bg-gray-50 border-t border-gray-100"
    >
      <div className="max-w-7xl mx-auto px-6">
        {/* Hero-style Header */}
        <div className="max-w-3xl mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 border border-violet-100 text-violet-600 text-xs font-semibold tracking-wide uppercase mb-6">
            <Sparkles size={12} className="text-violet-500" />
            <span>Features</span>
          </div>

          <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 mb-6">
            More than just <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-pink-600">
              a calendar tool.
            </span>
          </h2>

          <p className="text-xl text-gray-600 max-w-2xl">
            Envitefy is a complete event command center. From the first invite
            to the final RSVP.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[minmax(240px,auto)]">
          {/* Feature 1: OCR (Large) */}
          <div className="md:col-span-2 bg-white rounded-[2.5rem] p-10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] border border-gray-100 relative overflow-hidden group">
            <div className="relative z-10 max-w-md h-full flex flex-col">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-8">
                <Scan className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Unbeatable Accuracy
              </h3>
              <p className="text-gray-600 text-lg leading-relaxed mb-8">
                Our AI reads handwriting, complex tables, and multi-page PDFs.
                It doesn't just find the date—it understands the context.
              </p>

              <div className="mt-auto inline-flex items-center gap-2 text-blue-600 font-semibold group-hover:gap-3 transition-all cursor-pointer">
                Try it now <ArrowRight size={18} />
              </div>
            </div>

            {/* Decorative visual */}
            <div className="absolute right-0 bottom-0 w-80 h-80 bg-gradient-to-tl from-blue-50 to-transparent rounded-tl-[4rem] opacity-60 group-hover:scale-105 transition-transform duration-700" />
          </div>

          {/* Feature 2: Calendar Sync */}
          <div className="md:col-span-2 lg:col-span-1 bg-white rounded-[2.5rem] p-8 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] border border-gray-100 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
            <div className="relative z-10">
              <div className="w-12 h-12 bg-violet-100 rounded-2xl flex items-center justify-center mb-6">
                <Calendar className="w-6 h-6 text-violet-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Instant Sync
              </h3>
              <p className="text-gray-600">
                Google, Outlook, Apple. All synced in real-time.
              </p>
            </div>
          </div>

          {/* Feature 3: RSVPs */}
          <div className="md:col-span-2 lg:col-span-1 bg-white rounded-[2.5rem] p-8 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] border border-gray-100 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
            <div className="relative z-10">
              <div className="w-12 h-12 bg-pink-100 rounded-2xl flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Smart RSVPs
              </h3>
              <p className="text-gray-600">
                Collect Yes/No/Maybe via simple text links.
              </p>
            </div>
          </div>

          {/* Feature 4: Sign-up Forms (Wide) */}
          <div className="md:col-span-3 lg:col-span-2 bg-emerald-50 rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden flex flex-col justify-between group border border-emerald-100">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-100 to-transparent rounded-bl-full opacity-60" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6 text-emerald-700 font-medium uppercase tracking-wider text-xs">
                <CheckSquare className="w-4 h-4" />
                <span>Sign-up Sheets</span>
              </div>
              <h3 className="text-3xl font-bold mb-4 text-emerald-950">
                Volunteer & Potluck Management
              </h3>
              <p className="text-emerald-800 max-w-md text-lg">
                Create slots for anything—snacks, rides, shifts. We track who
                signed up and remind them automatically.
              </p>
            </div>

            <div className="mt-8 relative z-10">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border-2 border-emerald-50 bg-emerald-200"
                    />
                  ))}
                </div>
                <span className="text-sm text-emerald-700 font-medium">
                  12 spots filled
                </span>
              </div>
            </div>
          </div>

          {/* Feature 5: Registries */}
          <div className="lg:col-span-1 bg-gradient-to-br from-amber-50 to-orange-50 rounded-[2.5rem] p-8 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] border border-amber-100 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm text-amber-600">
                <Gift className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Registries
              </h3>
              <p className="text-gray-600 text-sm">
                Amazon, Target, Walmart. Link them all.
              </p>
            </div>
          </div>

          {/* Feature 6: Website */}
          <div className="lg:col-span-1 bg-white rounded-[2.5rem] p-8 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] border border-gray-100 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
            <div className="relative z-10">
              <div className="w-12 h-12 bg-sky-100 rounded-2xl flex items-center justify-center mb-6 text-sky-600">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Event Page
              </h3>
              <p className="text-gray-600 text-sm">
                A beautiful landing page for every event.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
