/**
 * SQL fragment: parse event_history JSON `start*` text into timestamptz without
 * using pg_input_is_valid (PostgreSQL 16+). Keeps dashboard/history queries
 * working on PostgreSQL 14/15 (e.g. common RDS versions).
 *
 * @param startRawExpr SQL expression evaluating to text (nullable), e.g. dashboard start raw coalesce.
 */
export function buildEventStartAtTsSql(startRawExpr: string): string {
  return `case
    when ${startRawExpr} is null then null
    when trim(${startRawExpr}) = '' then null
    when ${startRawExpr} ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{1,2}:[0-9]{2}(:[0-9]{2}(\\.\\d{1,6})?)?(Z|[+-][0-9]{2}(:?[0-9]{2})?)$'
      then (${startRawExpr})::timestamptz
    when ${startRawExpr} ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{1,2}:[0-9]{2}(:[0-9]{2}(\\.\\d{1,6})?)?$'
      then (${startRawExpr})::timestamp at time zone 'UTC'
    when ${startRawExpr} ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{1,2}:[0-9]{2}(:[0-9]{2}(\\.\\d{1,6})?)?$'
      then (${startRawExpr})::timestamp at time zone 'UTC'
    when ${startRawExpr} ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
      then (${startRawExpr})::timestamp at time zone 'UTC'
    else null
  end`;
}
