import Image from "next/image";
import CreateShareCta from "./CreateShareCta";

const points = [
  "Share one link by text or email—guests don’t need an account.",
  "Add to Google, Apple, or Outlook calendars in one tap.",
  "Tap to RSVP by text or email with a pre‑filled message.",
  "Show a friendly venue name and full address; open maps for directions.",
  "Attach the invite or photos to the event page.",
  "Edit time or place later — everyone sees updates instantly.",
  "Guests can open the link in any browser to RSVP by text or email.",
  "Add registries or wish lists (Amazon, Target, Walmart, Babylist).",
  "Choose a category (Birthday, Wedding, Baby Shower, etc.).",
  "Quick RSVP prompt with Yes/No/Maybe when a phone number is shown.",
  "Share, Email, RSVP and Directions buttons on the event page.",
];

const calendarTargets = [
  {
    alt: "Apple",
    light: "/brands/apple-black.svg",
    dark: "/brands/apple-white.svg",
  },
  {
    alt: "Google",
    light: "/brands/google.svg",
    dark: "/brands/google.svg",
  },
  {
    alt: "Microsoft",
    light: "/brands/microsoft.svg",
    dark: "/brands/microsoft.svg",
  },
];

const rsvpStatuses = [
  {
    label: "Yes",
    icon: "\u{2705}",
    chipClass: "bg-[#e6f6ef] text-[#1f3b32] border border-[#c1eadb]",
  },
  {
    label: "No",
    icon: "\u{274C}",
    chipClass: "bg-[#fde6e4] text-[#591c1c] border border-[#f3c3be]",
  },
  {
    label: "Maybe",
    icon: "\u{1F914}",
    chipClass: "bg-[#fff1da] text-[#5a3a11] border border-[#f4d6a7]",
  },
];

const registries = [
  {
    label: "Amazon",
    badge: "A",
    badgeClass:
      "bg-[#f4e4d6] text-[#7b4d2a] text-xs font-semibold tracking-wide",
  },
  {
    label: "Target",
    badge: "T",
    badgeClass:
      "bg-[#fce9ef] text-[#7a2f47] text-xs font-semibold tracking-wide",
  },
  {
    label: "Walmart",
    badge: "W",
    badgeClass:
      "bg-[#e8f0ff] text-[#1f498a] text-xs font-semibold tracking-wide",
  },
];

