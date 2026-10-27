import Link from "next/link";
import type { AnchorHTMLAttributes, ComponentProps } from "react";
import { ArrowFillContent, arrowFillClassName, arrowFillPaddingStyle } from "./ArrowFillButton";

type ArrowFillLinkProps = Omit<ComponentProps<typeof Link>, "children"> & { label: string };

/** Keeps navigation and modified-click behavior native while sharing the CTA effect. */
export default function ArrowFillLink({ label, className, style, ...props }: ArrowFillLinkProps) {
  const appearance = {
    className: [arrowFillClassName, className].filter(Boolean).join(" "),
    style: { ...arrowFillPaddingStyle, ...style },
    "data-arrow-fill-button": "",
  };
  if (typeof props.href === "string" && props.href.startsWith("#")) {
    const {
      href,
      prefetch: _prefetch,
      replace: _replace,
      scroll: _scroll,
      onNavigate: _onNavigate,
      as: _as,
      locale: _locale,
      legacyBehavior: _legacyBehavior,
      passHref: _passHref,
      ...anchorProps
    } = props;
    return (
      <a {...(anchorProps as AnchorHTMLAttributes<HTMLAnchorElement>)} {...appearance} href={href}>
        <ArrowFillContent label={label} />
      </a>
    );
  }
  return (
    <Link {...props} {...appearance}>
      <ArrowFillContent label={label} />
    </Link>
  );
}
