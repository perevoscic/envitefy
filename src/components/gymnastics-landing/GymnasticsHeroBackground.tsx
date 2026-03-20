"use client";

/**
 * GymnasticsHeroBackground — v2
 * ─────────────────────────────
 * Premium animated hero background with clearly visible, gymnastics-inspired
 * ribbon motion. Every layer is designed to be perceptible within 2–3 seconds.
 *
 * Key changes from v1:
 *  • Ribbons are taller, higher-opacity, and less blurred → readable as shapes
 *  • Motion amplitude doubled or tripled → S-curves and arcs are obvious
 *  • Inner glow/edge layers added to ribbons for depth
 *  • Faster base tempo (12–18s vs. 22–26s) so movement is noticed immediately
 *  • Rotation amplified to ±6° for visible S-curve bending
 *  • Arc layers travel further with dramatic lift/descent
 */

export default function GymnasticsHeroBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
    >
      <style>{keyframes}</style>

      {/* ─── 1. Base gradient wash ─── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(160deg, #ede9fb 0%, #e8edfb 20%, #f1e8f7 45%, #e6ecfc 70%, #f0ebfa 100%)",
        }}
      />

      {/* ─── 2. Large bottom ambient glow — tumbling-pass momentum ───
           Wide warm glow that breathes upward like building energy */}
      <div
        className="absolute ghb-tumble-glow"
        style={{
          width: "120%",
          height: "50%",
          bottom: "-8%",
          left: "-10%",
          background:
            "radial-gradient(ellipse 75% 60% at 50% 80%, rgba(183,167,250,0.4) 0%, rgba(196,181,253,0.2) 40%, transparent 72%)",
          filter: "blur(40px)",
        }}
      />

      {/* ─── 3. PRIMARY RIBBON — sweeps a wide S-curve across the hero ───
           Tall, clearly visible band with inner glow edge. */}
      <div
        className="absolute ghb-ribbon-primary"
        style={{
          width: "160%",
          height: "28%",
          top: "16%",
          left: "-30%",
          background:
            "linear-gradient(90deg, transparent 0%, rgba(157,129,250,0.06) 8%, rgba(167,139,250,0.22) 20%, rgba(183,167,250,0.35) 38%, rgba(196,181,253,0.3) 52%, rgba(199,210,254,0.22) 68%, rgba(165,180,252,0.12) 82%, transparent 100%)",
          borderRadius: "50%",
          filter: "blur(22px)",
          transformOrigin: "40% 50%",
        }}
      />
      {/* ribbon inner highlight for edge definition */}
      <div
        className="absolute ghb-ribbon-primary"
        style={{
          width: "140%",
          height: "10%",
          top: "24%",
          left: "-20%",
          background:
            "linear-gradient(90deg, transparent 0%, rgba(221,214,254,0.08) 15%, rgba(233,213,255,0.28) 35%, rgba(255,255,255,0.18) 50%, rgba(221,214,254,0.22) 65%, rgba(199,210,254,0.08) 85%, transparent 100%)",
          borderRadius: "50%",
          filter: "blur(12px)",
          transformOrigin: "40% 50%",
        }}
      />

      {/* ─── 4. SECONDARY RIBBON — counter-movement for balance ───
           Moves opposite direction, slightly lower. */}
      <div
        className="absolute ghb-ribbon-secondary"
        style={{
          width: "150%",
          height: "24%",
          top: "48%",
          left: "-25%",
          background:
            "linear-gradient(90deg, transparent 0%, rgba(199,210,254,0.08) 10%, rgba(183,167,250,0.2) 25%, rgba(233,213,255,0.32) 45%, rgba(221,214,254,0.28) 60%, rgba(196,181,253,0.15) 78%, transparent 100%)",
          borderRadius: "50%",
          filter: "blur(24px)",
          transformOrigin: "60% 50%",
        }}
      />
      {/* secondary ribbon inner highlight */}
      <div
        className="absolute ghb-ribbon-secondary"
        style={{
          width: "130%",
          height: "8%",
          top: "56%",
          left: "-15%",
          background:
            "linear-gradient(90deg, transparent 0%, rgba(233,213,255,0.1) 20%, rgba(255,255,255,0.2) 45%, rgba(221,214,254,0.25) 60%, rgba(199,210,254,0.1) 80%, transparent 100%)",
          borderRadius: "50%",
          filter: "blur(10px)",
          transformOrigin: "60% 50%",
        }}
      />

      {/* ─── 5. ARC GLOW A — vault-like upward lift and descent ───
           Clearly visible arc that rises high and sweeps back down */}
      <div
        className="absolute ghb-arc-a"
        style={{
          width: "50%",
          height: "45%",
          top: "5%",
          right: "-8%",
          background:
            "radial-gradient(ellipse 60% 45% at 50% 50%, rgba(183,167,250,0.32) 0%, rgba(196,181,253,0.15) 45%, transparent 100%)",
          filter: "blur(25px)",
          borderRadius: "50%",
        }}
      />

      {/* ─── 6. ARC GLOW B — floor diagonal sweep ───
           Sweeps diagonally from lower-left upward */}
      <div
        className="absolute ghb-arc-b"
        style={{
          width: "45%",
          height: "40%",
          bottom: "10%",
          left: "2%",
          background:
            "radial-gradient(ellipse 55% 50% at 50% 50%, rgba(199,210,254,0.3) 0%, rgba(165,180,252,0.12) 50%, transparent 100%)",
          filter: "blur(25px)",
          borderRadius: "50%",
        }}
      />

      {/* ─── 7. ORBITING ACCENT — finishing-pose precision ───
           Small controlled orbit, clearly visible glow */}
      <div
        className="absolute ghb-orbit-accent"
        style={{
          width: "28%",
          height: "28%",
          top: "8%",
          right: "5%",
          background:
            "radial-gradient(circle at 50% 50%, rgba(233,213,255,0.35) 0%, rgba(221,214,254,0.15) 45%, transparent 100%)",
          filter: "blur(20px)",
          borderRadius: "50%",
        }}
      />

      {/* ─── 8. Flowing wave trail — thin ribbon accent ───
           A narrow, fast-moving accent band adding rhythmic pulse */}
      <div
        className="absolute ghb-wave-trail"
        style={{
          width: "180%",
          height: "6%",
          top: "38%",
          left: "-40%",
          background:
            "linear-gradient(90deg, transparent 0%, rgba(167,139,250,0.05) 15%, rgba(196,181,253,0.2) 35%, rgba(233,213,255,0.25) 50%, rgba(199,210,254,0.18) 65%, rgba(167,139,250,0.06) 85%, transparent 100%)",
          borderRadius: "50%",
          filter: "blur(8px)",
          transformOrigin: "50% 50%",
        }}
      />

      {/* ─── 9. Ultra-subtle grain overlay ─── */}
      <div
        className="absolute inset-0 opacity-[0.022]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "128px 128px",
        }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   KEYFRAMES v2 — amplified motion
   ─────────────────────────────────
   • Translate values 2–3× larger than v1
   • Rotation ±4–6° for S-curve bending
   • Faster cycles (12–18s) for immediate perception
   • Multi-stop keyframes for more complex paths
   ═══════════════════════════════════════════════════════════════════ */
