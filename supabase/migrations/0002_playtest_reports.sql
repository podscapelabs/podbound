create table public.playtest_reports (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.profiles(id) on delete set null,
  guest_session_id uuid references public.guest_sessions(id) on delete set null,
  event_id uuid references public.events(id) on delete set null,
  player_label text not null check (char_length(player_label) between 1 and 40),
  game_id text not null check (char_length(game_id) between 1 and 120),
  build_version text not null check (char_length(build_version) between 1 and 80),
  report jsonb not null,
  submitted_at timestamptz not null default now(),
  check (account_id is not null or guest_session_id is not null)
);

create index playtest_reports_submitted_idx on public.playtest_reports (submitted_at desc);
create index playtest_reports_account_idx on public.playtest_reports (account_id, submitted_at desc);
create index playtest_reports_event_idx on public.playtest_reports (event_id, submitted_at desc);

alter table public.playtest_reports enable row level security;
revoke all on public.playtest_reports from anon, authenticated;

comment on table public.playtest_reports is
  'Server-received PodBound game audits and voluntary feedback; readable through admin server code only.';
