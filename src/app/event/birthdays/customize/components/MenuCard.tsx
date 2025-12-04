import React from "react";
import { ChevronRight } from "lucide-react";

type MenuCardProps = {
  title: string;
  desc: string;
  icon: React.ReactNode;
  onClick: () => void;
};

export default function MenuCard({ title, icon, desc, onClick }: MenuCardProps) {
  return (
    <div
      onClick={onClick}
      className="group bg-white border border-slate-200 rounded-xl p-5 cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all duration-200 flex items-start gap-4"
    >
      <div className="bg-slate-50 p-3 rounded-lg text-slate-600 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors">
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <h3 className="font-semibold text-slate-800">{title}</h3>
          <ChevronRight
            size={16}
            className="text-slate-300 group-hover:text-indigo-400 transform group-hover:translate-x-1 transition-all"
          />
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
