ALTER TABLE public.subscriptions DROP CONSTRAINT subscriptions_status_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_status_check
  CHECK (status = ANY (ARRAY['pending'::text, 'active'::text, 'rejected'::text, 'cancelled'::text, 'expired'::text]));