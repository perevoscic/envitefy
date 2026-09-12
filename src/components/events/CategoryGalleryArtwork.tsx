import type { GalleryArtwork } from "./category-gallery-themes";

function Star({ x, y, size = 10 }: { x: number; y: number; size?: number }) {
  return (
    <path
      d="M0-10 2.8-2.8 10 0 2.8 2.8 0 10-2.8 2.8-10 0-2.8-2.8Z"
      transform={`translate(${x} ${y}) scale(${size / 10})`}
      fill="var(--gallery-accent)"
      stroke="none"
    />
  );
}

function Ribbon({ bow = false }: { bow?: boolean }) {
  return (
    <g fill="none" strokeLinecap="round">
      <path
        d="M790 14C626-28 521 26 586 99S784 145 673 216 500 224 557 339"
        stroke="var(--gallery-accent)"
        strokeWidth="17"
        opacity=".38"
      />
      <path d="M790 14C626-28 521 26 586 99S784 145 673 216 500 224 557 339" strokeWidth="2" />
      <path d="M494-18C660 49 469 102 489 165S743 189 779 309" strokeWidth="9" opacity=".35" />
      {bow && (
        <g transform="translate(558 158) rotate(-15)">
          <path
            d="M0 0C-112-87-137 24-15 8L0 0C63-116 130-40 12 8ZM0 8C-27 60-55 96-81 99M9 9C17 67 51 92 64 125"
            strokeWidth="7"
            opacity=".7"
          />
          <ellipse cx="5" cy="6" rx="12" ry="9" fill="var(--gallery-accent)" stroke="none" />
        </g>
      )}
    </g>
  );
}

function Botanicals() {
  return (
    <g>
      <g fill="none" strokeWidth="2" opacity=".65">
        <path d="M405 362C587 258 597 128 739-28M505 357C687 281 667 164 791 86M581 245C492 184 488 138 493 82" />
      </g>
      {[
        [567, 211, -37],
        [606, 160, 25],
        [633, 108, -24],
        [675, 58, 37],
        [649, 251, 42],
        [702, 183, -25],
        [738, 132, 32],
        [530, 181, -55],
        [496, 125, -20],
      ].map(([x, y, angle]) => (
        <g key={`${x}-${y}`} transform={`translate(${x} ${y}) rotate(${angle})`}>
          <path
            d="M0 0C-54-11-58-43-52-64-21-61 1-28 0 0Z"
            fill="currentColor"
            stroke="none"
            opacity=".24"
          />
          <path d="M0 0-44-53" fill="none" strokeWidth="1" opacity=".45" />
        </g>
      ))}
      {[
        [636, 209, 1],
        [731, 59, 0.7],
        [499, 281, 0.8],
      ].map(([x, y, scale]) => (
        <g
          key={`${x}-${y}`}
          transform={`translate(${x} ${y}) scale(${scale})`}
          stroke="var(--gallery-accent)"
          strokeWidth="1.2"
        >
          {[0, 60, 120, 180, 240, 300].map((angle) => (
            <ellipse
              key={angle}
              cx="0"
              cy="-18"
              rx="15"
              ry="25"
              transform={`rotate(${angle})`}
              fill="#fffcf5"
              fillOpacity=".82"
              strokeOpacity=".55"
            />
          ))}
          <circle r="9" fill="var(--gallery-accent)" stroke="none" opacity=".65" />
          <circle r="4" fill="#fffcf5" stroke="none" />
        </g>
      ))}
    </g>
  );
}

