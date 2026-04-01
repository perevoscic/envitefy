"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function PricingStrip({ isAuthed }: { isAuthed: boolean }) {
  return (
    <section className="w-full bg-white py-20">
      <div className="mx-auto max-w-5xl px-6">
        <div className="relative overflow-hidden rounded-[3rem] border border-gray-100 bg-white px-6 py-16 text-center text-gray-900 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] md:px-16 md:py-20">
          <div className="pointer-events-none absolute left-0 top-0 z-0 h-full w-full overflow-hidden opacity-40">
            <div className="absolute left-1/4 top-0 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-blue-50 blur-[100px]" />
            <div className="absolute bottom-0 right-1/4 h-[500px] w-[500px] translate-y-1/2 rounded-full bg-violet-50 blur-[100px]" />
          </div>

          <div className="relative z-10">
            <h3 className="mb-6 text-3xl font-bold tracking-tight md:text-5xl">
              Choose your entry point
            </h3>
            <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-gray-600 md:text-xl">
              New accounts start from Snap or Gymnastics. Existing users can
              keep signing in as usual.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              {isAuthed ? (
                <Link
                  href="/"
                  className="rounded-full bg-black px-8 py-4 text-lg font-semibold text-white shadow-lg transition-colors hover:-translate-y-0.5 hover:bg-gray-800 hover:shadow-xl"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/snap"
                    className="group flex items-center gap-2 rounded-full bg-black px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-gray-800 hover:shadow-xl"
                  >
                    Create a Snap account
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href="/gymnastics"
                    className="rounded-full border border-gray-200 bg-white px-8 py-4 text-lg font-semibold text-gray-800 transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-lg"
                  >
                    Create a Gymnastics account
                  </Link>
                </>
              )}
            </div>

            <p className="mt-6 text-sm text-gray-500">
              Snap is available to every account. Gymnastics signups include
              both products.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