const footerActions = [
  {
    label: "Share",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
    ),
  },
  {
    label: "Email",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <polyline points="22,7 12,13 2,7" />
      </svg>
    ),
  },
  {
    label: "RSVP",
    icon: (
      <svg
        fill="currentColor"
        viewBox="0 0 14 14"
        role="img"
        focusable="false"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
      >
        <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
        <g
          id="SVGRepo_tracerCarrier"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></g>
        <g id="SVGRepo_iconCarrier">
          <path d="m 4.315027,12.158602 c -0.9166805,-0.4626 -1.7278542,-0.903 -1.8026191,-0.9788 -0.1478698,-0.1498 -1.4890884,-4.2157996 -1.4890884,-4.5141996 0,-0.1794 1.9277474,-3.8667 2.4722734,-4.7288 0.3461929,-0.5482 0.6940858,-0.7692 1.21135,-0.7696 0.5126739,-6e-4 0.816424,0.1402 0.816424,0.3779 0,0.2828 -0.1781318,0.3785 -0.5974395,0.3211 -0.3147608,-0.043 -0.4060468,-0.021 -0.5947593,0.1457 -0.272448,0.2404 -2.4114894,4.1964 -2.3740869,4.3907 0.015001,0.078 0.3915959,0.3334 0.8590168,0.5825 0.9503928,0.5065 1.2472424,0.7564 1.3812813,1.1626 0.1429494,0.4331 0.029302,0.8899 -0.4433493,1.7825 -0.3793751,0.7163996 -0.4144374,0.8241996 -0.3094305,0.9506996 0.1626808,0.1961 2.7174796,1.4529 2.9532752,1.4529 0.2985297,0 0.5355554,-0.2492 0.9499528,-0.9982 0.2111439,-0.3817 0.4437293,-0.7314 0.5168441,-0.7769 0.1642809,-0.1024 0.575408,-0.01 0.575388,0.1307 -10e-6,0.056 -0.2263849,0.5054 -0.5030632,0.9976 -0.5994196,1.0664 -0.8889088,1.3136 -1.5371216,1.313 -0.363884,-7e-4 -0.6345119,-0.1095 -2.0848478,-0.8414 z M 7.7463238,9.5757024 c -0.6336519,-0.2163 -1.1689373,-0.4103 -1.1895286,-0.4309 -0.055904,-0.056 0.084306,-0.1509 1.1332649,-0.7682 l 0.9583433,-0.564 1.8750236,-0.1997 c 1.031268,-0.1098 1.96831,-0.1894 2.082317,-0.1769 0.201354,0.022 0.210294,0.051 0.311551,1.0195 0.0573,0.5482 0.0765,1.0223 0.0427,1.0535 -0.0339,0.031 -0.961564,0.1475 -2.061576,0.2584 l -2.0000221,0.2016 -1.1520861,-0.3933 z m 0.9846951,-0.054 c -0.1324288,-0.3207 -0.2165143,-0.825 -0.1737115,-1.0417 0.024902,-0.126 0.029702,-0.2291 0.010701,-0.2291 -0.019001,0 -0.3439127,0.1859 -0.7220077,0.4132 -0.5619572,0.3378 -0.6583435,0.4244 -0.5280049,0.4744 0.087706,0.034 0.4229179,0.1628 0.7449292,0.2868 0.7139172,0.2751 0.7436392,0.2794 0.6680942,0.096 z m 0.9681139,-2.2614 c -0.093306,-0.061 -0.024102,-0.249 0.3541732,-0.9637 0.537145,-1.0149 0.586078,-1.3287 0.261787,-1.6787 -0.227535,-0.2455 -0.263567,-0.4452 -0.108337,-0.6004 0.165851,-0.1659 0.353683,-0.1144 0.623661,0.1708 0.577718,0.6104 0.581129,0.9106 0.0231,2.0345 -0.231266,0.4657 -0.465991,0.8846 -0.521605,0.9307 -0.15836,0.1314 -0.5051427,0.1899 -0.6328112,0.1068 z m -3.9426405,-1.0845 c -1.3871717,-0.712 -1.8892649,-1.0083 -1.7086629,-1.0083 0.1192979,0 3.4755697,1.7091 3.4755697,1.7699 0,0.1262 -0.2339055,0.025 -1.7669068,-0.7616 z m 1.8294009,0.4017 c -0.1566504,-0.091 -0.2008133,-0.3266 -0.061304,-0.3266 0.1328988,0 0.4184977,-0.5259 0.3694845,-0.6803 -0.072005,-0.2268 0.1014167,-0.254 0.4584402,-0.072 0.4303885,0.2195 0.5359555,0.5407 0.2530268,0.7699 -0.106127,0.086 -0.2430361,0.1358 -0.3042301,0.1109 -0.061204,-0.025 -0.1675211,-0.068 -0.2362756,-0.096 -0.092106,-0.037 -0.1249983,0.01 -0.1249983,0.1667 0,0.2286 -0.1114174,0.2686 -0.3541734,0.1272 z m 0.817004,-0.584 c 0.030802,-0.05 0.012701,-0.1338 -0.040203,-0.1868 -0.072705,-0.073 -0.1143675,-0.067 -0.1705813,0.024 -0.079405,0.1285 -0.039403,0.2532 0.081305,0.2532 0.040403,0 0.098707,-0.041 0.1294886,-0.091 z m -1.7025725,0.099 c -0.093906,-0.06 -0.098006,-0.1677 -0.022301,-0.5973 0.090706,-0.515 0.066304,-0.7167 -0.061704,-0.5097 -0.086906,0.1406 -0.3163809,0.043 -0.3686343,-0.1568 -0.023102,-0.089 -0.083106,-0.161 -0.1332089,-0.161 -0.1407393,0 -0.1082871,0.1254 0.075505,0.2918 0.317011,0.2869 0.166031,0.7083 -0.2537567,0.7083 -0.2601372,0 -0.4962528,-0.2311 -0.4962528,-0.4857 0,-0.2566 0.2362256,-0.228 0.3384923,0.041 0.063604,0.1672 0.1079872,0.1983 0.1801719,0.1261 0.072205,-0.072 0.048303,-0.1463 -0.096606,-0.3006 -0.2234648,-0.2378 -0.1875824,-0.5881 0.068605,-0.6694 0.211694,-0.067 0.5775382,0.1095 0.6410624,0.3098 0.036002,0.1133 0.077905,0.136 0.1389991,0.075 0.061004,-0.061 0.1592006,-0.05 0.3250615,0.035 0.2599272,0.1344 0.2986798,0.2408 0.1251783,0.3436 -0.1248682,0.074 -0.2616273,0.525 -0.1592105,0.525 0.078105,0 0.2976897,-0.3302 0.3238214,-0.4868 0.010301,-0.062 0.035402,-0.1285 0.055804,-0.1489 0.057004,-0.057 0.4753614,0.1523 0.4753614,0.2378 0,0.098 -0.8500762,0.8909 -0.9583433,0.8934 -0.045803,0 -0.134959,-0.031 -0.1980631,-0.071 z m -1.6264575,-0.8663 c -0.094306,-0.069 -0.136229,-0.1905 -0.1189179,-0.3445 0.015401,-0.1368 -0.017601,-0.2537 -0.077405,-0.2747 -0.065904,-0.023 -0.1041669,0.043 -0.1041669,0.1789 0,0.2321 -0.085406,0.2646 -0.3388224,0.129 -0.182202,-0.098 -0.2185944,-0.3305 -0.051603,-0.3305 0.1379791,0 0.4017566,-0.5402 0.3410426,-0.6984 -0.085806,-0.2235 0.1312186,-0.2261 0.5065734,-0.01 0.3067003,0.1797 0.3761649,0.2644 0.3761649,0.4584 0,0.132 -0.059704,0.2713 -0.1341289,0.313 -0.073805,0.041 -0.1399292,0.1906 -0.1470297,0.3318 -0.016301,0.3251 -0.069505,0.3764 -0.2516766,0.2432 z m 0.1995032,-0.9245 c 0,-0.1575 -0.2255849,-0.2344 -0.2790285,-0.095 -0.050403,0.1314 0.013001,0.2112 0.1679111,0.2112 0.061104,0 0.1111174,-0.052 0.1111174,-0.116 z m 3.601918,0.2363 c -0.2627774,-0.184 -0.2331554,-0.463 0.120658,-1.1362 0.4462095,-0.8492 0.8352452,-1.0216 1.1660466,-0.5167 0.127968,0.1953 0.119808,0.2336 -0.1778913,0.836 -0.4634407,0.9377 -0.6939359,1.1076 -1.1088133,0.8169 z m -1.1933089,-1.3112 c -0.5219145,-0.2992 -0.741929,-0.4653 -0.741929,-0.56 0,-0.035 0.067505,-0.1473 0.1499899,-0.1852 l 0.1499799,-0.1852 0.6870454,0.3454 c 0.7041866,0.354 0.8527864,0.5114 0.7053666,0.7471 -0.137129,0.2191 -0.45407,0.1864 -0.9504528,-0.098 z m -2.0548158,-0.3219 c -0.2223046,-0.2223 -0.023902,-0.8755 0.4707412,-1.5497 0.2968096,-0.4045 0.5676375,-0.462 0.8493761,-0.1803 0.2178944,0.2179 0.1765917,0.4139 -0.2531967,1.2012 -0.30199,0.5531 -0.3351122,0.5846 -0.6407924,0.6079 -0.1785118,0.014 -0.3686444,-0.022 -0.4261282,-0.079 z"></path>
        </g>
      </svg>
    ),
  },
  {
    label: "Directions",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path d="M13,24h-2v-7c0-2.8-2.1-5-4.8-5H3.7l3.2,3.3l-1.4,1.4L0,11l5.5-5.7l1.4,1.4L3.7,10h2.5c1.9,0,3.6,0.8,4.8,2.1V12 c0-3.9,3-7,6.8-7h2.5l-3.2-3.3l1.4-1.4L24,6l-5.5,5.7l-1.4-1.4L20.3,7h-2.5C15.1,7,13,9.2,13,12V24z" />
      </svg>
    ),
  },
];

