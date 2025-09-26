// Tailwind CSS configuration: preserve dynamic gradient classes used for Shared Events
// so production builds don’t purge them.
/** @type {import('tailwindcss').Config} */
module.exports = {
  // Tailwind v4 reads content automatically; we only need a safelist here.
  safelist: [
    // Shared gradients (both 200 + 300 sets used in calendar/sidebar)
    'bg-gradient-to-br',
    'from-cyan-200','via-sky-200','to-fuchsia-200',
    'from-rose-200','via-fuchsia-200','to-indigo-200',
    'from-emerald-200','via-teal-200','to-sky-200',
    'from-amber-200','via-orange-200','to-pink-200',
    'from-indigo-200','via-blue-200','to-cyan-200',
    'from-lime-200','via-green-200','to-emerald-200',
    'from-purple-200','via-fuchsia-200','to-pink-200',
    'from-slate-200','via-zinc-200','to-sky-200',
    'from-cyan-300','via-sky-300','to-fuchsia-300',
  ],
};


