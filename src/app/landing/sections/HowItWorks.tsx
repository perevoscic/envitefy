"use client";

export default function HowItWorks() {
  const shareProviders = [
    {
      label: "Google",
      color: "#4285F4",
      accent: "#E8F0FE",
      icon: (
        <>
          <path
            d="M9.6 5.1c0-.3-.03-.6-.08-.9H5v1.8h2.6c-.11.6-.45 1.1-.96 1.4v1.1h1.55c.9-.83 1.41-2.05 1.41-3.4Z"
            fill="#4285F4"
          />
          <path
            d="M5 10c1.17 0 2.15-.39 2.86-1.05L6.36 7.78c-.4.27-.92.43-1.36.43-1.05 0-1.95-.71-2.27-1.67H1v1.05A4.99 4.99 0 0 0 5 10Z"
            fill="#34A853"
          />
          <path
            d="M2.73 6.54a3 3 0 0 1 0-1.9V3.5H1a5 5 0 0 0 0 3.99l1.73-1Z"
            fill="#FBBC05"
          />
          <path
            d="M5 2.08c.64 0 1.22.22 1.68.64l1.25-1.25A4.99 4.99 0 0 0 1 3.5l1.79 1.1C3.28 3.48 4.1 2.08 5 2.08Z"
            fill="#EA4335"
          />
        </>
      ),
    },
    {
      label: "Apple",
      color: "#0f172a",
      accent: "#f5f5f7",
      icon: (
        <>
          <path
            d="M6.4 1.8c-.5.6-.8 1.4-.7 2.2.8.1 1.6-.3 2.1-.9.4-.5.7-1.3.6-2.1-.8-.1-1.6.3-2 .8z"
            fill="#0f172a"
          />
          <path
            d="M8.8 4.3c-1-.1-1.8.6-2.3.6-.5 0-1.2-.6-2-.6C3 4.3 1.5 5.6 1.5 7.9c0 2.2 1.4 4.8 2.3 4.8.7 0 .9-.4 1.8-.4.9 0 1.1.4 1.8.4.9 0 2.2-2.3 2.2-4.6 0-1.8-.8-3.3-1.8-3.8z"
            fill="#0f172a"
          />
        </>
      ),
    },
    {
      label: "Outlook",
      color: "#0364B8",
      accent: "#E7F1FF",
      icon: (
        <>
          <rect x="0.5" y="2" width="9" height="8" rx="1.2" fill="#0364B8" />
          <path
            d="M0.5 2.6L5 6l4.5-3.4"
            fill="none"
            stroke="#ffffff"
            strokeWidth="0.8"
          />
          <rect x="3" y="4" width="6.5" height="5" rx="0.8" fill="#ffffff" />
          <path
            d="M3 4.3l3.25 2.2L9.5 4.3"
            fill="none"
            stroke="#0364B8"
            strokeWidth="0.6"
          />
        </>
      ),
    },
  ];

  return (
    <section
      id="how-it-works"
      className="how-it-works-root relative overflow-hidden glow-background p-6 sm:p-10"
    >
      <style jsx>{`
        .how-it-works-root {
          --color-primary: #7F8CFF;
          --color-secondary: #9a84ff;
          --color-text-dark: #1f2937;
          --color-bg-light: #fbfbfb;
          background-color: var(--color-bg-light);
          font-family: "Inter", ui-sans-serif, system-ui, -apple-system,
            BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .glow-background::before {
          content: "";
          position: absolute;
          top: -100px;
          left: -100px;
          width: 300px;
          height: 300px;
          background: var(--color-primary);
          opacity: 0.1;
          filter: blur(80px);
          border-radius: 50%;
          z-index: -1;
          animation: moveGlow1 15s infinite alternate;
        }

        .glow-background::after {
          content: "";
          position: absolute;
          bottom: -50px;
          right: -50px;
          width: 400px;
          height: 400px;
          background: var(--color-secondary);
          opacity: 0.08;
          filter: blur(90px);
          border-radius: 50%;
          z-index: -1;
          animation: moveGlow2 20s infinite alternate;
        }

        @keyframes moveGlow1 {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(100vw, 50vh);
          }
        }

        @keyframes moveGlow2 {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(-100vw, -50vh);
          }
        }

        .step-card {
          background-color: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(10px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05),
            0 0 0 1px rgba(0, 0, 0, 0.03);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .step-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }

        .text-primary-glow {
          color: var(--color-primary);
          text-shadow: 0 0 5px rgba(18, 185, 217, 0.4);
        }

        .text-secondary-glow {
          color: var(--color-secondary);
          text-shadow: 0 0 5px rgba(0, 204, 153, 0.4);
        }

        .icon-bg-primary {
          background-color: var(--color-primary);
        }

        .icon-bg-secondary {
          background-color: var(--color-secondary);
        }
      `}</style>

      <div className="relative max-w-6xl mx-auto w-full text-center py-12 sm:py-20">
        <p className="uppercase text-xs font-semibold tracking-[0.3em] text-primary-glow mb-3">
          The effortless family organization
        </p>

        <h2
          className="text-4xl sm:text-6xl lg:text-7xl font-extrabold mb-4 leading-tight"
          style={{ color: "var(--color-text-dark)" }}
        >
          From <span className="text-secondary-glow">Photo to Perfect</span>
          <br className="hidden sm:inline" /> Calendar Sync
        </h2>

        <p className="text-lg sm:text-2xl text-[#5a5377] max-w-3xl mx-auto mb-16">
          Eliminate manual entry. Our intuitive AI handles the organization so
          you can reclaim your time and focus on what matters.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 text-left">
          <div className="step-card p-6 sm:p-8 rounded-3xl">
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-xl icon-bg-primary shadow-lg mr-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                  <circle cx="12" cy="13" r="3" />
                </svg>
              </div>
              <h3 className="text-3xl font-bold text-primary-glow">
                1. Capture
              </h3>
            </div>
            <p className="text-[#5a5377] text-lg mb-6">
              Snap a quick photo of any physical document, schedule, or invite.
              Effortless input.
            </p>
            <div className="h-40 rounded-2xl p-4 relative overflow-hidden bg-gradient-to-br from-white via-[#f3eeff] to-[#ece6ff]">
              <svg
                viewBox="0 0 260 160"
                className="absolute inset-0 w-full h-full"
                role="img"
                aria-label="Phone capturing a document"
              >
                <defs>
                  <linearGradient id="beam" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgba(18,185,217,0.25)" />
                    <stop offset="100%" stopColor="rgba(18,185,217,0.05)" />
                  </linearGradient>
                  <linearGradient id="hand" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#d7bca4" />
                    <stop offset="100%" stopColor="#cba989" />
                  </linearGradient>
                </defs>
                <rect
                  width="260"
                  height="160"
                  fill="url(#beam)"
                  opacity="0.15"
                />
                <path
                  d="M85 70 L50 130 L180 130 L155 70 Z"
                  fill="url(#beam)"
                  opacity="0.7"
                />
                <rect
                  x="65"
                  y="90"
                  width="110"
                  height="60"
                  rx="8"
                  fill="#fff"
                  stroke="rgba(18,185,217,0.25)"
                  strokeWidth="2"
                />
                <rect
                  x="85"
                  y="104"
                  width="35"
                  height="8"
                  rx="4"
                  fill="#e2e8f0"
                />
                <rect
                  x="85"
                  y="118"
                  width="55"
                  height="6"
                  rx="3"
                  fill="#cbd5f5"
                />
                <rect
                  x="85"
                  y="130"
                  width="70"
                  height="6"
                  rx="3"
                  fill="#e2e8f0"
                />
                <rect
                  x="140"
                  y="104"
                  width="22"
                  height="22"
                  rx="5"
                  fill="none"
                  stroke="#7F8CFF"
                  strokeWidth="2"
                />
                <rect
                  x="147"
                  y="111"
                  width="8"
                  height="8"
                  rx="2"
                  fill="#7F8CFF"
                  opacity="0.2"
                />
                <path
                  d="M150 35 C165 35 188 50 196 65 C205 82 204 107 190 110 C176 113 140 65 140 65Z"
                  fill="url(#hand)"
                  opacity="0.85"
                />
                <rect
                  x="128"
                  y="28"
                  width="62"
                  height="98"
                  rx="18"
                  fill="#fdfdfd"
                  stroke="#e5e7eb"
                  strokeWidth="3"
                />
                <rect
                  x="138"
                  y="40"
                  width="42"
                  height="74"
                  rx="12"
                  fill="#ffffff"
                />
                <circle cx="159" cy="70" r="16" fill="none" stroke="#7F8CFF" />
                <rect
                  x="153"
                  y="64"
                  width="12"
                  height="12"
                  rx="3"
                  fill="#7F8CFF"
                  opacity="0.15"
                />
                <rect
                  x="155"
                  y="120"
                  width="16"
                  height="4"
                  rx="2"
                  fill="#e5e7eb"
                />
              </svg>
            </div>
          </div>

          <div className="step-card p-6 sm:p-8 rounded-3xl">
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-xl icon-bg-secondary shadow-lg mr-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9.9 16.9a1 1 0 0 0 1.4.1l1.7-1.7a1 1 0 0 1 .8-.3h2.9a1 1 0 0 0 .9-1.5L16 11.4a1 1 0 0 1-.3-.8V7.7a1 1 0 0 0-1.5-.9L11.4 6a1 1 0 0 1-.8-.3V1.7a1 1 0 0 0-1.5-.9L7.7 4a1 1 0 0 1-.3.8v2.9a1 1 0 0 0-.9 1.5l1.7 1.7a1 1 0 0 1 .3.8z" />
                  <path d="M22 19.5c.3.3.3.9 0 1.2s-.9.3-1.2 0L19.5 19l-.5.5c-.3.3-.9.3-1.2 0s-.3-.9 0-1.2l.5-.5-1.2-1.2c-.3-.3-.3-.9 0-1.2s.9-.3 1.2 0l1.2 1.2.5-.5c.3-.3.9-.3 1.2 0s.3.9 0 1.2L20.5 19l.5.5z" />
                  <path d="M4 11.5c.3.3.3.9 0 1.2s-.9.3-1.2 0L1.5 11l-.5.5c-.3.3-.9.3-1.2 0s-.3-.9 0-1.2l.5-.5-1.2-1.2c-.3-.3-.3-.9 0-1.2s.9-.3 1.2 0l1.2 1.2.5-.5c.3-.3.9-.3 1.2 0s.3.9 0 1.2L2.5 11l.5.5z" />
                </svg>
              </div>
              <h3 className="text-3xl font-bold text-secondary-glow">
                2. Organize
              </h3>
            </div>
            <p className="text-[#5a5377] text-lg mb-6">
              We automatically pull the key details: Who, What, When, Where.
            </p>
            <div className="h-40 bg-white rounded-2xl p-4 relative overflow-hidden">
              <svg
                viewBox="0 0 260 160"
                className="absolute inset-0 w-full h-full"
                role="img"
                aria-label="Document feeding structured fields"
              >
                <defs>
                  <linearGradient id="organizeFlow" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(0,204,153,0.45)" />
                    <stop offset="100%" stopColor="rgba(18,185,217,0.45)" />
                  </linearGradient>
                </defs>
                <rect width="260" height="160" fill="#f8fafc" opacity="0.6" />
                <g transform="translate(50,70)">
                  <rect
                    x="0"
                    y="0"
                    width="120"
                    height="60"
                    rx="10"
                    fill="#fff"
                    stroke="rgba(18,185,217,0.25)"
                    strokeWidth="2"
                  />
                  <path
                    d="M0 0 Q65 -30 120 0"
                    fill="#fff"
                    stroke="rgba(18,185,217,0.15)"
                    strokeWidth="2"
                  />
                  <rect x="20" y="18" width="34" height="8" rx="4" fill="#e2e8f0" />
                  <rect x="20" y="32" width="52" height="6" rx="3" fill="#cbd5f5" />
                  <rect x="20" y="44" width="70" height="6" rx="3" fill="#e2e8f0" />
                  <rect
                    x="80"
                    y="20"
                    width="22"
                    height="22"
                    rx="5"
                    fill="none"
                    stroke="#7F8CFF"
                  />
                  <rect
                    x="87"
                    y="27"
                    width="8"
                    height="8"
                    rx="2"
                    fill="#7F8CFF"
                    opacity="0.2"
                  />
                </g>
                {["Who", "What", "When", "Where"].map((label, index) => {
                  const iconMap = [
                    <path
                      key="who"
                      d="M15 12a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm-6 9c0-3.3 2.7-6 6-6s6 2.7 6 6"
                      stroke="#94a3b8"
                      fill="none"
                      strokeWidth="1.8"
                    />,
                    <path
                      key="what"
                      d="M10 10a5 5 0 1 1 3.5 4.8L12 18"
                      stroke="#94a3b8"
                      fill="none"
                      strokeWidth="2"
                    />,
                    <g key="when">
                      <circle cx="14" cy="14" r="8" stroke="#94a3b8" fill="none" />
                      <path
                        d="M14 8v6l3 2"
                        stroke="#94a3b8"
                        fill="none"
                        strokeWidth="2"
                      />
                    </g>,
                    <path
                      key="where"
                      d="M14 8a5 5 0 0 1 5 5c0 4-5 9-5 9s-5-5-5-9a5 5 0 0 1 5-5z"
                      stroke="#94a3b8"
                      fill="none"
                      strokeWidth="2"
                    />,
                  ];
                  const positions = [
                    { x: 150, y: 35 },
                    { x: 180, y: 20 },
                    { x: 210, y: 35 },
                    { x: 240, y: 50 },
                  ];
                  const flows = [
                    "M125 80 C150 70 150 55 150 45",
                    "M130 78 C170 58 180 50 180 38",
                    "M132 90 C190 74 210 60 210 48",
                    "M125 95 C200 82 240 70 240 56",
                  ];

                  return (
                    <g key={label}>
                      <path
                        d={flows[index]}
                        stroke="url(#organizeFlow)"
                        strokeWidth="2"
                        fill="none"
                      />
                      <g transform={`translate(${positions[index].x - 25}, ${positions[index].y - 22})`}>
                        <rect
                          width="55"
                          height="48"
                          rx="10"
                          fill="#fff"
                          stroke="rgba(15,23,42,0.08)"
                        />
                        <g transform="translate(10,10)">{iconMap[index]}</g>
                        <text
                          x="27.5"
                          y="38"
                          fontSize="11"
                          textAnchor="middle"
                          fill="#475569"
                          fontWeight="600"
                        >
                          {label}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          <div className="step-card p-6 sm:p-8 rounded-3xl">
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-xl bg-[#5e69d9] shadow-lg mr-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M8 12L12 16L20 4" />
                  <path d="M12 12L16 16L24 4" transform="translate(-4, 0)" />
                  <path d="M2 12L6 16L14 4" transform="translate(2, 0)" />
                </svg>
              </div>
              <h3
                className="text-3xl font-bold"
                style={{ color: "var(--color-text-dark)" }}
              >
                3. Share
              </h3>
            </div>
            <p className="text-[#5a5377] text-lg mb-6">
              Events immediately appear across all family calendars (Google,
              Apple, Outlook).
            </p>
            <div className="h-40 bg-[#f6f2ff] rounded-2xl p-4 relative overflow-hidden">
              <svg
                viewBox="0 0 260 160"
                className="absolute inset-0 w-full h-full"
                role="img"
                aria-label="Event details syncing to calendars"
              >
                <defs>
                  <radialGradient id="shareGlow" cx="50%" cy="50%" r="60%">
                    <stop offset="0%" stopColor="rgba(18,185,217,0.4)" />
                    <stop offset="100%" stopColor="rgba(18,185,217,0.05)" />
                  </radialGradient>
                </defs>
                <rect width="260" height="160" fill="url(#shareGlow)" opacity="0.35" />
                <g transform="translate(40,70)">
                  <circle
                    cx="0"
                    cy="0"
                    r="42"
                    fill="#fff"
                    stroke="rgba(18,185,217,0.3)"
                    strokeWidth="2"
                  />
                  <circle
                    cx="0"
                    cy="0"
                    r="30"
                    fill="rgba(18,185,217,0.08)"
                    stroke="none"
                  />
                  <g transform="translate(-14,-12)" stroke="#7F8CFF" strokeWidth="2" fill="none">
                    <path d="M10 10l20-10-10 20" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="10" cy="18" r="4" />
                    <circle cx="24" cy="28" r="4" />
                    <circle cx="34" cy="6" r="4" />
                  </g>
                  <text
                    x="0"
                    y="56"
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="600"
                    fill="#475569"
                  >
                    Share once
                  </text>
                </g>
                {shareProviders.map((provider, index) => {
                  const positions = [
                    { x: 190, y: 50 },
                    { x: 210, y: 105 },
                    { x: 185, y: 150 },
                  ];
                  const target = positions[index];
                  const controlY = 70 + index * 20;
                  return (
                    <g key={provider.label}>
                      <path
                        d={`M80 70 C130 ${controlY} 160 ${target.y - 20} ${target.x} ${target.y}`}
                        stroke="rgba(15,23,42,0.2)"
                        strokeWidth="2.5"
                        fill="none"
                      />
                      <g transform={`translate(${target.x - 35},${target.y - 30})`}>
                        <rect
                          width="70"
                          height="56"
                          rx="14"
                          fill="#fff"
                          stroke="rgba(15,23,42,0.12)"
                        />
                        <g transform="translate(25,18)">
                          <rect
                            width="20"
                            height="20"
                            rx="6"
                            fill={provider.accent}
                            stroke={provider.color}
                            opacity="0.95"
                          />
                          <g transform="translate(5,5)">{provider.icon}</g>
                        </g>
                        <text
                          x="35"
                          y="48"
                          textAnchor="middle"
                          fontSize="11"
                          fill="#475569"
                          fontWeight="600"
                        >
                          {provider.label}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
