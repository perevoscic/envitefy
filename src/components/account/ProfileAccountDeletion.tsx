"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Trash2, X } from "lucide-react";
import Link from "next/link";
import AccountDeletionRequestForm from "./AccountDeletionRequestForm";

export default function ProfileAccountDeletion({ accountEmail }: { accountEmail: string }) {
  return (
    <div className="border-t border-[#e3dcf0] pt-6">
      <h3 className="text-base font-bold text-[#251b32]">Delete account</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Request permanent deletion of your Envitefy account and associated data.
        We will verify ownership before processing your request.
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
        <Dialog.Root>
          <Dialog.Trigger asChild>
            <button type="button" disabled={!accountEmail} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-800 transition-colors hover:bg-rose-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700 disabled:cursor-not-allowed disabled:opacity-60">
              <Trash2 className="h-4 w-4" aria-hidden="true" /> Request account deletion
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-[100] bg-slate-950/55" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-[101] max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7">
              <Dialog.Title className="pr-10 text-xl font-bold text-slate-900">Request account deletion</Dialog.Title>
              <Dialog.Description className="mb-5 mt-3 text-sm leading-6 text-slate-600">
                Deletion covers your profile, saved content, uploads and connected calendar tokens.
                Review the data and retention details before sending your request.
              </Dialog.Description>
              <Dialog.Close asChild>
                <button type="button" aria-label="Close deletion request" className="absolute right-2 top-2 flex h-12 w-12 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-rose-700">
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </Dialog.Close>
              <Link href="/delete-account#data" className="mb-4 inline-flex min-h-11 items-center text-sm font-semibold text-[#5c438e] underline underline-offset-4">Data deletion and retention details</Link>
              <AccountDeletionRequestForm accountEmail={accountEmail} />
              <Link href="/contact" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-[#5c438e] underline underline-offset-4">Contact Envitefy support</Link>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
        <Link href="/delete-account" className="inline-flex min-h-12 items-center text-sm font-semibold text-[#5c438e] underline underline-offset-4">How account deletion works</Link>
      </div>
    </div>
  );
}
