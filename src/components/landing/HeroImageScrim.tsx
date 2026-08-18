export default function HeroImageScrim() {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(90deg,rgba(16,11,14,0.52)_0%,rgba(16,11,14,0.28)_40%,rgba(16,11,14,0.10)_100%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(0deg,rgba(16,11,14,0.40)_0%,rgba(16,11,14,0.04)_44%,rgba(16,11,14,0.22)_100%)]"
        aria-hidden="true"
      />
    </>
  );
}
