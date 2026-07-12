create table public.site_settings (
  id smallint primary key default 1 check (id = 1),
  maintenance_enabled boolean not null default false,
  maintenance_message text not null default 'The PodBound Field Archives are temporarily closed for updates.',
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

insert into public.site_settings (id) values (1)
on conflict (id) do nothing;

alter table public.site_settings enable row level security;
revoke all on public.site_settings from anon, authenticated;
grant select on public.site_settings to anon, authenticated;

create policy "maintenance status is publicly readable"
  on public.site_settings for select
  to anon, authenticated
  using (id = 1);

comment on table public.site_settings is
  'Publicly readable site availability status; writable only through authenticated administrator server actions.';