function Balloons() {
  return (
    <g strokeWidth="1.5">
      {[
        [491, 119, -16, "var(--gallery-accent)"],
        [645, 88, 12, "currentColor"],
        [725, 184, 23, "var(--gallery-glow)"],
      ].map(([x, y, angle, fill]) => (
        <g key={`${x}-${y}`} transform={`translate(${x} ${y}) rotate(${angle})`}>
          <path d="M0 63C-29 103 27 122 7 180" fill="none" opacity=".5" />
          <ellipse
            cy="-1"
            rx="43"
            ry="57"
            fill={String(fill)}
            fillOpacity=".5"
            strokeOpacity=".25"
          />
          <path d="m0 55-6 10h12Z" fill={String(fill)} stroke="none" opacity=".6" />
          <path
            d="M-24-27C-29-16-29-7-27 0"
            stroke="#fffefa"
            strokeWidth="6"
            strokeLinecap="round"
            opacity=".7"
          />
        </g>
      ))}
      <g fill="none" strokeWidth="3" opacity=".6">
        <path d="m565 41 8 12M577 235l-7 10M762 40l8-10M425 238l9 6M694 300l6-9" />
      </g>
      <Star x={551} y={157} size={8} />
      <Star x={730} y={80} size={9} />
      <Star x={446} y={41} size={6} />
      <circle cx="624" cy="285" r="4" fill="var(--gallery-accent)" stroke="none" />
    </g>
  );
}

function Field({ soccer = false }: { soccer?: boolean }) {
  return (
    <g>
      <g
        transform="translate(346 185) rotate(-13) skewX(-18)"
        fill="none"
        strokeWidth="2"
        opacity=".3"
      >
        <rect width="455" height="218" rx="3" />
        {soccer ? (
          <>
            <path d="M227 0v218M0 43h65v132H0M455 43h-65v132h65" />
            <circle cx="227" cy="109" r="49" />
          </>
        ) : (
          [55, 110, 165, 220, 275, 330, 385].map((x) => (
            <path key={x} d={`M${x} 0v218m-6-151h12m-12 83h12`} />
          ))
        )}
      </g>
      {!soccer && (
        <g transform="translate(688 32)" opacity=".35">
          <path d="M0 24v105M-39 2h78v24h-78Z" fill="none" strokeWidth="2" />
          {[-28, -9, 10, 29].map((x) => (
            <circle key={x} cx={x} cy="14" r="5" fill="var(--gallery-accent)" stroke="none" />
          ))}
          <path
            d="M-38 26-105 190H104L38 26"
            fill="var(--gallery-glow)"
            stroke="none"
            opacity=".4"
          />
        </g>
      )}
      {soccer ? (
        <g transform="translate(622 179) rotate(12)">
          <circle r="69" fill="#fffefa" fillOpacity=".8" strokeWidth="2" strokeOpacity=".5" />
          <path
            d="m0-28 27 20-10 32h-34L-27-8Zm-64 5 18 7 12 36-14 18M64-23 46-16 34 20l14 18M-24-64l8 16h32l8-16M-17 61l-4-17-28-20M17 61l4-17 28-20M0-28v-20M27-8l19-8M-27-8l-19-8M17 24l4 20M-17 24l-4 20"
            fill="currentColor"
            fillOpacity=".23"
            strokeWidth="2"
            strokeOpacity=".6"
          />
        </g>
      ) : (
        <g transform="translate(590 182) rotate(-28)">
          <path
            d="M-117 0C-64-74 63-74 117 0 63 74-64 74-117 0Z"
            fill="var(--gallery-accent)"
            fillOpacity=".6"
            strokeWidth="2"
            strokeOpacity=".5"
          />
          <path
            d="M-90-25C-82-9-82 9-90 25M90-25C82-9 82 9 90 25"
            fill="none"
            stroke="#fffaf0"
            strokeWidth="12"
            opacity=".8"
          />
          <path d="M-116 0H116" fill="none" stroke="var(--gallery-ink)" strokeOpacity=".25" />
          <path
            d="M-37-9H37m-30-8v17m15-17v17m15-17v17m15-17v17m15-17v17"
            fill="none"
            stroke="#fffaf0"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>
      )}
    </g>
  );
}

