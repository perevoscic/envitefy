"use client";
import { useSession } from "next-auth/react";

export default function ContactPage() {
  const { data: session } = useSession();
  return (
    <main className="min-h-screen w-full bg-background text-foreground landing-dark-gradient flex items-center justify-center p-6">
      <section className="w-full max-w-2xl">
        <div className="rounded-3xl bg-surface/80 backdrop-blur-sm p-8 border border-border">
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-[1.18] tracking-tight pb-1 overflow-visible text-center">
            <span className="bg-clip-text pb-10 text-transparent bg-gradient-to-r from-cyan-600 via-sky-500 to-fuchsia-600 dark:from-cyan-300 dark:via-sky-200 dark:to-fuchsia-300">
              Contact
              <span> </span>
              <span className="font-pacifico inline-block pb-1"> Snap</span>
              <span> </span>
              <span className="font-montserrat">My Date</span>
            </span>
          </h1>
          <p className="mt-3 text-foreground/80 text-center">
            Questions, feedback, or partnership ideas? Send us a note.
          </p>

          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              alert("Thanks! We'll be in touch.");
            }}
          >
            <div>
              <label htmlFor="name" className="text-sm text-foreground/70">
                Name
              </label>
              <input
                id="name"
                required
                defaultValue={(session?.user as any)?.name || ""}
                className="mt-1 w-full border border-border bg-surface/60 text-foreground p-3 rounded opacity-60 cursor-not-allowed"
                disabled
              />
            </div>
            <div>
              <label htmlFor="email" className="text-sm text-foreground/70">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                defaultValue={(session?.user as any)?.email || ""}
                className="mt-1 w-full border border-border bg-surface/60 text-foreground p-3 rounded opacity-60 cursor-not-allowed"
                disabled
              />
            </div>
            <div>
              <label htmlFor="title" className="text-sm text-foreground/70">
                Title
              </label>
              <input
                id="title"
                required
                className="mt-1 w-full border border-border bg-surface/60 text-foreground p-3 rounded"
                placeholder="Subject of your message"
              />
            </div>
            <div>
              <label htmlFor="message" className="text-sm text-foreground/70">
                Message
              </label>
              <textarea
                id="message"
                rows={5}
                required
                className="mt-1 w-full border border-border bg-surface/60 text-foreground p-3 rounded"
              />
            </div>
            <div className="pt-2">
              <button className="inline-flex items-center justify-center rounded-2xl px-6 py-3 text-base font-semibold bg-teal-500 hover:bg-teal-400 active:bg-teal-600 text-neutral-900 shadow-lg shadow-teal-500/25">
                Send message
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
