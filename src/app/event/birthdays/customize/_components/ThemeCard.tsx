import React from "react";

export function BirthdayThemeCard({
  theme,
  selected,
  onSelect,
  disabled = false,
}: {
  theme: any;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}) {
  const primary = theme.primaryColor || "#f8fafc";
  const secondary = theme.secondaryColor || "#1f2937";
  const headlineFont = theme.headlineFont || "sans-serif";
  const layout = theme.layout || "standard";
  
  const PreviewContent = () => {
    if (theme.heroImage) {
      return (
        <div className="w-full h-full relative">
           <img 
            src={theme.heroImage} 
            alt={theme.name} 
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>
      );
    }

    switch(layout) {
      case 'retro-pixel':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center p-2 relative overflow-hidden" 
               style={{ backgroundColor: primary, border: `2px dashed ${secondary}` }}>
             <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `linear-gradient(transparent 50%, ${secondary} 50%)`, backgroundSize: "100% 4px" }}></div>
             <span className="relative z-10 text-center uppercase tracking-tighter leading-none" 
                  style={{ color: "#fff", fontFamily: "'Press Start 2P', monospace", textShadow: `2px 2px 0px ${secondary}`, fontSize: '12px' }}>
                RETRO
             </span>
          </div>
        );
      case 'neon-night':
      case 'cosmic-glow':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center p-2 relative overflow-hidden bg-black">
             <div className="absolute inset-0 bg-gradient-to-br from-black via-slate-900 to-black"></div>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full blur-2xl opacity-60" style={{ backgroundColor: secondary }}></div>
             <span className="relative z-10 text-center font-black uppercase tracking-tight leading-none" 
                  style={{ color: "#fff", fontFamily: headlineFont, textShadow: `0 0 15px ${secondary}`, fontSize: '16px' }}>
                NEON
             </span>
          </div>
        );
      case 'elegant-serif':
        return (
           <div className="w-full h-full flex flex-col items-center justify-center p-3 relative bg-white">
              <div className="absolute inset-2 border" style={{ borderColor: secondary }}></div>
              <div className="absolute inset-3 border opacity-40" style={{ borderColor: secondary }}></div>
              <span className="relative z-10 text-center italic leading-tight" 
                   style={{ color: secondary, fontFamily: headlineFont, fontSize: '18px' }}>
                 Elegant
              </span>
           </div>
        );
      case 'pattern-play':
      case 'balloon-arch':
      case 'tropical-vibe':
      case 'confetti-splash':
      case 'magical-sparkle':
      default:
        return (
           <div className="w-full h-full flex flex-col items-center justify-center p-2 relative overflow-hidden" style={{ backgroundColor: primary }}>
              <div className="absolute inset-0 opacity-10" 
                   style={{ backgroundImage: `radial-gradient(${secondary} 2px, transparent 2px)`, backgroundSize: "12px 12px" }}></div>
              
              <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm z-10 border border-white/50">
                 <span className="text-center font-bold text-sm leading-none" 
                      style={{ color: secondary, fontFamily: headlineFont }}>
                    ✨
                 </span>
              </div>
           </div>
        );
    }
  };

  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={`rounded-xl overflow-hidden transition-all duration-200 relative group text-left flex flex-col h-40 shadow-sm hover:shadow-md border ${selected ? 'ring-2 ring-offset-2' : ''}`}
      style={{
        borderColor: selected ? secondary : "#e2e8f0",
        ["--secondary-color" as string]: secondary,
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        outlineColor: secondary,
      }}
    >
      <div className="w-full h-28 relative">
        <PreviewContent />
        
       {/* Selection checkmark */}
       {selected && (
         <div className="absolute top-2 right-2 bg-white text-green-600 rounded-full p-1 shadow-sm z-20">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                 <polyline points="20 6 9 17 4 12"></polyline>
             </svg>
         </div>
       )}
      </div>
      
      <div className="px-3 py-2 bg-white flex-1 w-full border-t border-slate-50 flex flex-col justify-center">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
          {theme.category}
        </div>
        <div className="text-[12px] font-bold text-slate-800 leading-tight line-clamp-2">
           {theme.name}
        </div>
      </div>
    </button>
  );
}
