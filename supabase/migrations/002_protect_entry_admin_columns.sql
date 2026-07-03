-- Players may update their entries (rename, re-pick) but only admins may
-- change payment/lock state. Enforced by trigger so the column values are
-- silently preserved for non-admins.

revoke update on public.entries from anon, authenticated;
grant update on public.entries to authenticated;

create or replace function public.protect_entry_columns()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    if tg_op = 'INSERT' then
      new.paid := false;
      new.paid_at := null;
      new.locked := false;
    else
      new.paid := old.paid;
      new.paid_at := old.paid_at;
      new.locked := old.locked;
      new.season_id := old.season_id;
      new.profile_id := old.profile_id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_entry_columns on public.entries;
create trigger protect_entry_columns
  before insert or update on public.entries
  for each row execute function public.protect_entry_columns();
