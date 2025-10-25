"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { Camera, Upload, CalendarPlus, ClipboardList } from "lucide-react";

export default function SnapPage() {
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pickedName, setPickedName] = useState<string | null>(null);

  const openCreateEvent = useCallback(() => {
    try {
      (window as any).__openCreateEvent?.();
    } catch {}
  }, []);

  const onSnap = useCallback(() => {
    try {
      if (cameraInputRef.current) cameraInputRef.current.value = "";
      cameraInputRef.current?.click();
    } catch {}
  }, []);

  const onUpload = useCallback(() => {
    try {
      if (fileInputRef.current) fileInputRef.current.value = "";
      fileInputRef.current?.click();
    } catch {}
  }, []);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const params = new URLSearchParams(window.location.search);
      const action = (params.get("action") || "").toLowerCase();
      if (!action) return;
      const cleanup = () => {
        try {
          const url = new URL(window.location.href);
          url.searchParams.delete("action");
          window.history.replaceState({}, "", url.toString());
        } catch {}
      };
      if (action === "camera") {
        onSnap();
        cleanup();
      } else if (action === "upload") {
        onUpload();
        cleanup();
      }
    } catch {}
  }, [onSnap, onUpload]);

  const onFilePicked = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setPickedName(f ? f.name : null);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-pink-50 flex flex-col items-center justify-center px-4 py-10">
      <div className="text-center mb-8">
        <img
          src="/icons/icon-180.png"
          alt="Snap My Date"
          className="mx-auto w-24 h-24 rounded-full shadow-md mb-3"
        />
        <h1 className="text-3xl font-bold text-gray-800">
          Plan Something Great 🎉
        </h1>
        <p className="text-gray-500 mt-2">
          Choose how you want to start — snap it, upload it, create new, or set
          up a sign-up form.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl w-full">
        <OptionCard
          title="Snap with Camera"
          description="Quickly capture your invite or flyer using your camera and let Snap My Date auto-detect event details."
          icon={<Camera className="w-10 h-10 text-pink-500" />}
          href={undefined}
          onClick={onSnap}
        />
        <OptionCard
          title="Upload Flyer or PDF"
          description="Upload any saved invitation or document. We’ll extract the event info and add it to your calendar."
          icon={<Upload className="w-10 h-10 text-blue-500" />}
          href={undefined}
          onClick={onUpload}
        />
        <OptionCard
          title="Create Event Manually"
          description="Want full control? Start from scratch and fill in your event details manually."
          icon={<CalendarPlus className="w-10 h-10 text-green-500" />}
          href={undefined}
          onClick={openCreateEvent}
        />
        <OptionCard
          title="Smart Sign-Up Form"
          description="Create interactive sign-up sheets for parties, volunteers, fundraisers, or school events in seconds."
          icon={<ClipboardList className="w-10 h-10 text-purple-500" />}
          href="/smart-signup-form"
          onClick={undefined}
        />
      </div>

      {/* Hidden inputs for snap/upload, preserved for auto-trigger */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*,application/pdf"
        capture="environment"
        onChange={onFilePicked}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={onFilePicked}
        className="hidden"
      />

      {pickedName ? (
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 truncate">
          Selected: {pickedName}
        </p>
      ) : null}
    </main>
  );
}

function OptionCard({
  href,
  title,
  icon,
  description,
  onClick,
}: {
  href?: string;
  title: string;
  icon: ReactNode;
  description: string;
  onClick?: () => void;
}) {
  const content = (
    <div className="group bg-white p-6 rounded-2xl shadow hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-pink-200 cursor-pointer">
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="bg-pink-50 p-3 rounded-full group-hover:scale-105 transition">
          {icon}
        </div>
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        <p className="text-gray-500 text-sm">{description}</p>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} onClick={onClick}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className="text-left">
      {content}
    </button>
  );
}
