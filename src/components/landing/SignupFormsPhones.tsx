"use client";

import { CheckSquare, Users, Calendar } from "lucide-react";

// Reusable Sign-up Form Phone Component
const SignupFormPhone = ({
  className,
  title,
  gradient,
}: {
  className?: string;
  title: string;
  gradient: string;
}) => (
  <div
    className={`relative w-[280px] h-[580px] bg-[#F8F5FF] rounded-[3rem] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.12)] border-[6px] border-[#F8F5FF] ring-1 ring-gray-900/5 overflow-hidden ${className}`}
  >
    {/* Notch */}
    <div className="absolute top-0 inset-x-0 h-7 bg-[#F8F5FF] z-20 flex justify-center">
      <div className="w-32 h-6 bg-black rounded-b-2xl" />
    </div>

    {/* Website Content */}
    <div className="absolute top-7 left-0 right-0 bottom-0 overflow-y-auto bg-white">
      {/* Header Section */}
      <div
        className={`h-32 bg-gradient-to-br ${gradient} relative overflow-hidden`}
      >
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-6 z-10">
          <CheckSquare className="w-8 h-8 mb-2 fill-white" />
          <h1 className="text-xl font-bold text-center mb-1">{title}</h1>
          <p className="text-xs opacity-90">Classroom Snacks</p>
        </div>
      </div>

      {/* Sign-up Sections */}
      <div className="px-4 py-6 space-y-4">
        {/* Section 1 */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">
            Monday, June 10
          </h2>
          <div className="space-y-2">
            {[
              { item: "Chips & Dip", signed: "Sarah M.", available: true },
              { item: "Fruit Platter", signed: null, available: true },
              { item: "Cookies", signed: "Mike T.", available: true },
            ].map((slot, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg"
              >
                <div className="w-5 h-5 rounded border-2 border-emerald-500 flex items-center justify-center flex-shrink-0">
                  {slot.signed && (
                    <div className="w-3 h-3 bg-emerald-500 rounded-sm" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {slot.item}
                  </p>
                  {slot.signed && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {slot.signed}
                    </p>
                  )}
                </div>
                {!slot.signed && (
                  <button className="text-xs text-emerald-600 font-semibold px-2 py-1">
                    Sign up
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Section 2 */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">
            Wednesday, June 12
          </h2>
          <div className="space-y-2">
            {[
              { item: "Juice Boxes", signed: null, available: true },
              { item: "Veggie Sticks", signed: "Lisa K.", available: true },
            ].map((slot, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg"
              >
                <div className="w-5 h-5 rounded border-2 border-emerald-500 flex items-center justify-center flex-shrink-0">
                  {slot.signed && (
                    <div className="w-3 h-3 bg-emerald-500 rounded-sm" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {slot.item}
                  </p>
                  {slot.signed && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {slot.signed}
                    </p>
                  )}
                </div>
                {!slot.signed && (
                  <button className="text-xs text-emerald-600 font-semibold px-2 py-1">
                    Sign up
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Info Section */}
        <div className="pt-2 space-y-2">
          <div className="flex items-center gap-2 text-gray-600">
            <Users className="w-4 h-4 text-emerald-600" />
            <span className="text-xs">12 signed up</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span className="text-xs">Updates in real-time</span>
          </div>
        </div>
      </div>

      {/* Fixed Action Button at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
        <button className="w-full bg-emerald-600 text-white text-sm font-semibold py-3 rounded-lg">
          View All Slots
        </button>
      </div>
    </div>
  </div>
);

export default function SignupFormsPhones() {
  return (
    <div className="relative h-[700px] w-full flex items-center justify-center perspective-[2000px]">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-gradient-to-tr from-emerald-100/40 via-teal-100/40 to-transparent rounded-full blur-3xl -z-10" />

      {/* Single Phone: Sign-up Form View (Center) */}
      <div className="relative z-20 transform hover:-translate-y-2 transition-transform duration-500">
        <SignupFormPhone
          title="Classroom Snacks"
          gradient="from-emerald-500 to-teal-600"
        />
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-700 text-white text-xs font-bold px-2 py-1 rounded shadow-lg">
          Sign-up Form
        </div>
      </div>
    </div>
  );
}
