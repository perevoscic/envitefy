import React from "react";

type InputGroupProps = {
  label: string;
  value: any;
  onChange: (value: any) => void;
  type?: string;
  placeholder?: string;
};

export default function InputGroup({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
}: InputGroupProps) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wider">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
      />
    </div>
  );
}
