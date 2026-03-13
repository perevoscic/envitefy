import styles from "./gymnastics-landing.module.css";

const items = [
  "Built for meet directors, host gyms, and coaches",
  "Structured around sessions, logistics, and family-facing updates",
  "Designed to work on phones during actual meet-day movement",
];

export default function FitStrip() {
  return (
    <section className={`${styles.sectionDivider} px-4 py-6 sm:px-6 lg:px-8`}>
      <div className={`${styles.container} grid gap-4 lg:grid-cols-3`}>
        {items.map((item, index) => (
          <div
            key={item}
            className={`rounded-[1.75rem] border px-5 py-5 shadow-[0_14px_30px_rgba(23,27,70,0.05)] ${
              index === 1
                ? "border-[#dfd0a0] bg-[#fff8e8]"
                : "border-[#dde2ee] bg-white/90"
            }`}
          >
            <p className="text-sm font-semibold leading-7 text-[#2f3b58]">{item}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
