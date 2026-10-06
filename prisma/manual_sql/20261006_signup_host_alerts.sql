BEGIN;
CREATE TABLE IF NOT EXISTS public.signup_host_alert_preferences (
  event_id uuid NOT NULL REFERENCES public.event_history(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  new_signups boolean NOT NULL, changes boolean NOT NULL, cancellations boolean NOT NULL, waitlist boolean NOT NULL,
  PRIMARY KEY(event_id,user_id));
CREATE TABLE IF NOT EXISTS public.signup_host_alerts (
  id uuid PRIMARY KEY, event_id uuid NOT NULL REFERENCES public.event_history(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  change_id uuid NOT NULL, activity jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','sending','accepted','failed','unknown','skipped')),
  attempts integer NOT NULL DEFAULT 0, next_attempt_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(change_id,recipient_id));
CREATE INDEX IF NOT EXISTS signup_host_alerts_due ON public.signup_host_alerts(next_attempt_at) WHERE status='pending';
CREATE INDEX IF NOT EXISTS signup_host_alerts_recipient ON public.signup_host_alerts(event_id,recipient_id,created_at DESC);
ALTER TABLE public.signup_host_alert_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signup_host_alerts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.signup_host_alert_preferences, public.signup_host_alerts FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
    REVOKE ALL ON TABLE public.signup_host_alert_preferences, public.signup_host_alerts FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
    REVOKE ALL ON TABLE public.signup_host_alert_preferences, public.signup_host_alerts FROM authenticated;
  END IF;
END $$;
COMMIT;
