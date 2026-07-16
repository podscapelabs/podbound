-- Retained playtest reports must not block account deletion or preserve structured identity fields.
alter table public.playtest_reports
  drop constraint if exists playtest_reports_check;

alter table public.playtest_reports
  add constraint playtest_reports_identity_check check (
    account_id is not null
    or guest_session_id is not null
    or player_label = 'Deleted playtester'
  );

create or replace function public.deidentify_deleted_account_reports()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.playtest_reports
  set
    account_id = null,
    player_label = 'Deleted playtester',
    report = report #- '{test,tester}' #- '{feedback,tester}'
  where account_id = old.id;

  return old;
end;
$$;

revoke all on function public.deidentify_deleted_account_reports() from public, anon, authenticated;

drop trigger if exists deidentify_reports_before_profile_delete on public.profiles;
create trigger deidentify_reports_before_profile_delete
before delete on public.profiles
for each row execute function public.deidentify_deleted_account_reports();

comment on function public.deidentify_deleted_account_reports() is
  'Removes structured player identity from retained playtest reports before an account profile is deleted.';
