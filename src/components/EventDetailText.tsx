import { Fragment } from "react";
import LocationLink from "./LocationLink";
import { splitEventDetailLinks } from "../utils/event-detail-links";

const linkClassName =
  "rounded-sm underline decoration-current/40 underline-offset-4 hover:decoration-current focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4";

export default function EventDetailText({
  text,
  label,
  interactive = true,
}: {
  text: string;
  label?: string;
  interactive?: boolean;
}) {
  if (!interactive) return <>{text}</>;
  return (
    <>
      {splitEventDetailLinks(text, label).map((segment, index) => {
        if (segment.kind === "address") {
          return <LocationLink key={index} location={segment.text} className={linkClassName} />;
        }
        if (!segment.href) return <Fragment key={index}>{segment.text}</Fragment>;
        const external = segment.kind === "website";
        return (
          <a
            key={index}
            href={segment.href}
            className={linkClassName}
            aria-label={
              segment.kind === "phone"
                ? `Call ${segment.text}`
                : segment.kind === "email"
                  ? `Email ${segment.text}`
                  : undefined
            }
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
          >
            {segment.text}
          </a>
        );
      })}
    </>
  );
}
