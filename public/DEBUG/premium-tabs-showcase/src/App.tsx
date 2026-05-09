import { useState } from "react";
import { motion } from "motion/react";
import { 
  Cake, Sparkles, Trophy, HelpCircle, Gift, X
} from "lucide-react";

const BridalShowerIcon = ({ className }: { className?: string }) => (
  <div className={`relative ${className} flex items-center justify-center`}>
    <Gift className="w-full h-full" />
    <Sparkles className="absolute -top-1 -right-1 w-[45%] h-[45%] text-inherit animate-pulse" />
  </div>
);

const BabyCarriageIcon = ({ className }: { className?: string }) => (
  <div className={`relative ${className} flex items-center justify-center`}>
    <svg 
      viewBox="0 0 32 32" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className="w-full h-full"
    >
      <path d="M23.6,27H8.4c-3,0-5.4-2.4-5.4-5.4V17h26v4.6C29,24.6,26.6,27,23.6,27z" />
      <path d="M23.3,17c1.1-0.7,1.9-1.8,2.4-3c0.1,0,0.2,0,0.3,0c1.1,0,2-0.9,2-2s-0.9-2-2-2c-0.1,0-0.2,0-0.3,0 c-0.8-2.3-3-4-5.7-4s-4.8,1.7-5.7,4c-0.1,0-0.2,0-0.3,0c-1.1,0-2,0.9-2,2s0.9,2,2,2c0.1,0,0.2,0,0.3,0c0.4,1.2,1.2,2.2,2.2,2.9" />
      <path d="M18,3L18,3c0,1.2,0.7,2.3,1.9,2.7L20.6,6" />
      <line x1="18" y1="11" x2="18" y2="13" />
      <line x1="22" y1="11" x2="22" y2="13" />
      <line x1="5" y1="29" x2="6" y2="26.8" />
      <line x1="27" y1="29" x2="26" y2="26.8" />
      <path d="M5,17V5.8C5,4.3,6.3,3,7.8,3h0c0.8,0,1.5,0.3,2,0.8L11,5" />
      <line x1="13" y1="4" x2="9" y2="7" />
    </svg>
    <Sparkles className="absolute -top-1 -right-1 w-[40%] h-[40%] text-inherit animate-pulse" />
  </div>
);

const RingsIcon = ({ className }: { className?: string }) => (
  <svg 
    className={className} 
    viewBox="0 0 512 512" 
    fill="currentColor" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <g>
      <path d="M371.769,176.364l30.47-30.47l-21.71-25.265h-52.305l-21.71,25.265l30.47,30.47 c-29.557,3.279-57.658,14.863-80.982,33.507c-23.324-18.644-51.425-30.228-80.982-33.507l30.47-30.47l-21.71-25.265h-52.305 l-21.71,25.265l30.47,30.47C61.471,185.049,0,251.988,0,333.024c0,86.914,70.71,157.625,157.625,157.625 c35.834,0,70.513-12.2,98.375-34.472c27.862,22.272,62.542,34.472,98.375,34.472C441.29,490.649,512,419.938,512,333.024 C512,251.988,450.529,185.049,371.769,176.364z M327.237,145.11l7.97-9.275h38.337l7.969,9.275l-27.138,27.138L327.237,145.11z M130.486,145.11l7.97-9.275h38.337l7.969,9.275l-27.138,27.138L130.486,145.11z M157.625,475.441 c-78.529,0-142.417-63.888-142.417-142.417s63.888-142.417,142.417-142.417c34.337,0,67.503,12.392,93.387,34.894 c8.035,6.984,15.308,14.898,21.618,23.522c17.933,24.508,27.412,53.555,27.412,84.002c0,27.573-7.775,54-22.563,76.946 c-0.192-0.192-0.376-0.39-0.566-0.583c-0.834-0.847-1.659-1.702-2.465-2.574c-0.357-0.386-0.705-0.781-1.055-1.172 c-0.661-0.736-1.315-1.479-1.955-2.233c-0.368-0.433-0.731-0.869-1.092-1.308c-0.618-0.751-1.225-1.513-1.823-2.28 c-0.337-0.432-0.675-0.863-1.005-1.3c-0.655-0.867-1.293-1.748-1.921-2.636c-0.195-0.275-0.396-0.545-0.589-0.823 c10.887-18.81,16.619-40.153,16.619-62.037c0-21.925-5.759-43.301-16.685-62.137l0.061-0.096l-2.58-4.072 c-4.983-7.859-10.817-15.117-17.407-21.662c-2.197-2.182-4.478-4.285-6.839-6.304l-6.234-5.332l-0.161,0.22 c-21.339-15.929-47.37-24.62-74.156-24.62c-68.375,0-124.002,55.628-124.002,124.002s55.627,124.001,124.002,124.001 c26.853,0,52.947-8.733,74.315-24.737c0.095,0.118,0.196,0.231,0.291,0.348c0.539,0.661,1.092,1.311,1.641,1.964 c0.423,0.501,0.841,1.007,1.269,1.503c0.586,0.677,1.185,1.342,1.782,2.01c0.409,0.457,0.812,0.92,1.226,1.372 c0.656,0.716,1.326,1.418,1.995,2.122c0.37,0.389,0.734,0.787,1.108,1.172c0.815,0.841,1.646,1.666,2.48,2.488 c0.228,0.225,0.449,0.456,0.677,0.68C219.606,465.022,189.107,475.441,157.625,475.441z M289.077,246.04 c18.767-14.095,41.689-21.81,65.298-21.81c59.989,0,108.794,48.805,108.794,108.794c0,59.989-48.805,108.792-108.794,108.792 c-23.608,0-46.531-7.715-65.298-21.81c17.142-25.819,26.172-55.735,26.172-86.984C315.249,301.775,306.22,271.858,289.077,246.04z M256,379.489c-6.834-14.454-10.418-30.285-10.418-46.465c0-16.18,3.584-32.012,10.418-46.465 c6.834,14.454,10.418,30.285,10.418,46.465C266.418,349.204,262.834,365.035,256,379.489z M222.923,246.04 c-17.142,25.819-26.172,55.735-26.172,86.984c0,31.248,9.029,61.165,26.172,86.984c-18.767,14.095-41.69,21.81-65.298,21.81 c-59.989,0-108.794-48.804-108.794-108.793S97.636,224.23,157.625,224.23C181.234,224.23,204.156,231.945,222.923,246.04z M354.375,475.441c-34.337,0-67.503-12.392-93.387-34.894c-8.034-6.983-15.308-14.898-21.618-23.522 c-17.933-24.508-27.412-53.555-27.412-84.001c0-27.573,7.775-54.001,22.562-76.946c0.194,0.194,0.38,0.394,0.572,0.589 c0.833,0.845,1.656,1.698,2.46,2.569c0.355,0.384,0.701,0.778,1.05,1.167c0.664,0.739,1.32,1.485,1.964,2.243 c0.364,0.429,0.724,0.862,1.082,1.296c0.622,0.756,1.233,1.522,1.835,2.294c0.334,0.428,0.669,0.855,0.997,1.289 c0.655,0.867,1.292,1.748,1.921,2.635c0.196,0.277,0.398,0.548,0.591,0.827c-10.887,18.81-16.619,40.153-16.619,62.038 c0,21.925,5.759,43.3,16.685,62.136l-0.062,0.096l2.581,4.072c6.643,10.478,14.8,19.888,24.245,27.966l6.234,5.332l0.161-0.221 c21.34,15.929,47.369,24.62,74.156,24.62c68.375,0,124.002-55.626,124.002-124.001s-55.626-124.001-124.002-124.001 c-26.853,0-52.947,8.733-74.315,24.738c-0.095-0.118-0.196-0.231-0.291-0.348c-0.538-0.66-1.089-1.309-1.638-1.96 c-0.424-0.503-0.844-1.011-1.274-1.508c-0.58-0.67-1.173-1.329-1.764-1.989c-0.416-0.464-0.825-0.935-1.246-1.394 c-0.642-0.701-1.298-1.387-1.951-2.075c-0.385-0.406-0.763-0.818-1.153-1.221c-0.781-0.805-1.577-1.594-2.373-2.382 c-0.262-0.259-0.516-0.525-0.78-0.783c24.804-19.075,55.302-29.493,86.786-29.493c78.529,0,142.417,63.888,142.417,142.417 C496.792,411.554,432.904,475.441,354.375,475.441z" />
    </g>
    <g>
      <rect x="248.396" y="21.351" width="15.208" height="47.344" />
    </g>
    <g>
      <rect x="294.983" y="52.217" transform="matrix(0.4198 -0.9076 0.9076 0.4198 130.5873 323.9224)" width="47.343" height="15.207" />
    </g>
    <g>
      <rect x="185.738" y="36.156" transform="matrix(0.9076 -0.4198 0.4198 0.9076 -7.2537 86.6932)" width="15.207" height="47.343" />
    </g>
  </svg>
);

