import { PROFESSIONAL_THEMES } from "./constants";

export const createInitialBirthdayData = () => ({
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
    professionalThemeId: "rainbow_confetti_splash",
  },
  themePalette:
    PROFESSIONAL_THEMES.find((t) => t.id === "rainbow_confetti_splash")
      ?.recommendedColorPalette || [],
  images: {
    hero: null,
    headlineBg: null,
  },
  registries: [
    {
      id: 1,
      label: "Amazon Registry",
      url: "https://www.amazon.com/wishlist/emma-5th-birthday",
    },
    {
      id: 2,
      label: "Target Registry",
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
});
