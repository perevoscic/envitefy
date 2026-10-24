"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import ConciergeLauncher from "./ConciergeLauncher";
import ConciergeSheet from "./ConciergeSheet";

type PublicConciergeWidgetProps = {
  onSignupSelect: () => void;
};

function GuestConcierge({ onSignupSelect }: PublicConciergeWidgetProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <ConciergeLauncher open={open} onOpen={() => setOpen((value) => !value)} />
      <ConciergeSheet open={open} onOpenChange={setOpen} onSignupSelect={onSignupSelect} />
    </>
  );
}

/** Public help never carries a conversation into an authenticated workspace. */
export default function PublicConciergeWidget(props: PublicConciergeWidgetProps) {
  const { status } = useSession();
  return status === "unauthenticated" ? <GuestConcierge {...props} /> : null;
}
