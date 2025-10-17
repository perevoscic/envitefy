type EventThemeDefinition = {
  key: string;
  label: string;
  icon: string;
  headerLight: string;
  headerDark: string;
  cardLight: string;
  cardDark: string;
  borderLight: string;
  borderDark: string;
  chipLight: string;
  chipDark: string;
  textLight: string;
  textDark: string;
};

const EVENT_THEMES: EventThemeDefinition[] = [
  {
    key: "birthday",
    label: "Birthday",
    icon: "🎂",
    headerLight: "linear-gradient(135deg, #FFE5F1 0%, #FFF4DE 100%)",
    headerDark: "linear-gradient(135deg, #4F1D4B 0%, #3B1A3B 100%)",
    cardLight: "rgba(255, 237, 246, 0.85)",
    cardDark: "rgba(60, 22, 54, 0.65)",
    borderLight: "rgba(255, 182, 213, 0.7)",
    borderDark: "rgba(235, 135, 190, 0.45)",
    chipLight: "rgba(255, 255, 255, 0.85)",
    chipDark: "rgba(29, 16, 28, 0.8)",
    textLight: "#3C1134",
    textDark: "#FCE7F3",
  },
  {
    key: "wedding",
    label: "Wedding",
    icon: "💍",
    headerLight: "linear-gradient(135deg, #FFF1F1 0%, #FDEFD9 100%)",
    headerDark: "linear-gradient(135deg, #3F1E33 0%, #2A1B29 100%)",
    cardLight: "rgba(255, 247, 243, 0.92)",
    cardDark: "rgba(45, 28, 42, 0.7)",
    borderLight: "rgba(238, 184, 203, 0.6)",
    borderDark: "rgba(214, 162, 180, 0.45)",
    chipLight: "rgba(255, 255, 255, 0.9)",
    chipDark: "rgba(31, 19, 29, 0.8)",
    textLight: "#3A1D2E",
    textDark: "#F8E4ED",
  },
  {
    key: "appointment",
    label: "Appointment",
    icon: "📅",
    headerLight: "linear-gradient(135deg, #E0F2FF 0%, #E6FFFB 100%)",
    headerDark: "linear-gradient(135deg, #132D45 0%, #15363B 100%)",
    cardLight: "rgba(232, 246, 255, 0.9)",
    cardDark: "rgba(21, 41, 55, 0.7)",
    borderLight: "rgba(132, 205, 245, 0.6)",
    borderDark: "rgba(94, 174, 218, 0.45)",
    chipLight: "rgba(255, 255, 255, 0.88)",
    chipDark: "rgba(13, 25, 35, 0.85)",
    textLight: "#0F2F4A",
    textDark: "#E6F6FF",
  },
  {
    key: "doctor",
    label: "Doctor Appointment",
    icon: "🩺",
    headerLight: "linear-gradient(135deg, #E6FFFB 0%, #E0F7FF 100%)",
    headerDark: "linear-gradient(135deg, #0E2D26 0%, #0F3646 100%)",
    cardLight: "rgba(225, 248, 245, 0.92)",
    cardDark: "rgba(14, 39, 35, 0.7)",
    borderLight: "rgba(125, 211, 193, 0.6)",
    borderDark: "rgba(74, 160, 143, 0.5)",
    chipLight: "rgba(255, 255, 255, 0.88)",
    chipDark: "rgba(8, 24, 24, 0.85)",
    textLight: "#103833",
    textDark: "#DAF6F0",
  },
  {
    key: "sports",
    label: "Sports",
    icon: "🏆",
    headerLight: "linear-gradient(135deg, #E8FCE3 0%, #E2F1FF 100%)",
    headerDark: "linear-gradient(135deg, #112A16 0%, #122645 100%)",
    cardLight: "rgba(231, 245, 240, 0.9)",
    cardDark: "rgba(16, 35, 29, 0.72)",
    borderLight: "rgba(134, 239, 172, 0.6)",
    borderDark: "rgba(74, 222, 128, 0.45)",
    chipLight: "rgba(255, 255, 255, 0.88)",
    chipDark: "rgba(12, 23, 19, 0.85)",
    textLight: "#164024",
    textDark: "#DCFCE7",
  },
  {
    key: "party",
    label: "Party",
    icon: "🎉",
    headerLight: "linear-gradient(135deg, #FFE8FB 0%, #E1F5FF 100%)",
    headerDark: "linear-gradient(135deg, #2A0E3E 0%, #142644 100%)",
    cardLight: "rgba(248, 230, 255, 0.92)",
    cardDark: "rgba(33, 18, 44, 0.75)",
    borderLight: "rgba(216, 180, 254, 0.6)",
    borderDark: "rgba(192, 132, 252, 0.45)",
    chipLight: "rgba(255, 255, 255, 0.9)",
    chipDark: "rgba(22, 15, 29, 0.85)",
    textLight: "#311341",
    textDark: "#F5E2FF",
  },
];

const DEFAULT_THEME: EventThemeDefinition = {
  key: "general",
  label: "Event",
  icon: "📌",
  headerLight: "linear-gradient(135deg, #F2F4F8 0%, #FDF8FF 100%)",
  headerDark: "linear-gradient(135deg, #191E29 0%, #231F2F 100%)",
  cardLight: "rgba(249, 250, 255, 0.88)",
  cardDark: "rgba(29, 30, 38, 0.7)",
  borderLight: "rgba(203, 213, 225, 0.6)",
  borderDark: "rgba(148, 163, 184, 0.45)",
  chipLight: "rgba(255, 255, 255, 0.9)",
  chipDark: "rgba(17, 17, 24, 0.85)",
  textLight: "#1E293B",
  textDark: "#E2E8F0",
};

function normalize(value?: string | null): string {
  return (value || "").trim().toLowerCase();
}

export type EventTheme = EventThemeDefinition & {
  categoryLabel: string;
};

export function getEventTheme(category?: string | null): EventTheme {
  const normalized = normalize(category);
  const matched = EVENT_THEMES.find((theme) => {
    if (!normalized) return false;
    switch (theme.key) {
      case "birthday":
        return normalized.includes("birthday");
      case "wedding":
        return normalized.includes("wedding");
      case "appointment":
        return (
          normalized.includes("appointment") &&
          !normalized.includes("doctor") &&
          !normalized.includes("dent") &&
          !normalized.includes("clinic")
        );
      case "doctor":
        return (
          normalized.includes("doctor") ||
          normalized.includes("dent") ||
          normalized.includes("clinic") ||
          normalized.includes("medical")
        );
      case "sports":
        return (
          normalized.includes("sport") ||
          normalized.includes("game") ||
          normalized.includes("match") ||
          normalized.includes("vs")
        );
      case "party":
        return (
          normalized.includes("party") || normalized.includes("celebration")
        );
      default:
        return false;
    }
  });

  const base = matched ?? DEFAULT_THEME;
  const categoryLabel = category?.trim() || base.label;
  return { ...base, categoryLabel };
}

