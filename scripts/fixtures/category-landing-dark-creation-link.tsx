import type { AnchorHTMLAttributes } from "react";
import ArrowFillLink from "@/components/ui/ArrowFillLink";

/** Render the actual CTA decoration without opening account dialogs in this color fixture. */
export default function FixtureCreationLink({
  children,
  label,
  signupIntent: _signupIntent,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  label?: string;
  signupIntent?: string;
}) {
  const linkProps = { ...props, "data-public-create-destination": props.href };
  return label ? <ArrowFillLink {...linkProps} label={label} /> : <a {...linkProps}>{children}</a>;
}
