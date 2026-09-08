import type { SignupMotif } from "@/lib/signup-designs";

/** Small print ornaments; they contain no content or interactive controls. */
export default function SignupDesignOrnament({ motif }: { motif: SignupMotif }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      {motif === "sprig" && (
        <path d="M18 55C25 43 37 30 46 8M26 43C8 42 12 28 26 43ZM33 32C17 31 21 17 33 32ZM39 21C27 18 32 7 39 21ZM28 41C45 45 49 30 28 41ZM36 28C50 30 54 17 36 28Z" />
      )}
      {motif === "star" && (
        <path d="m32 5 7 18 19-5-12 15 12 15-19-5-7 18-7-18-19 5 12-15L6 18l19 5Z" />
      )}
      {motif === "sun" && (
        <>
          <circle cx="32" cy="32" r="13" />
          <path d="M32 3v10M32 51v10M3 32h10M51 32h10M11 11l7 7M46 46l7 7M11 53l7-7M46 18l7-7" />
        </>
      )}
      {motif === "diamond" && (
        <>
          <path d="m32 4 22 28-22 28L10 32Zm0 9L17 32l15 19 15-19Z" />
          <circle cx="32" cy="32" r="4" />
        </>
      )}
      {motif === "stitch" && (
        <>
          <path d="M8 8h48v48H8ZM8 8l48 48M56 8 8 56M32 8v48M8 32h48" strokeDasharray="3 3" />
          <path d="m32 17 15 15-15 15-15-15Z" />
        </>
      )}
      {motif === "orbit" && (
        <>
          <circle cx="32" cy="32" r="19" />
          <ellipse cx="32" cy="32" rx="29" ry="11" transform="rotate(-35 32 32)" />
          <circle cx="47" cy="18" r="4" fill="currentColor" stroke="none" />
        </>
      )}
    </svg>
  );
}
