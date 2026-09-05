import { ENVITEFY_SOCIAL_LINKS } from "@/lib/envitefy-social-links";

export default function EnvitefySocialLinks({
  placement = "footer",
  inverse = false,
}: {
  placement?: "footer" | "menu" | "event";
  inverse?: boolean;
}) {
  const isEvent = placement === "event";
  const iconSize = isEvent ? 24 : 32;

  return (
    <nav
      aria-label="Follow Envitefy"
      className={
        isEvent ? "mt-4" : placement === "menu" ? "text-[var(--nav-chrome-ink)]" : "text-[#62586a]"
      }
    >
      {!isEvent ? (
        <p className="mb-3 text-xs font-semibold tracking-wide">Follow Envitefy</p>
      ) : null}
      <ul className={`flex flex-wrap items-center gap-2 ${isEvent ? "justify-center" : ""}`}>
        {ENVITEFY_SOCIAL_LINKS.map(({ name, href, iconSrc }) => (
          <li key={name}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              title={`Envitefy on ${name} (opens in a new tab)`}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md opacity-80 transition-opacity duration-150 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current active:opacity-60 motion-reduce:transition-none"
            >
              <img
                src={iconSrc}
                alt=""
                aria-hidden="true"
                width={iconSize}
                height={iconSize}
                className={`block object-contain ${inverse ? "brightness-0 invert" : ""}`}
              />
              <span className="sr-only">Envitefy on {name} (opens in a new tab)</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
