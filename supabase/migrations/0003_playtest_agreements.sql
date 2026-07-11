create table public.playtest_agreement_acceptances (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.profiles(id) on delete cascade,
  guest_session_id uuid references public.guest_sessions(id) on delete cascade,
  agreement_version text not null check (char_length(agreement_version) between 1 and 80),
  accepted_at timestamptz not null default now(),
  check ((account_id is not null)::integer + (guest_session_id is not null)::integer = 1)
);

create unique index playtest_agreement_account_version_idx
  on public.playtest_agreement_acceptances (account_id, agreement_version)
  where account_id is not null;
create unique index playtest_agreement_guest_version_idx
  on public.playtest_agreement_acceptances (guest_session_id, agreement_version)
  where guest_session_id is not null;
create index playtest_agreement_accepted_idx
  on public.playtest_agreement_acceptances (accepted_at desc);

alter table public.playtest_agreement_acceptances enable row level security;
revoke all on public.playtest_agreement_acceptances from anon, authenticated;

comment on table public.playtest_agreement_acceptances is
  'Server-recorded acceptance of the versioned PodBound playtest participation agreement.';
