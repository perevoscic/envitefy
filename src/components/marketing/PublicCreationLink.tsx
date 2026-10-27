"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { type AnchorHTMLAttributes, type MouseEvent, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowFillContent,
  arrowFillClassName,
  arrowFillPaddingStyle,
} from "@/components/ui/ArrowFillButton";
import { type SignupIntent, signupIntentForMarketingPath } from "@/lib/signup-intent";

const AuthModal = dynamic(() => import("@/components/auth/AuthModal"), { ssr: false });

type PublicCreationLinkProps = Pick<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "children" | "className" | "style" | "aria-label" | "title"
> & {
  href: string;
  label?: string;
  signupIntent?: SignupIntent;
};

/** Explicit public creation actions retain their destination through either auth mode. */
export default function PublicCreationLink({
  href,
  children,
  label,
  className,
  style,
  signupIntent,
  ...linkProps
}: PublicCreationLinkProps) {
  const { status } = useSession();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const intent = signupIntent ?? signupIntentForMarketingPath(href) ?? undefined;

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      status === "authenticated" ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    setMode("signup");
    setOpen(true);
  };

  return (
    <>
      <Link
        {...linkProps}
        href={href}
        className={label ? [arrowFillClassName, className].filter(Boolean).join(" ") : className}
        style={label ? { ...arrowFillPaddingStyle, ...style } : style}
        onClick={onClick}
        aria-haspopup={status === "authenticated" ? undefined : "dialog"}
        data-public-create-destination={href}
        data-arrow-fill-button={label ? "" : undefined}
      >
        {label ? <ArrowFillContent label={label} /> : children}
      </Link>
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <AuthModal
            open={open}
            mode={mode}
            onClose={() => setOpen(false)}
            onModeChange={setMode}
            successRedirectUrl={href}
            signupIntent={intent}
            signupSource={intent}
          />,
          document.body,
        )}
    </>
  );
}
