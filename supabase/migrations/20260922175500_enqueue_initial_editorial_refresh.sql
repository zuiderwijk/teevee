-- Best-effort initial population after the independent editorial refresh boundary is
-- introduced. The normal lifecycle is the hourly pg_cron job from the preceding
-- migration. If a fresh environment applies migrations before deploying the Edge
-- Function, this queued request may fail harmlessly; the next scheduled refresh retries.

select teevee.enqueue_tvgids_editorial_refresh();
