export default function UseCases() {
  const items = [
    {
      title: "Parents",
      text: "School events, parties, appointments—all in one place.",
    },
    {
      title: "Coaches",
      text: "Team schedules and practices without manual entry.",
    },
    {
      title: "Teachers",
      text: "Share class events as calendar links in seconds.",
    },
    {
      title: "Office admins",
      text: "From posted flyers to team calendars instantly.",
    },
    { title: "Healthcare", text: "Appointment cards to reminders that stick." },
  ];
  return (
    <section aria-labelledby="use-cases" className="w-full">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h2
          id="use-cases"
          className="text-2xl sm:text-3xl font-bold text-center"
        >
          Who it’s for
        </h2>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((i) => (
            <div
              key={i.title}
              className="rounded-2xl bg-surface/70 border border-border p-6"
            >
              <h3 className="text-lg font-semibold">{i.title}</h3>
              <p className="mt-1 text-foreground/70">{i.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
