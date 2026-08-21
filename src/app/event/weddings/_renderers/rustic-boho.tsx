import { useState } from "react";
import {
  Leaf,
  Sun,
  Music,
  Heart,
  ArrowUpRight,
  MapPin,
  Gift,
} from "lucide-react";
import { buildWeddingLocationHref, type EventData, type ThemeConfig } from "./content-sections";

type Props = { theme: ThemeConfig; event: EventData };

const _getNames = (event: EventData) =>
  event.headlineTitle ||
  [event.couple?.partner1, event.couple?.partner2]
    .filter(Boolean)
    .join(" & ") ||
  "Olivia & Noah";

export default function RusticBoho({ theme, event }: Props) {
  const [activeTab, setActiveTab] = useState("home");

  const getGalleryImage = (index: number) => {
    const image = event.gallery?.[index] as
      | string
      | { url?: string; src?: string; preview?: string }
      | undefined;
    if (typeof image === "string") return image;
    return image?.url || image?.src || image?.preview || "";
  };

  const mainImage =
    (event as EventData & { customHeroImage?: string }).customHeroImage ||
    getGalleryImage(0) ||
    theme.decorations?.heroImage ||
    "/templates/wedding-placeholders/sunset-vineyard-hero.jpeg";
  const bouquetImage =
    getGalleryImage(1) || "/templates/weddings/rustic-boho/detail-bouquet.webp";
  const handsImage =
    getGalleryImage(2) || "/templates/weddings/rustic-boho/detail-hands.webp";

  const navItems = [
    { id: "home", label: "Home", icon: Sun },
    { id: "story", label: "Story", icon: Heart },
    { id: "details", label: "Details", icon: Leaf },
    { id: "registry", label: "Registry", icon: Gift },
    { id: "location", label: "Location", icon: MapPin },
  ];

  const scrollToSection = (id: string) => {
    setActiveTab(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    } else if (id === "home" || id === "story") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const dateLabel =
    event.date ||
    event.when ||
    event.schedule?.[0]?.date ||
    "October 12th, 2025";

  const location =
    event.location || event.venue?.name || "AutoCamp Joshua Tree";

  const registryUrl = event.registry?.[0]?.url;
  const directionsHref = buildWeddingLocationHref(event, location);

  return (
    <div
      className="bg-[#FDF8F3] min-h-screen font-sans text-[#4A4036] pb-24"
      style={{ fontFamily: theme.fonts.body }}
    >
      <div className="fixed top-[-10%] right-[-5%] w-[50vw] h-[50vw] bg-[#E8DCC4] rounded-full blur-[100px] opacity-40 pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] left-[-5%] w-[60vw] h-[60vw] bg-[#E6A477] rounded-full blur-[120px] opacity-20 pointer-events-none z-0" />

      <main
        id="home"
        className="relative z-10 px-4 pt-8 md:pt-12 max-w-6xl mx-auto"
      >
        <div className="grid md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-5 text-center md:text-left space-y-6">
            <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-[#D6C0A9] text-sm font-medium text-[#8C7A63]">
              <Leaf size={16} />
              <span>{dateLabel}</span>
            </div>

            <h1
              className="text-6xl md:text-7xl font-serif text-[#9C563D] leading-[1.1]"
              style={{ fontFamily: theme.fonts.headline }}
            >
              Wildly <br />
              <span className="italic font-light text-[#4A4036]">in love.</span>
            </h1>

            <p className="text-lg leading-relaxed text-[#8C7A63] max-w-md mx-auto md:mx-0">
              {event.story ||
                "We're getting married under the oaks. Join us for a weekend of campfires, tacos, and dancing in Joshua Tree."}
            </p>

            {event.rsvpEnabled && (
              <div className="flex justify-center md:justify-start gap-4 pt-4">
                <a
                  href={event.rsvp?.url || "#rsvp"}
                  className="bg-[#9C563D] text-[#FDF8F3] px-8 py-4 rounded-full font-medium hover:bg-[#85452F] transition-colors shadow-lg shadow-[#9C563D]/20"
                >
                  RSVP Now
                </a>
              </div>
            )}
          </div>

          <div className="md:col-span-7 grid grid-cols-2 gap-4 h-[500px] md:h-[600px]">
            <div className="space-y-4 pt-12">
              <div className="h-3/5 w-full bg-white p-2 rounded-t-[100px] rounded-b-2xl shadow-sm rotate-[-2deg] hover:rotate-0 transition-transform duration-500">
                <img
                  src={mainImage}
                  className="w-full h-full object-cover rounded-t-[90px] rounded-b-xl grayscale hover:grayscale-0 transition-all duration-700"
                  alt="Couple at sunset"
                />
              </div>
              <div className="h-2/5 w-full bg-[#E8DCC4] rounded-2xl flex items-center justify-center p-6 text-center">
                <p className="font-serif italic text-2xl text-[#9C563D]">
                  "Finally."
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-2/5 w-full bg-[#D6C0A9] rounded-2xl overflow-hidden relative group">
                <img
                  src={bouquetImage}
                  className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-700"
                  alt="Rustic bouquet and wedding rings"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white/80 p-3 rounded-full">
                    <ArrowUpRight className="text-[#9C563D]" />
                  </div>
                </div>
              </div>
              <div className="h-3/5 w-full bg-white p-2 rounded-b-[100px] rounded-t-2xl shadow-sm rotate-[2deg] hover:rotate-0 transition-transform duration-500">
                <img
                  src={handsImage}
                  className="w-full h-full object-cover rounded-b-[90px] rounded-t-xl"
                  alt="Newlyweds holding hands at sunset"
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      <section
        id="details"
        className="relative z-10 px-4 py-20 max-w-5xl mx-auto"
      >
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-[#EBE3D9] hover:-translate-y-2 transition-transform duration-300">
            <div className="w-12 h-12 bg-[#F3EBE0] rounded-full flex items-center justify-center text-[#9C563D] mb-6">
              <Music />
            </div>
            <h3
              className="font-serif text-2xl mb-3 text-[#4A4036]"
              style={{ fontFamily: theme.fonts.headline }}
            >
              The Vibe
            </h3>
            <p className="text-[#8C7A63] text-sm leading-relaxed">
              Think backyard BBQ meets desert disco. Wear comfortable shoes and
              bring layers for the cool desert night.
            </p>
          </div>

          <div
            id="registry"
            className="bg-[#9C563D] p-8 rounded-[2rem] shadow-lg text-[#FDF8F3] transform md:scale-105"
          >
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white mb-6">
              <Heart />
            </div>
            <h3
              className="font-serif text-2xl mb-3"
              style={{ fontFamily: theme.fonts.headline }}
            >
              The Registry
            </h3>
            <p className="text-white/80 text-sm leading-relaxed mb-6">
              {event.registryNote ||
                "We have everything we need. If you'd like to contribute, we're saving for a homestead."}
            </p>
            {registryUrl && (
              <a
                href={registryUrl}
                className="w-full inline-block text-center bg-white text-[#9C563D] py-3 rounded-xl font-medium text-sm hover:bg-[#F3EBE0] transition-colors"
              >
                View Registry
              </a>
            )}
          </div>

          <div
            id="location"
            className="bg-white p-8 rounded-[2rem] shadow-sm border border-[#EBE3D9] hover:-translate-y-2 transition-transform duration-300"
          >
            <div className="w-12 h-12 bg-[#F3EBE0] rounded-full flex items-center justify-center text-[#9C563D] mb-6">
              <Leaf />
            </div>
            <h3
              className="font-serif text-2xl mb-3 text-[#4A4036]"
              style={{ fontFamily: theme.fonts.headline }}
            >
              The Place
            </h3>
            <p className="text-[#8C7A63] text-sm leading-relaxed">
              {location}
              <br />
              {event.venue?.address ||
                "Luxury Airstreams provided for all guests."}
              <br />
              <a
                href={directionsHref || "#location"}
                className="underline mt-2 inline-block hover:text-[#9C563D]"
              >
                Get Directions
              </a>
            </p>
          </div>
        </div>
      </section>

      {event.rsvpEnabled && (
        <section id="rsvp" className="px-6 py-20 text-center text-[#4A4036]">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#9C563D]">
            Kindly respond
          </p>
          <h2
            className="mt-4 text-4xl"
            style={{ fontFamily: theme.fonts.headline }}
          >
            We hope you can join us.
          </h2>
          {event.rsvp?.deadline && (
            <p className="mt-4 text-sm text-[#8C7A63]">Respond by {event.rsvp.deadline}</p>
          )}
        </section>
      )}

      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <div className="flex bg-white/90 backdrop-blur-md p-2 rounded-full shadow-xl border border-[#EBE3D9] gap-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-300 ${
                activeTab === item.id
                  ? "bg-[#4A4036] text-[#FDF8F3]"
                  : "text-[#8C7A63] hover:bg-[#F3EBE0]"
              }`}
            >
              <item.icon size={18} />
              <span
                className={`text-sm font-medium ${
                  activeTab === item.id ? "block" : "hidden md:block"
                }`}
              >
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