function Artwork({ kind }: { kind: GalleryArtwork }) {
  switch (kind) {
    case "football":
      return <Field />;
    case "soccer":
      return <Field soccer />;
    case "botanicals":
      return <Botanicals />;
    case "balloons":
      return <Balloons />;
    case "ribbons":
      return (
        <>
          <Ribbon bow />
          <Star x={707} y={71} size={8} />
          <Star x={471} y={245} size={6} />
        </>
      );
    case "gymnastics":
      return (
        <>
          <g fill="none" strokeLinecap="round">
            <path
              d="M357 299C698 305 778 154 584 153S430 72 641 38"
              strokeWidth="16"
              stroke="var(--gallery-glow)"
            />
            <path
              d="M357 299C698 305 778 154 584 153S430 72 641 38"
              strokeWidth="2"
              strokeDasharray="2 9"
              opacity=".5"
            />
          </g>
          <g fill="none" strokeWidth="3" opacity=".52">
            <path d="M617-10v112M708-10v112" />
            <ellipse cx="617" cy="126" rx="20" ry="27" />
            <ellipse cx="708" cy="126" rx="20" ry="27" />
            <path d="m478 263 16-66h217l17 66M519 200l-16 63M682 200l15 63" />
            <path d="M475 193h243" stroke="var(--gallery-accent)" strokeWidth="11" />
          </g>
          <Star x={523} y={108} size={8} />
        </>
      );
    case "cheerleading":
      return (
        <>
          <Ribbon />
          {[
            [522, 181],
            [687, 213],
          ].map(([x, y]) => (
            <g key={x} transform={`translate(${x} ${y})`} strokeWidth="3" opacity=".52">
              {Array.from({ length: 18 }, (_, i) => (
                <path
                  key={i}
                  d="M0 0Q-14-29 0-58M0 0Q15-25 7-48"
                  transform={`rotate(${i * 20})`}
                  fill="none"
                  stroke={i % 2 ? "var(--gallery-accent)" : "currentColor"}
                />
              ))}
              <circle r="8" fill="var(--gallery-accent)" stroke="none" />
            </g>
          ))}
          <Star x={697} y={54} size={13} />
          <Star x={425} y={111} size={9} />
        </>
      );
    case "dance":
      return (
        <>
          <g stroke="none">
            <path
              d="M643-40C352 67 733 139 472 360H639C813 104 507 99 765-40Z"
              fill="currentColor"
              opacity=".16"
            />
            <path
              d="M726-40C433 71 770 177 563 360H663C841 122 570 81 810-40Z"
              fill="var(--gallery-accent)"
              opacity=".24"
            />
          </g>
          <g fill="none" strokeWidth="1.5" opacity=".55">
            <path d="M639-25C394 80 728 143 490 359M678-25C433 80 767 143 529 359M730-25C478 91 802 133 583 359" />
          </g>
        </>
      );
    case "nursery":
      return (
        <>
          <path
            d="M634 46C583 111 633 180 687 164 631 237 538 191 553 121 560 85 597 57 634 46Z"
            fill="var(--gallery-accent)"
            stroke="none"
            opacity=".55"
          />
          <g fill="#fffefa" fillOpacity=".85" strokeWidth="1.2" strokeOpacity=".35">
            <path d="M456 232C431 231 429 199 451 193 452 163 496 155 509 181 533 170 560 190 552 211 583 222 568 248 543 246Z" />
            <path d="M664 248C637 247 636 219 656 211 655 179 702 172 718 199 752 189 767 215 756 229 782 239 765 260 741 258Z" />
          </g>
          <Star x={507} y={89} size={10} />
          <Star x={714} y={106} size={12} />
          <Star x={653} y={275} size={6} />
          <Star x={449} y={144} size={5} />
        </>
      );
    case "sports":
      return (
        <g fill="none" strokeLinecap="round" opacity=".48">
          {[0, 26, 52, 78, 104].map((offset) => (
            <path
              key={offset}
              d={`M${450 + offset} 400V200c0-92 65-140 170-140h210`}
              strokeWidth="2"
              transform={`rotate(20 630 200) translate(${offset / 3} ${-offset / 2})`}
            />
          ))}
          <path
            d="m378 233 174-166M690 282l154-148"
            stroke="var(--gallery-accent)"
            strokeWidth="18"
            opacity=".35"
          />
        </g>
      );
    case "calm":
      return (
        <g fill="none" strokeLinecap="round">
          <path
            d="M411 324C456 216 656 334 735 156S571-52 752-84"
            stroke="var(--gallery-accent)"
            strokeWidth="59"
            opacity=".18"
          />
          <path d="M431 332C476 224 676 342 755 164S591-44 772-76" strokeWidth="2" opacity=".42" />
          <circle cx="530" cy="105" r="55" strokeWidth="1.5" opacity=".3" />
        </g>
      );
    case "architecture":
      return (
        <>
          <path
            d="m471 80 195-55v315H471ZM686 20l110-31v351H686Z"
            fill="var(--gallery-accent)"
            opacity=".15"
            stroke="none"
          />
          <g fill="none" strokeWidth="2" opacity=".6">
            <path d="M447 292V134l131-85 137 85v158M426 146l152-98 157 98M486 169h52v68h-52ZM621 169h52v68h-52ZM563 292v-91h31v91M403 293h367M512 169v68M621 202h52" />
            <path d="M747 27v249M775 27v249M716 91h87M716 159h87" strokeWidth="1" opacity=".6" />
          </g>
        </>
      );
    case "workshop":
      return (
        <>
          <g transform="translate(551 182) rotate(-13)">
            <rect
              x="-96"
              y="-105"
              width="185"
              height="223"
              rx="5"
              fill="#fffaf0"
              strokeOpacity=".35"
            />
            <path
              d="M-68-66H59M-68-37H28M-68-8H46M-68 22H8"
              fill="none"
              strokeWidth="2"
              opacity=".25"
            />
          </g>
          <g transform="translate(686 145) rotate(23)">
            <path
              d="M-7-97H7v164L0 87-7 67Z"
              fill="var(--gallery-accent)"
              fillOpacity=".55"
              strokeWidth="1.5"
              strokeOpacity=".5"
            />
            <path d="M-7 65H7L0 87Z" fill="#fffaf0" strokeOpacity=".5" />
          </g>
          <circle cx="721" cy="269" r="24" fill="var(--gallery-glow)" strokeOpacity=".4" />
          <path d="m707 269 11 7 15-20" fill="none" strokeWidth="2" opacity=".5" />
        </>
      );
    case "paper":
      return (
        <>
          <g transform="translate(620 175) rotate(14)">
            <rect
              x="-71"
              y="-111"
              width="174"
              height="220"
              rx="12"
              fill="var(--gallery-accent)"
              fillOpacity=".25"
              strokeOpacity=".3"
            />
          </g>
          <g transform="translate(555 179) rotate(-9)">
            <rect
              x="-81"
              y="-111"
              width="174"
              height="220"
              rx="12"
              fill="#fffefa"
              fillOpacity=".88"
              strokeOpacity=".35"
            />
            <rect
              x="-54"
              y="-81"
              width="71"
              height="8"
              rx="4"
              fill="currentColor"
              opacity=".32"
              stroke="none"
            />
            {[-34, 7, 48].map((y) => (
              <g key={y} transform={`translate(-53 ${y})`} fill="none" strokeWidth="2" opacity=".5">
                <rect width="15" height="15" rx="4" />
                <path d="m3 7 4 4 6-7M31 4h57M31 13h38" />
              </g>
            ))}
          </g>
          <Star x={712} y={92} size={10} />
        </>
      );
    case "celebration":
      return (
        <>
          <Ribbon />
          <Star x={529} y={80} size={15} />
          <Star x={686} y={181} size={20} />
          <Star x={454} y={254} size={9} />
          <g fill="none" strokeWidth="3" opacity=".6">
            <path d="m731 47 9 15M479 159l-9 13M605 270l10 8M756 262l-3 15" />
          </g>
          <circle cx="648" cy="61" r="5" fill="var(--gallery-accent)" stroke="none" />
        </>
      );
  }
}

export default function CategoryGalleryArtwork({
  kind,
  className,
}: {
  kind: GalleryArtwork;
  className: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 800 360"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <Artwork kind={kind} />
    </svg>
  );
}
