import {
  Baby,
  Cake,
  CalendarCheck,
  ClipboardList,
  Flag,
  Flower2,
  Gift,
  Goal,
  Heart,
  Medal,
  Megaphone,
  Music2,
  Paintbrush,
  PartyPopper,
  Ribbon,
  Sparkles,
  Trophy,
} from "lucide-react";
import type { CSSProperties } from "react";
import {
  getCategoryCustomDesignProfile,
  type CustomDesignCategory,
  type CustomDesignIcon,
} from "@/lib/category-custom-design-profiles";

const ICONS = {
  baby: Baby,
  cake: Cake,
  calendar: CalendarCheck,
  clipboard: ClipboardList,
  flag: Flag,
  flower: Flower2,
  gift: Gift,
  goal: Goal,
  heart: Heart,
  medal: Medal,
  megaphone: Megaphone,
  music: Music2,
  paintbrush: Paintbrush,
  party: PartyPopper,
  ribbon: Ribbon,
  sparkles: Sparkles,
  trophy: Trophy,
} satisfies Record<CustomDesignIcon, typeof Sparkles>;

export function CategoryCustomDesignIcon({
  category,
  size = 24,
  className,
}: {
  category: CustomDesignCategory;
  size?: number;
  className?: string;
}) {
  const Icon = ICONS[getCategoryCustomDesignProfile(category).icon];
  return <Icon size={size} className={className} aria-hidden="true" />;
}

export function categoryCustomDesignStyle(category: CustomDesignCategory): CSSProperties {
  const { tokens } = getCategoryCustomDesignProfile(category);
  return {
    "--create-background": `var(--app-surface, ${tokens.background})`,
    "--create-border": `var(--app-border, ${tokens.border})`,
    "--create-soft": `var(--app-surface-alt, ${tokens.soft})`,
    "--create-accent": `var(--app-primary, ${tokens.accent})`,
    "--create-hover": `var(--app-primary, ${tokens.hover})`,
    "--create-ink": `var(--app-foreground, ${tokens.ink})`,
    "--create-muted": `var(--app-muted-foreground, ${tokens.muted})`,
    "--create-on-accent": "var(--app-primary-foreground, #ffffff)",
  } as CSSProperties;
}