/**
 * NEUMORPHIC SOFT (Clean Tabs)
 */
const NeumorphicTabs = () => {
  const [active, setActive] = useState<number | null>(null);
  const tabs = [
    { label: "Birthday", icon: Cake, color: "text-pink-500" },
    { label: "Bridal Shower", icon: BridalShowerIcon, color: "text-amber-500" },
    { label: "Wedding", icon: RingsIcon, color: "text-rose-500" },
    { label: "Baby Shower", icon: BabyCarriageIcon, color: "text-sky-400" },
    { label: "Game Day", icon: Trophy, color: "text-emerald-500" },
    { label: "None of the above", icon: HelpCircle, color: "text-zinc-500" }
  ];

  return (
    <nav className="grid grid-cols-2 md:grid-cols-3 gap-8 sm:gap-12">
      {tabs.map((tab, i) => {
        const Icon = tab.icon;
        const isActive = active === i;
        return (
          <button
            key={tab.label}
            onClick={() => setActive(isActive ? null : i)}
            className={`group relative flex flex-col items-center justify-center w-28 h-28 sm:w-40 sm:h-40 rounded-3xl sm:rounded-[2.5rem] transition-all duration-300 ${
              isActive 
                ? `bg-[#e0e5ec] shadow-[inset_6px_6px_12px_#b8bec7,inset_-6px_-6px_12px_#ffffff] ${tab.color} scale-95` 
                : "bg-[#e0e5ec] shadow-[10px_10px_20px_#b8bec7,-10px_-10px_20px_#ffffff] text-zinc-400 hover:text-zinc-500 active:scale-95"
            }`}
          >
            {isActive && (
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4 opacity-40">
                <X size={14} />
              </div>
            )}
            <Icon className={`w-8 h-8 sm:w-10 sm:h-10 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-105"}`} />
            <div className="relative mt-2 sm:mt-4">
              <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-colors ${isActive ? "text-white" : "text-zinc-400"}`}>
                {tab.label}
              </span>
              {isActive && (
                <motion.div 
                  layoutId="activeUnderline"
                  className="absolute -bottom-1 left-0 right-0 h-[2px] bg-white rounded-full"
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                />
              )}
            </div>
          </button>
        );
      })}
    </nav>
  );
};

export default function App() {
  return (
    <div className="min-h-screen bg-[#e0e5ec] flex items-center justify-center p-6 text-zinc-900">
      <NeumorphicTabs />
    </div>
  );
}
