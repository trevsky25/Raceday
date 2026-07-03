-- Trigger functions don't need (and shouldn't have) RPC-level EXECUTE.
-- Postgres checks EXECUTE at trigger creation, not fire time, so this is safe.
revoke execute on function public.handle_new_user() from anon, authenticated, public;
revoke execute on function public.protect_entry_columns() from anon, authenticated, public;
