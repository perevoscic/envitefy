"use client";

import type { ReactNode } from "react";
import GuestChatWidget from "@/components/guest-chat/GuestChatWidget";
import MarketingHero from "@/components/marketing/MarketingHero";
import MarketingPage from "@/components/marketing/MarketingPage";
import CompanyTopNav from "./CompanyTopNav";
import styles from "./supporting-public.module.css";

type CompanyHighlight = { label: string; value: string };
type CompanyPageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  highlights?: readonly CompanyHighlight[];
  children: ReactNode;
};

export default function CompanyPageShell({
  children,
  description,
  eyebrow,
  highlights = [],
  primaryHref = "/",
  primaryLabel = "Go home",
  secondaryHref = "/contact",
  secondaryLabel = "Contact us",
  title,
}: CompanyPageShellProps) {
  return (
    <MarketingPage className={styles.content}>
      <CompanyTopNav />
      <main>
        <MarketingHero
          eyebrow={eyebrow}
          title={title}
          description={description}
          primaryHref={primaryHref}
          primaryLabel={primaryLabel}
          secondaryHref={secondaryHref}
          secondaryLabel={secondaryLabel}
        >
          {highlights.length > 0 && (
            <dl className={styles.highlights}>
              {highlights.map((item) => (
                <div key={`${item.value}-${item.label}`} className={styles.highlightInner}>
                  <dt>{item.value}</dt>
                  <dd>{item.label}</dd>
                </div>
              ))}
            </dl>
          )}
        </MarketingHero>
        <div className={styles.prose}>{children}</div>
      </main>
      <GuestChatWidget />
    </MarketingPage>
  );
}