const keyframes = `
/* ── Tumble glow: breathing rise from below ── */
@keyframes ghbTumbleGlow {
  0%   { transform: translateY(0%) translateX(0%) scale(1);    opacity: 0.7;  }
  25%  { transform: translateY(-10%) translateX(2%) scale(1.06); opacity: 1;    }
  50%  { transform: translateY(-5%) translateX(-1%) scale(1.03); opacity: 0.85; }
  75%  { transform: translateY(-12%) translateX(1%) scale(1.08); opacity: 0.95; }
  100% { transform: translateY(0%) translateX(0%) scale(1);    opacity: 0.7;  }
}
.ghb-tumble-glow {
  animation: ghbTumbleGlow 12s ease-in-out infinite;
  will-change: transform, opacity;
}

/* ── Primary ribbon: dramatic S-curve sweep ──
     Large horizontal travel + vertical wave + rotation = visible S-path */
@keyframes ghbRibbonPrimary {
  0%   { transform: translateX(0%)   translateY(0%)    rotate(0deg)   scaleY(1);    }
  15%  { transform: translateX(8%)   translateY(-5%)   rotate(3.5deg) scaleY(1.15); }
  30%  { transform: translateX(14%)  translateY(3%)    rotate(-2deg)  scaleY(0.88); }
  50%  { transform: translateX(10%)  translateY(-6%)   rotate(5deg)   scaleY(1.2);  }
  65%  { transform: translateX(4%)   translateY(4%)    rotate(-3deg)  scaleY(0.9);  }
  80%  { transform: translateX(-4%)  translateY(-2%)   rotate(2deg)   scaleY(1.08); }
  100% { transform: translateX(0%)   translateY(0%)    rotate(0deg)   scaleY(1);    }
}
.ghb-ribbon-primary {
  animation: ghbRibbonPrimary 16s ease-in-out infinite;
  will-change: transform;
}

/* ── Secondary ribbon: counter-rhythm opposite sweep ──
     Moves opposite direction for balanced composition */
@keyframes ghbRibbonSecondary {
  0%   { transform: translateX(0%)    translateY(0%)    rotate(0deg)    scaleY(1);    }
  20%  { transform: translateX(-10%)  translateY(5%)    rotate(-4deg)   scaleY(1.18); }
  40%  { transform: translateX(-6%)   translateY(-4%)   rotate(3deg)    scaleY(0.85); }
  55%  { transform: translateX(-14%)  translateY(3%)    rotate(-5.5deg) scaleY(1.22); }
  75%  { transform: translateX(-3%)   translateY(-3%)   rotate(2.5deg)  scaleY(0.92); }
  90%  { transform: translateX(5%)    translateY(2%)    rotate(-1.5deg) scaleY(1.05); }
  100% { transform: translateX(0%)    translateY(0%)    rotate(0deg)    scaleY(1);    }
}
.ghb-ribbon-secondary {
  animation: ghbRibbonSecondary 18s ease-in-out infinite;
  will-change: transform;
}

/* ── Arc A: dramatic vault lift → float → descend ── */
@keyframes ghbArcA {
  0%   { transform: translate(0%, 0%)      rotate(0deg);    opacity: 0.5; }
  20%  { transform: translate(-10%, -18%)   rotate(5deg);    opacity: 1;   }
  40%  { transform: translate(-5%, -24%)    rotate(2deg);    opacity: 0.85;}
  60%  { transform: translate(5%, -12%)     rotate(-4deg);   opacity: 0.95;}
  80%  { transform: translate(8%, -4%)      rotate(-1deg);   opacity: 0.7; }
  100% { transform: translate(0%, 0%)       rotate(0deg);    opacity: 0.5; }
}
.ghb-arc-a {
  animation: ghbArcA 14s ease-in-out infinite;
  will-change: transform, opacity;
}

/* ── Arc B: floor diagonal sweep ── */
@keyframes ghbArcB {
  0%   { transform: translate(0%, 0%)      rotate(0deg);    opacity: 0.45; }
  25%  { transform: translate(14%, -14%)   rotate(-4deg);   opacity: 1;    }
  45%  { transform: translate(20%, -8%)    rotate(3deg);    opacity: 0.8;  }
  70%  { transform: translate(10%, 4%)     rotate(-2deg);   opacity: 0.9;  }
  100% { transform: translate(0%, 0%)      rotate(0deg);    opacity: 0.45; }
}
.ghb-arc-b {
  animation: ghbArcB 15s ease-in-out infinite;
  will-change: transform, opacity;
}

/* ── Orbit accent: controlled elliptical loop ── */
@keyframes ghbOrbitAccent {
  0%   { transform: translate(0%, 0%)      scale(1);     opacity: 0.5; }
  25%  { transform: translate(-14%, 12%)   scale(1.12);  opacity: 0.95;}
  50%  { transform: translate(-6%, 20%)    scale(0.92);  opacity: 0.7; }
  75%  { transform: translate(8%, 8%)      scale(1.08);  opacity: 0.9; }
  100% { transform: translate(0%, 0%)      scale(1);     opacity: 0.5; }
}
.ghb-orbit-accent {
  animation: ghbOrbitAccent 17s ease-in-out infinite;
  will-change: transform, opacity;
}

/* ── Wave trail: fast-moving thin accent ── */
@keyframes ghbWaveTrail {
  0%   { transform: translateX(0%)   translateY(0%)   rotate(0deg)   scaleY(1);   opacity: 0.6; }
  20%  { transform: translateX(12%)  translateY(-3%)  rotate(2deg)   scaleY(1.3); opacity: 1;   }
  40%  { transform: translateX(20%)  translateY(2%)   rotate(-1deg)  scaleY(0.8); opacity: 0.7; }
  60%  { transform: translateX(14%)  translateY(-4%)  rotate(3deg)   scaleY(1.4); opacity: 0.9; }
  80%  { transform: translateX(4%)   translateY(1%)   rotate(-1.5deg)scaleY(0.9); opacity: 0.75;}
  100% { transform: translateX(0%)   translateY(0%)   rotate(0deg)   scaleY(1);   opacity: 0.6; }
}
.ghb-wave-trail {
  animation: ghbWaveTrail 11s ease-in-out infinite;
  will-change: transform, opacity;
}

/* ── Mobile: moderate reduction, NOT invisible ── */
@media (max-width: 768px) {
  .ghb-ribbon-primary   { animation-duration: 20s; filter: blur(28px) !important; }
  .ghb-ribbon-secondary { animation-duration: 22s; filter: blur(30px) !important; }
  .ghb-arc-a            { animation-duration: 18s; opacity: 0.6; }
  .ghb-arc-b            { animation-duration: 19s; opacity: 0.55; }
  .ghb-orbit-accent     { animation-duration: 21s; opacity: 0.5; }
  .ghb-wave-trail       { animation-duration: 14s; opacity: 0.5; }
  .ghb-tumble-glow      { animation-duration: 15s; }
}

/* ── Respect reduced motion preference ── */
@media (prefers-reduced-motion: reduce) {
  .ghb-tumble-glow,
  .ghb-ribbon-primary,
  .ghb-ribbon-secondary,
  .ghb-arc-a,
  .ghb-arc-b,
  .ghb-orbit-accent,
  .ghb-wave-trail {
    animation: none !important;
  }
}
`;
