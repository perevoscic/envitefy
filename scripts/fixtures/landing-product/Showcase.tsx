// The real hero sample is exercised; the independent heavy carousel has its own tests.
export default function Showcase({ sectionId }: { sectionId?: string }) {
  return (
    <section
      id={sectionId}
      aria-label="Deferred live-card fixture"
      style={{ minHeight: 240, padding: "3rem" }}
    >
      Deferred live-card examples fixture
    </section>
  );
}
