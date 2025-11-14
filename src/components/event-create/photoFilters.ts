export type PhotoFilterDefinition = {
  id: string;
  label: string;
  className: string;
};

export const PHOTO_FILTERS: PhotoFilterDefinition[] = [
  { id: "filter-bw", label: "Black & White", className: "filter-bw" },
  { id: "filter-sepia", label: "Sepia", className: "filter-sepia" },
  {
    id: "filter-high-contrast",
    label: "High Contrast",
    className: "filter-high-contrast",
  },
  {
    id: "filter-low-contrast",
    label: "Low Contrast",
    className: "filter-low-contrast",
  },
  { id: "filter-desaturated", label: "Desaturated", className: "filter-desaturated" },
  { id: "filter-vintage", label: "Vintage Fade", className: "filter-vintage" },
  { id: "filter-warm", label: "Warm Tone", className: "filter-warm" },
  { id: "filter-cool", label: "Cool Tone", className: "filter-cool" },
  { id: "filter-matte", label: "Soft Matte", className: "filter-matte" },
  { id: "filter-hard-matte", label: "Hard Matte", className: "filter-hard-matte" },
  {
    id: "filter-film-grain",
    label: "Film Grain",
    className: "filter-film-grain",
  },
  { id: "filter-high-key", label: "High Key (Bright)", className: "filter-high-key" },
  { id: "filter-low-key", label: "Low Key (Dark)", className: "filter-low-key" },
  { id: "filter-invert", label: "Invert (Negative)", className: "filter-invert" },
  {
    id: "filter-soft-focus",
    label: "Blur Soft Focus",
    className: "filter-soft-focus",
  },
  { id: "filter-hdr", label: "HDR Pop", className: "filter-hdr" },
];
