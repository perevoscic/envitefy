-- Add a covering index for user-scoped history queries that sort by created_at desc, id desc.
-- This matches the ORDER BY used in listEventHistoryByUser to avoid statement timeouts.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_history_user_created_id
  ON event_history(user_id, created_at DESC, id DESC);
