"use client";

import Link from "next/link";

export default function CreateShareCta() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Link
        href="/snap"
        className="btn btn-primary btn-lg w-full sm:w-auto"
      >
        Create a Snap account
      </Link>
      <Link
        href="/gymnastics"
        className="btn btn-outline btn-lg w-full sm:w-auto"
      >
        Gymnastics account
      </Link>
    </div>
  );
}
