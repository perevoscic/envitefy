"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import AuthModal from "@/components/auth/AuthModal";

export default function PricingStrip({ isAuthed }: { isAuthed: boolean }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const primaryHref = "/calendar"; // Redirect to dashboard if authed

  return (
    <section className="w-full py-20 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <div className="relative rounded-[3rem] overflow-hidden bg-gradient-to-br from-blue-600 to-violet-600 text-white px-6 py-16 md:px-16 md:py-20 text-center shadow-2xl shadow-blue-200/50">
          {/* Background Effects */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-white/10 rounded-full blur-[100px] -translate-y-1/2" />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-pink-500/20 rounded-full blur-[100px] translate-y-1/2" />
          </div>

          <div className="relative z-10">
            <h3 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
              Ready to clear the clutter?
            </h3>
            <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto mb-10 leading-relaxed">
              Join thousands of parents and planners who save hours every week.
              Start snapping your events today.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {isAuthed ? (
                <Link
                  href={primaryHref}
                  className="px-8 py-4 bg-white text-blue-700 rounded-full text-lg font-semibold hover:bg-blue-50 transition-colors shadow-lg"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <button
                  onClick={() => {
                    setMode("signup");
                    setOpen(true);
                  }}
                  className="group px-8 py-4 bg-white text-blue-700 rounded-full text-lg font-semibold hover:bg-blue-50 transition-all shadow-lg flex items-center gap-2"
                >
                  Get Started for Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </div>

            <p className="mt-6 text-sm text-blue-200">
              No credit card required • Free plan available
            </p>
          </div>
        </div>
      </div>
      <AuthModal
        open={open}
        mode={mode}
        onClose={() => setOpen(false)}
        onModeChange={setMode}
      />
    </section>
  );
}
