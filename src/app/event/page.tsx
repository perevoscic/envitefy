import Link from "next/link";
import { Camera, ChevronLeft, Upload } from "lucide-react";

export const metadata = {
  title: "Snap or upload invite · Envitefy",
  description:
    "Scan a flyer with your camera or upload an image to create your event.",
};

export default function EventSnapLandingPage() {
  return (
    <main className="min-h-screen bg-[#eff3f8] px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-3xl">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-indigo-600"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Back to home
        </Link>

        <h1 className="text-3xl font-black leading-tight text-[#0f1935] sm:text-4xl">
          Snap or upload your{" "}
          <span className="text-indigo-600">flyer or invite</span>
        </h1>
        <p className="mt-3 max-w-xl text-base text-[#66677f]">
          Use your camera for a quick scan, or upload a photo or PDF. We&apos;ll
          read the details so you can finish your event on the dashboard.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <Link
            href="/?action=camera"
            className="group flex flex-col rounded-[2rem] border-2 border-indigo-200 bg-white p-8 shadow-[0_15px_45px_rgba(99,102,241,0.12)] transition hover:-translate-y-0.5 hover:border-indigo-400 hover:shadow-[0_20px_50px_rgba(99,102,241,0.18)]"
          >
            <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100 transition group-hover:bg-indigo-100">
              <Camera className="h-7 w-7" strokeWidth={2} aria-hidden />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-indigo-500">
              Camera
            </span>
            <span className="mt-2 text-xl font-bold text-[#0f1935]">
              Snap flyer
            </span>
            <span className="mt-2 text-sm text-[#66677f]">
              Open the camera and capture the invitation in one shot.
            </span>
          </Link>

          <Link
            href="/?action=upload"
            className="group flex flex-col rounded-[2rem] border border-[#e5e6ef] bg-white p-8 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-[0_15px_45px_rgba(99,102,241,0.1)]"
          >
            <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 ring-1 ring-slate-200 transition group-hover:bg-indigo-50 group-hover:text-indigo-600">
              <Upload className="h-7 w-7" strokeWidth={2} aria-hidden />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400 group-hover:text-indigo-500">
              From device
            </span>
            <span className="mt-2 text-xl font-bold text-[#0f1935]">
              Upload file
            </span>
            <span className="mt-2 text-sm text-[#66677f]">
              Choose a photo, screenshot, or PDF from your phone or computer.
            </span>
          </Link>
        </div>
      </div>
    </main>
  );
}
