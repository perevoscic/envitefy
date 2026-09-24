export default function Responses() {
  return (
    <section style={{ minHeight: 1600, padding: 24, borderRadius: 24, background: "white" }}>
      <h2>Guest responses</h2>
      <label>
        Guest search <input aria-label="Guest search" defaultValue="Unsaved search" />
      </label>
      <p style={{ marginTop: 72 }}>No responses yet</p>
      <p style={{ marginTop: 320 }}>Response list</p>
    </section>
  );
}
