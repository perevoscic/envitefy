export const useMenuOptional = () => null;

export default function PublicChrome() {
  return <nav aria-label="Public navigation" data-fixture-public-nav style={{ position: "fixed", inset: "0 0 auto", height: 64, zIndex: 100, background: "#261f2b", color: "white", padding: 20 }}>Envitefy</nav>;
}
