import { CalendarHeart, Gift, HeartHandshake, PartyPopper } from "lucide-react";

const secondaryCards = [
  {
    icon: PartyPopper,
    title: "Birthday Invites",
    copy: "Snap or upload a birthday invitation and turn it into a clean shareable event page with the core details organized for family and guests.",
  },
  {
    icon: HeartHandshake,
    title: "Wedding Invites",
    copy: "Upload wedding details when you need a polished page fast without manually retyping every date, location, and event note.",
  },
];

export default function SecondaryUploads() {
  return (
    <section
      id="other-uploads"
      className="px-4 py-20 sm:px-6 lg:px-8 lg:py-24"
      aria-labelledby="secondary-uploads-heading"
    >
      <div className="mx-auto max-w-7xl rounded-[2.25rem] border border-[#d8e3f0] bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)] sm:p-8 lg:p-10">
        <div className="grid gap-10 lg:grid-cols-[0.84fr_1.16fr] lg:items-start">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d7e2ec] bg-[#f8fbfd] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#4d8fb4]">
              <Gift className="h-4 w-4 text-[#d97706]" />
              Secondary upload story
            </div>
            <h2
              id="secondary-uploads-heading"
              className="mt-5 font-['Poppins'] text-4xl font-semibold tracking-[-0.04em] text-[#0b2035] sm:text-5xl"
            >
              Beyond meets: upload birthday and wedding invites too
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#587088]">
              Envitefy still works for family events. The key difference in this
              landing direction is that birthdays and weddings support the story
              after the meet value is already clear.
            </p>

            <div className="mt-8 rounded-[1.6rem] border border-[#d7e2ec] bg-[linear-gradient(135deg,#f6fbfd_0%,#fff8ef_100%)] p-5">
              <div className="flex items-center gap-3 text-[#10233f]">
                <CalendarHeart className="h-5 w-5 text-[#0f766e]" />
                <p className="text-base font-semibold">
                  Same upload simplicity, different event types
                </p>
              </div>
              <p className="mt-3 text-sm leading-7 text-[#587088]">
                If a family already trusts Envitefy for meet weekends, they can
                also use it when they need a clean page for invitations and
                milestone events.
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {secondaryCards.map(({ icon: Icon, title, copy }) => (
              <article
                key={title}
                className="rounded-[2rem] border border-[#d8e3f0] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbfd_100%)] p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef6fb] text-[#0f766e]">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-[#10233f]">
                  {title}
                </h3>
                <p className="mt-4 text-base leading-7 text-[#587088]">{copy}</p>

                <div className="mt-6 rounded-[1.4rem] border border-[#e1eaf2] bg-white p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#84a0b8]">
                    Upload flow
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#10233f]">
                    Photo or upload in, clean details out, one shareable event
                    page ready for guests.
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
