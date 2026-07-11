create extension if not exists pgcrypto;

create type public.user_role as enum ('registered', 'playtester', 'admin');
create type public.arena_access_mode as enum ('closed', 'invite_only', 'public_event');
create type public.event_status as enum ('draft', 'scheduled', 'active', 'ended', 'cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text check (char_length(display_name) between 2 and 40),
  role public.user_role not null default 'registered',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references public.profiles(id) on delete set null
);

create index profiles_email_idx on public.profiles (lower(email));
create index profiles_display_name_idx on public.profiles (lower(display_name));
create index profiles_role_idx on public.profiles (role);

create table public.arena_settings (
  id smallint primary key default 1 check (id = 1),
  access_mode public.arena_access_mode not null default 'closed',
  guest_access_enabled boolean not null default false,
  progression_enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);
insert into public.arena_settings (id) values (1);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  description text check (char_length(description) <= 600),
  join_code text,
  public_token text unique,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  guest_access_enabled boolean not null default false,
  max_guests integer not null default 100 check (max_guests between 1 and 1000),
  progression_enabled boolean not null default false,
  status public.event_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index events_active_window_idx on public.events (status, starts_at, ends_at);

create table public.guest_sessions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 40),
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  left_at timestamptz
);
create index guest_sessions_capacity_idx on public.guest_sessions (event_id, expires_at) where left_at is null;

create table public.admin_audit_log (
  id bigint generated always as identity primary key,
  admin_id uuid not null references public.profiles(id),
  action text not null,
  target_user_id uuid references public.profiles(id) on delete set null,
  previous_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);
create index admin_audit_log_created_idx on public.admin_audit_log (created_at desc);

create table public.rate_limit_attempts (
  id bigint generated always as identity primary key,
  attempt_key text not null,
  action text not null,
  created_at timestamptz not null default now()
);
create index rate_limit_attempts_lookup_idx on public.rate_limit_attempts (attempt_key, created_at desc);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, coalesce(new.email, ''), nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''));
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger profiles_updated before update on public.profiles for each row execute procedure public.set_updated_at();
create trigger events_updated before update on public.events for each row execute procedure public.set_updated_at();

create or replace function public.admit_event_guest(
  requested_event_id uuid,
  requested_display_name text,
  requested_token_hash text,
  requested_join_code text default null
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare selected_event public.events%rowtype; active_guests integer;
begin
  perform pg_advisory_xact_lock(hashtext(requested_event_id::text));
  select * into selected_event from public.events where id = requested_event_id for update;
  if selected_event.id is null or selected_event.status <> 'active' or not selected_event.guest_access_enabled
     or now() < selected_event.starts_at or now() >= selected_event.ends_at then
    raise exception 'Event guest access is not active';
  end if;
  if selected_event.join_code is not null and selected_event.join_code <> coalesce(requested_join_code, '') then
    raise exception 'Invalid join code';
  end if;
  select count(*) into active_guests from public.guest_sessions
    where event_id = requested_event_id and left_at is null and expires_at > now();
  if active_guests >= selected_event.max_guests then raise exception 'Event guest capacity reached'; end if;
  insert into public.guest_sessions (event_id, display_name, token_hash, expires_at)
    values (requested_event_id, trim(requested_display_name), requested_token_hash, selected_event.ends_at);
  return jsonb_build_object('expires_at', selected_event.ends_at);
end;
$$;
revoke all on function public.admit_event_guest(uuid,text,text,text) from public, anon, authenticated;
grant execute on function public.admit_event_guest(uuid,text,text,text) to service_role;

alter table public.profiles enable row level security;
alter table public.arena_settings enable row level security;
alter table public.events enable row level security;
alter table public.guest_sessions enable row level security;
alter table public.admin_audit_log enable row level security;
alter table public.rate_limit_attempts enable row level security;

create policy "users read own profile" on public.profiles for select to authenticated using ((select auth.uid()) = id);
-- There is deliberately no client UPDATE policy on profiles. Display-name and all role changes go through reviewed server actions.
-- Settings, events, guest sessions, audit data, and rate-limit records are server-only. The service role bypasses RLS.

grant select on public.profiles to authenticated;
revoke all on public.arena_settings, public.events, public.guest_sessions, public.admin_audit_log, public.rate_limit_attempts from anon, authenticated;

comment on table public.profiles is 'Verified PodBound accounts and server-managed authorization roles.';
comment on table public.arena_settings is 'Singleton Arena access switch; changed without redeployment.';
comment on table public.events is 'Server-enforced public event windows and guest access configuration.';
comment on table public.admin_audit_log is 'Immutable application-level record of sensitive administration actions.';
