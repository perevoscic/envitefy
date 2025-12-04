import React from "react";
import { ChevronLeft } from "lucide-react";

type EditorLayoutProps = {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
};

export default function EditorLayout({ title, onBack, children }: EditorLayoutProps) {
  return (
    <div className="animate-fade-in-right">
      <div className="flex items-center mb-6 pb-4 border-b border-slate-100">
        <button
          onClick={onBack}
          className="mr-3 p-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-auto">
          Customize
        </span>
        <h2 className="text-lg font-serif font-bold text-slate-800 absolute left-1/2 transform -translate-x-1/2">
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}
