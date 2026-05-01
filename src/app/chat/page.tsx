import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Envitefy Chat | Create Events From a Message or Upload",
  description:
    "Start with one message, upload, or screenshot. Envitefy Chat collects the missing details and generates live cards, RSVP pages, and matching event assets.",
  alternates: { canonical: "/chat" },
};

const quickStartPrompts = [
  "Princess birthday for my daughter turning 7",
  "Upload last year's invite and make it modern",
  "Create a baby shower RSVP page with pastel colors",
  "Turn this school flyer into a hosted event page",
];

const outputOptions = [
  "Live invitation card",
  "Hosted RSVP page",
  "WhatsApp + text-ready version",
  "Instagram story + printable format",
  "Reminder + thank-you follow-up assets",
];

export default async function ChatPage() {
  const session: any = await getServerSession(authOptions as any);
  const isAdmin = Boolean(session?.user?.isAdmin);

  if (!isAdmin) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-8">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-violet-600">Envitefy Chat</p>
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">What are we celebrating?</h1>
        <p className="max-w-3xl text-base text-slate-600 sm:text-lg">
          Describe your event or upload anything you already have. Envitefy Chat asks for only
          what is missing, then builds a draft you can edit and publish.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <label htmlFor="chat-intake" className="sr-only">
          Event idea input
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="chat-intake"
            type="text"
            placeholder="Tell me or upload anything…"
            className="h-12 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none ring-violet-500 transition focus:ring-2"
            aria-describedby="chat-intake-help"
          />
          <button
            type="button"
            className="h-12 rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white transition hover:bg-violet-500"
          >
            Start draft
          </button>
        </div>
        <p id="chat-intake-help" className="mt-3 text-xs text-slate-500">
          Example uploads: old invitation, screenshot, flyer, menu, guest list, or handwritten
          notes.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-lg font-semibold text-slate-900">Quick prompts</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            {quickStartPrompts.map((prompt) => (
              <li key={prompt} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                “{prompt}”
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-lg font-semibold text-slate-900">One input, multiple outputs</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-700">
            {outputOptions.map((option) => (
              <li key={option}>{option}</li>
            ))}
          </ul>
        </article>
      </section>

      <footer className="rounded-2xl border border-dashed border-violet-300 bg-violet-50 p-5 text-sm text-violet-900">
        Already have events? Open <Link className="font-semibold underline" href="/dashboard">My Events</Link>{" "}
        to continue editing an existing invitation, RSVP page, or live card.
      </footer>
    </main>
  );
}
