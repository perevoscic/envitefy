/** The printed issue date describes the memo, not a parent calendar event. */
export default function SchoolMemoIssueDate({ schedule }: {
  schedule?: { kind?: string; issueDate?: string | null } | null;
}) {
  const issueDate = schedule?.kind === "school-memo" ? schedule.issueDate : null;
  if (!issueDate || !/^\d{4}-\d{2}-\d{2}$/.test(issueDate)) return null;
  const date = new Date(`${issueDate}T12:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== issueDate) return null;
  return (
    <p className="mt-3 text-lg opacity-80" data-school-memo-issue-date="">
      <time dateTime={issueDate}>{date.toLocaleDateString("en-US", {
        month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
      })}</time>
    </p>
  );
}
