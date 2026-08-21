import { Check, Gem } from "lucide-react";
import WeddingDesignPreview from "@/components/weddings/WeddingDesignPreview";
import type { WeddingDesign } from "@/lib/wedding-designs";

export default function ThemeCard({
  theme,
  selected,
  onSelect,
  disabled = false,
}: {
  theme: WeddingDesign;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      className={`group overflow-hidden rounded-2xl border bg-white text-left transition duration-300 ${
        selected
          ? "border-[#a98553] shadow-[0_14px_36px_rgba(102,75,44,0.18)] ring-2 ring-[#a98553]/20"
          : "border-[#e5ddd5] shadow-sm hover:-translate-y-0.5 hover:border-[#cbb99f] hover:shadow-lg"
      }`}
      style={{
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <div className="relative m-2 overflow-hidden rounded-xl">
        <WeddingDesignPreview design={theme} />
        {selected ? (
          <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-[#2f2925] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-white shadow-lg">
            <Check className="h-3 w-3" />
            Selected
          </div>
        ) : null}
      </div>
      <div className="px-4 pb-4 pt-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className='[font-family:var(--font-playfair),_"Times_New_Roman",_serif] text-lg text-[#302925]'>
              {theme.name}
            </div>
            <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-[#9a7850]">
              {theme.signature}
            </div>
          </div>
          <Gem className="mt-1 h-4 w-4 shrink-0 text-[#b18a59]" />
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{theme.description}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {[theme.style, theme.color].map((label) => (
            <span
              key={label}
              className="rounded-full border border-[#e4dcd3] bg-[#faf8f5] px-2.5 py-1 text-[9px] font-semibold text-[#6f6258]"
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}
