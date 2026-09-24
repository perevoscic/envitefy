"use client";

export default function SignupEditorToolbar({
  onBack, onReset, onSave, busy, ready, loaded,
}: {
  onBack: () => void;
  onReset: () => void;
  onSave: () => void;
  busy: boolean;
  ready: boolean;
  loaded: boolean;
}) {
  return (
    <nav aria-label="Signup editor" className="mx-auto flex max-w-[1500px] items-center justify-between gap-2 text-sm">
      <button type="button" onClick={onBack} disabled={busy} className="min-h-11 shrink-0 whitespace-nowrap px-1 font-semibold text-[#59405c] disabled:opacity-50">
        ← Back
      </button>
      <div className="flex min-w-0 items-center gap-2 sm:gap-4">
        <button type="button" onClick={onReset} disabled={busy || !loaded} className="min-h-11 whitespace-nowrap px-1 underline disabled:opacity-50">
          Start over
        </button>
        <button type="button" onClick={onSave} disabled={busy || !ready} className="min-h-11 whitespace-nowrap rounded-full bg-[#59405c] px-3 py-2 font-semibold text-white disabled:opacity-50 sm:px-5">
          {busy ? "Saving…" : "Save as draft"}
        </button>
      </div>
    </nav>
  );
}
