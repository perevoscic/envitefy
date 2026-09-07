/** Send only user changes, not unchanged form values reformatted for date/time inputs. */
export function changedCardEditFields(
  fields: Record<string, string | undefined>,
  baseline: Record<string, string | undefined>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(fields).filter(
      (entry): entry is [string, string] =>
        entry[1] !== undefined && entry[1] !== baseline[entry[0]],
    ),
  );
}
