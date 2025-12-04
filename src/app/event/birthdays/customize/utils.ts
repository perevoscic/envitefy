import {
  birthdayTemplateCatalog,
  type BirthdayTemplateDefinition,
} from "@/components/event-create/BirthdayTemplateGallery";

export function getTemplateById(
  id?: string | null
): BirthdayTemplateDefinition | null {
  if (!birthdayTemplateCatalog || birthdayTemplateCatalog.length === 0) {
    return null;
  }
  if (!id) return birthdayTemplateCatalog[0];

  return (
    birthdayTemplateCatalog.find((template) => template.id === id) ??
    birthdayTemplateCatalog[0]
  );
}

// Helper function to calculate luminance from hex color (0-1, higher = lighter)
export const getLuminance = (hex: string): number => {
  const rgb = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!rgb) return 0.5; // Default to medium if invalid

  const r = parseInt(rgb[1], 16) / 255;
  const g = parseInt(rgb[2], 16) / 255;
  const b = parseInt(rgb[3], 16) / 255;

  // Relative luminance formula
  const [rLinear, gLinear, bLinear] = [r, g, b].map((val) => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
};

// Determine if a palette is dark (average luminance < 0.5)
export const isPaletteDark = (palette: string[]): boolean => {
  if (!palette || palette.length === 0) return false;
  const colors = palette.filter(Boolean).slice(0, 3); // Use first 3 colors (gradient)
  if (colors.length === 0) return false;

  const luminances = colors.map(getLuminance);
  const avgLuminance =
    luminances.reduce((a, b) => a + b, 0) / luminances.length;
  return avgLuminance < 0.5; // Dark if average luminance < 0.5
};

// Helper function to create preview gradient from color palette (like football-season)
export const getPreviewStyle = (palette: string[]) => {
  if (!palette || palette.length === 0) {
    return { backgroundColor: "#e2e8f0" };
  }
  const colors = palette.filter(Boolean);
  if (colors.length === 1) {
    return { backgroundColor: colors[0] };
  }
  if (colors.length === 2) {
    return {
      backgroundImage: `linear-gradient(to right, ${colors[0]}, ${colors[1]})`,
    };
  }
  // Use first 3 colors for gradient (like football-season uses 3 colors)
  return {
    backgroundImage: `linear-gradient(to right, ${colors[0]}, ${colors[1]}, ${colors[2]})`,
  };
};
