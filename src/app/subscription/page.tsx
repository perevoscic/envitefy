"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Logo from "@/assets/logo.png";

export default function SubscriptionPage() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const plan = params?.get?.("plan") ?? null;
    if (!plan) return;
    const normalized = ["free", "monthly", "yearly"].includes(plan)
      ? plan
      : null;
    if (!normalized) return;
    // Save and redirect home after applying preselected plan
    fetch("/api/user/subscription", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: normalized }),
      credentials: "include",
    })
      .then(() => router.replace("/"))
      .catch(() => {});
  }, [params, router]);

  return (
    <main className="p-10 max-w-4xl mx-auto">
      <h1 className="text-3xl font-semibold text-muted-foreground mb-9 text-center">
        Thank you for supporting
      </h1>
      <Link
        href="/"
        className="mx-auto flex items-center gap-4 mb-6 justify-center"
      >
        <Image src={Logo} alt="Snap My Date" width={64} height={64} />
        <span className="text-4xl sm:text-5xl md:text-6xl text-foreground">
          <span className="font-pacifico">Snap</span>
          <span> </span>
          <span className="font-montserrat font-semibold">My Date</span>
        </span>
      </Link>
      <h4 className="text-xl text-muted-foreground mb-6 text-center">
        Your contribution helps keep the lights on and new features coming.
        <br />
        Pick the plan that feels right for you. Free trial includes 3 scans.
      </h4>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-surface p-5 flex flex-col shadow-md text-center">
          <h2 className="text-base font-medium mb-1">Trial</h2>
          <div className="text-3xl font-semibold">$0</div>
          <div className="text-xs text-muted-foreground mb-4">3 free scans</div>
          <Link
            href="/signup?plan=free"
            className="mt-auto self-center inline-flex justify-center items-center h-10 px-6 rounded-full shadow-md bg-primary text-on-primary hover:opacity-90 hover:shadow-lg transition"
          >
            Start free
          </Link>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5 flex flex-col shadow-md text-center">
          <h2 className="text-base font-medium mb-1">Monthly</h2>
          <div className="text-3xl font-semibold">$1.99</div>
          <div className="text-xs text-muted-foreground mb-4">per month</div>
          <button
            type="button"
            className="mt-auto self-center inline-flex justify-center items-center h-10 px-6 rounded-full shadow-md bg-primary text-on-primary hover:opacity-90 hover:shadow-lg transition"
            onClick={async () => {
              await fetch("/api/user/subscription", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan: "monthly" }),
                credentials: "include",
              });
              router.replace("/");
            }}
          >
            Subscribe Monthly
          </button>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5 flex flex-col shadow-md text-center">
          <h2 className="text-base font-medium mb-1">Yearly</h2>
          <div className="text-3xl font-semibold">$19.99</div>
          <div className="text-xs text-muted-foreground mb-4">per year</div>
          <button
            type="button"
            className="mt-auto self-center inline-flex justify-center items-center h-10 px-6 rounded-full shadow-md bg-primary text-on-primary hover:opacity-90 hover:shadow-lg transition"
            onClick={async () => {
              await fetch("/api/user/subscription", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan: "yearly" }),
                credentials: "include",
              });
              router.replace("/");
            }}
          >
            Subscribe Yearly
          </button>
        </div>
      </div>
    </main>
  );
}
