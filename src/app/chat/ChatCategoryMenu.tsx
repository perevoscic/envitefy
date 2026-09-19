"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Baby, Cake, ClipboardList, Gift, Heart, PartyPopper, Plus, Trophy, X } from "lucide-react";
import { useState } from "react";
import { getCreateEventSections } from "@/config/navigation-config";
import { useMenu } from "@/contexts/MenuContext";

export type ChatCategoryChoice = { label: string; prompt: string; href: string };

function categoryPrompt(label: string) {
  const prompts: Record<string, string> = {
    Birthdays: "Birthday",
    Weddings: "Wedding",
    Anniversaries: "Anniversary",
    "Baby Showers": "Baby Shower",
    "Gender Reveal": "Gender Reveal",
  };
  return prompts[label] || label;
}

function categoryIcon(prompt: string) {
  if (prompt === "Birthday") return Cake;
  if (prompt === "Wedding" || prompt === "Anniversary") return Heart;
  if (prompt === "Baby Shower") return Baby;
  if (prompt === "Gender Reveal") return Gift;
  if (prompt === "Sign-up Form") return ClipboardList;
  return Trophy;
}

export default function ChatCategoryMenu({
  disabled,
  hasConversation,
  onSelect,
}: {
  disabled: boolean;
  hasConversation: boolean;
  onSelect: (choice: ChatCategoryChoice) => void;
}) {
  const [open, setOpen] = useState(false);
  const menu = useMenu();
  const preferencesReady = menu.isAdmin || menu.featureVisibility.hasLoadedPreferences;
  const sections = preferencesReady
    ? getCreateEventSections(
        menu.visibleTemplateKeys,
        menu.productScopes,
        menu.featureVisibility.sportPreferences,
        {
          isAdmin: menu.isAdmin,
          defaultCreateIntent: menu.defaultCreateIntent,
        },
      )
    : [];

  return (
    <Dialog.Root open={open && !disabled} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label="Choose event category"
          title="Choose event category"
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-[#76648f] transition hover:bg-[#f1ebff] hover:text-[#5c5be5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a98dff] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="size-6" strokeWidth={2.4} aria-hidden="true" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-[#25183a]/30 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-[101] max-h-[85dvh] overflow-y-auto rounded-t-3xl border border-[#ded2f5] bg-[#fbf9ff] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-[#25183a] shadow-2xl sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[420px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Dialog.Title className="flex items-center gap-2 text-xl font-semibold">
                <PartyPopper className="size-5 text-[#5c5be5]" aria-hidden="true" />
                Start an event
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-[#76648f]">
                {hasConversation
                  ? "Choose a category to start a new chat."
                  : "Choose what you're planning."}
              </Dialog.Description>
            </div>
            <Dialog.Close
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-[#f1ebff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a98dff]"
              aria-label="Close categories"
            >
              <X className="size-5" aria-hidden="true" />
            </Dialog.Close>
          </div>
          {!preferencesReady ? (
            <div className="py-6 text-sm text-[#76648f]" role="status">
              {menu.featureVisibility.loading ? (
                "Loading your categories…"
              ) : (
                <>
                  <p>Your categories couldn't be loaded.</p>
                  <button
                    type="button"
                    onClick={() => void menu.featureVisibility.refresh()}
                    className="mt-2 min-h-11 rounded-xl px-3 font-semibold text-[#5c5be5] hover:bg-[#f1ebff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a98dff]"
                  >
                    Try again
                  </button>
                </>
              )}
            </div>
          ) : (
            sections.map((section) => (
              <section key={section.title} className="mt-5">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#76648f]">
                  {section.title}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {section.items.map((item) => {
                    const choice = {
                      label: item.label,
                      href: item.href,
                      prompt: categoryPrompt(item.label),
                    };
                    const Icon = categoryIcon(choice.prompt);
                    return (
                      <button
                        key={item.href}
                        type="button"
                        onClick={() => {
                          setOpen(false);
                          onSelect(choice);
                        }}
                        className="flex min-h-14 items-center gap-3 rounded-2xl border border-[#ded2f5] bg-white px-3 py-3 text-left text-sm font-medium transition hover:border-[#a98dff] hover:bg-[#f1ebff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a98dff]"
                      >
                        <Icon className="size-5 shrink-0 text-[#7d58b8]" aria-hidden="true" />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
