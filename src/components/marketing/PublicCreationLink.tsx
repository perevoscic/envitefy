"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { type AnchorHTMLAttributes, type MouseEvent, useState } from "react";
import { createPortal } from "react-dom";
import { type SignupIntent, signupIntentForMarketingPath } from "@/lib/signup-intent";

const AuthModal = dynamic(() => import("@/components/auth/AuthModal"), { ssr: false });

type PublicCreationLinkProps = Pick<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "children" | "className" | "aria-label" | "title"
> & {
  href: string;
  signupIntent?: SignupIntent;
};

/** Explicit public creation actions retain their destination through either auth mode. */
export default function PublicCreationLink({
  href,
  children,
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
        onClick={onClick}
        aria-haspopup={status === "authenticated" ? undefined : "dialog"}
        data-public-create-destination={href}
      >
        {children}
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