export default function CreateShare() {
  return (
    <section aria-labelledby="create-share" className="w-full">
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-14 items-start">
        <div className="space-y-6 text-center lg:text-left">
          <p className="wedding-kicker text-foreground/60">
            Share one elegant link
          </p>
          <h2
            id="create-share"
            className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground"
            style={{
              fontFamily: 'var(--font-playfair), "Times New Roman", serif',
            }}
          >
            All-in-one event tools without the spreadsheets.
          </h2>
          <p className="text-base sm:text-lg text-foreground/70 max-w-2xl mx-auto lg:mx-0">
            Envitefy keeps RSVPs, directions, registries, and travel info in one
            polished place, so guests always see the latest details.
          </p>
          <ul className="mt-8 space-y-4 pb-4 text-foreground/85 text-base sm:text-lg leading-relaxed">
            {points.map((point, index) => (
              <li key={point} className="flex items-start gap-4 text-left">
                <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-b from-[#f6dcc7] via-[#e8c2a4] to-[#c8916a] text-[0.65rem] font-semibold text-white tracking-[0.25em] shadow-md">
                  {(index + 1).toString().padStart(2, "0")}
                </span>
                <span className="flex-1">{point}</span>
              </li>
            ))}
          </ul>
          <CreateShareCta />
        </div>
        <div className="mx-auto w-full max-w-2xl">
          <p className="text-center wedding-kicker text-secondary/80">
            Event preview
          </p>
          <div className="mt-6 rounded-[32px] wedding-glow-card border border-border/60 bg-surface/95 text-left overflow-hidden shadow-[0_35px_80px_rgba(43,27,22,0.15)]">
            <div className="px-6 py-6 bg-gradient-to-r from-[#f9e8dc] via-[#f3d5c1] to-[#e2c0a5] border-b border-border/60">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-foreground/70">
                    Birthdays
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-foreground">
                    Dominic&apos;s 7th Birthday Party
                  </h3>
                  <p className="mt-1 text-sm text-foreground/70">
                    Hosted by Russell Jason
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/80 text-2xl shadow-md">
                  {"\u{1F382}"}
                </div>
              </div>
            </div>
            <div className="px-6 py-6 space-y-6">
              <dl className="grid gap-5 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
                    When
                  </dt>
                  <dd className="mt-1 text-base font-semibold text-foreground">
                    Apr 10, 2026 {"\u00B7"} 10:15 PM {"\u2013"} 11:15 PM
                  </dd>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
                      Venue
                    </dt>
                    <dd className="mt-1 text-base font-semibold text-foreground">
                      US Gold Gymnastics
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
                      Address
                    </dt>
                    <dd className="mt-1 text-base font-semibold text-foreground">
                      145 Main St, Atlanta, GA 30301
                    </dd>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
                      Add to calendar
                    </dt>
                    <dd className="mt-1">
                      <div className="flex items-center gap-3">
                        {calendarTargets.map((target) => (
                          <span
                            key={target.alt}
                            className="flex h-11 w-11 items-center justify-center rounded-full border border-border/70 bg-white/90 shadow-sm"
                          >
                            {target.alt === "Apple" ? (
                              <>
                                <Image
                                  src={target.light}
                                  alt={target.alt}
                                  width={22}
                                  height={22}
                                  className="h-5 w-5 calendar-icon-apple-black"
                                />
                                <Image
                                  src={target.dark}
                                  alt={target.alt}
                                  width={22}
                                  height={22}
                                  className="h-5 w-5 calendar-icon-apple-white"
                                />
                              </>
                            ) : (
                              <Image
                                src={target.light}
                                alt={target.alt}
                                width={22}
                                height={22}
                                className={`h-5 w-5 calendar-icon-${target.alt.toLowerCase()}`}
                              />
                            )}
                          </span>
                        ))}
                      </div>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
                      RSVP
                    </dt>
                    <dd className="mt-2 flex items-center gap-2">
                      {rsvpStatuses.map((status) => (
                        <span
                          key={status.label}
                          className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${status.chipClass}`}
                        >
                          <span className="text-base" aria-hidden="true">
                            {status.icon}
                          </span>
                          {status.label}
                        </span>
                      ))}
                    </dd>
                  </div>
                </div>
              </dl>
              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  Dominic&apos;s Birthday Party at US Gold Gymnastics.
                </h4>
                <p className="mt-1 text-sm text-foreground/70">
                  Guests can see updates instantly and RSVP in one tap.
                </p>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
                  Registries
                </h4>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {registries.map((registry) => (
                    <span
                      key={registry.label}
                      className="flex items-center gap-1.5 rounded-xl border border-border/70 bg-white/90 px-2.5 py-1 text-xs sm:text-sm font-semibold text-foreground max-w-[46%] truncate shadow-sm"
                    >
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${registry.badgeClass}`}
                      >
                        {registry.badge}
                      </span>
                      <span className="truncate">{registry.label}</span>
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className="rounded-2xl border border-border/70 bg-background/80 p-3 shadow-sm">
                  <Image
                    src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 180 240' shape-rendering='crispEdges'><rect width='180' height='240' rx='10' fill='%23ffffff'/><rect x='0' y='0' width='180' height='48' rx='10' fill='%23f472b6'/><rect x='16' y='16' width='100' height='16' rx='3' fill='%23ffffff'/><rect x='16' y='72' width='148' height='14' rx='3' fill='%2311182722'/><rect x='16' y='92' width='120' height='10' rx='3' fill='%23a855f7'/><rect x='16' y='110' width='140' height='8' rx='3' fill='%236564f1'/><rect x='16' y='134' width='148' height='6' rx='3' fill='%23e5e7eb'/><rect x='16' y='148' width='112' height='6' rx='3' fill='%23e5e7eb'/><rect x='16' y='162' width='148' height='6' rx='3' fill='%23e5e7eb'/><rect x='16' y='176' width='96' height='6' rx='3' fill='%23e5e7eb'/></svg>"
                    alt="Flyer preview"
                    width={180}
                    height={240}
                    className="h-64 w-48 rounded-xl border border-border/60 object-cover"
                    draggable={false}
                  />
                </div>
                <p className="mt-2 text-xs text-foreground/60 italic">
                  Your flyer could be here
                </p>
              </div>
            </div>
            <div className="flex items-center justify-center border-t border-border/60 px-6 py-4 text-sm font-medium text-foreground/80 bg-white/80">
              <div className="flex items-center gap-6">
                {footerActions.map((action) => (
                  <span key={action.label} className="flex items-center gap-2">
                    <span aria-hidden="true">{action.icon}</span>
                    {action.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
