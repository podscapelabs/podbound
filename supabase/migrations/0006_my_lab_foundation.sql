-- Shared Podscape Labs account progression foundation.
-- This migration intentionally adds no public My Lab UI and no commerce-provider data.

create table public.podling_catalog (
  key text primary key check (key ~ '^[a-z0-9][a-z0-9-]{1,62}$'),
  name text not null check (char_length(name) between 2 and 80),
  description text check (char_length(description) <= 600),
  asset_path text,
  is_available boolean not null default false,
  display_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.account_progression (
  account_id uuid primary key references public.profiles(id) on delete cascade,
  total_exp bigint not null default 0 check (total_exp >= 0),
  account_level integer not null default 1 check (account_level >= 1),
  loyalty_level integer not null default 0 check (loyalty_level >= 0),
  discount_tier text not null default 'none' check (char_length(discount_tier) between 1 and 40),
  permanent_discount_bps smallint not null default 0 check (permanent_discount_bps between 0 and 1000),
  active_podling_id uuid,
  last_exp_at timestamptz,
  last_reward_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.account_podlings (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.profiles(id) on delete cascade,
  podling_key text not null references public.podling_catalog(key) on delete restrict,
  custom_name text check (custom_name is null or char_length(custom_name) between 2 and 40),
  unlocked_by text not null default 'system' check (char_length(unlocked_by) between 1 and 80),
  unlocked_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint account_podlings_account_key_unique unique (account_id, podling_key),
  constraint account_podlings_id_account_unique unique (id, account_id)
);

alter table public.account_progression
  add constraint account_progression_active_podling_owned
  foreign key (active_podling_id, account_id)
  references public.account_podlings(id, account_id)
  on delete no action
  deferrable initially deferred;

create table public.account_exp_history (
  id bigint generated always as identity primary key,
  account_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null check (amount <> 0),
  balance_after bigint not null check (balance_after >= 0),
  reason text not null check (char_length(reason) between 1 and 160),
  source_type text check (source_type is null or char_length(source_type) between 1 and 80),
  source_id text check (source_id is null or char_length(source_id) between 1 and 160),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.account_reward_history (
  id bigint generated always as identity primary key,
  account_id uuid not null references public.profiles(id) on delete cascade,
  reward_key text not null check (char_length(reward_key) between 1 and 120),
  reward_label text not null check (char_length(reward_label) between 1 and 160),
  action text not null check (action in ('granted', 'revoked', 'redeemed')),
  details jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index account_podlings_account_idx on public.account_podlings (account_id, unlocked_at desc);
create index account_exp_history_account_idx on public.account_exp_history (account_id, created_at desc);
create index account_exp_history_source_idx on public.account_exp_history (source_type, source_id) where source_type is not null;
create index account_reward_history_account_idx on public.account_reward_history (account_id, created_at desc);

create trigger podling_catalog_updated before update on public.podling_catalog
  for each row execute procedure public.set_updated_at();
create trigger account_progression_updated before update on public.account_progression
  for each row execute procedure public.set_updated_at();
create trigger account_podlings_updated before update on public.account_podlings
  for each row execute procedure public.set_updated_at();

create or replace function public.initialize_account_progression()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.account_progression (account_id)
  values (new.id)
  on conflict (account_id) do nothing;
  return new;
end;
$$;

create trigger profile_progression_created
  after insert on public.profiles
  for each row execute procedure public.initialize_account_progression();

create or replace function public.record_account_exp(
  target_account_id uuid,
  exp_delta integer,
  exp_reason text,
  exp_source_type text default null,
  exp_source_id text default null,
  actor_id uuid default null
) returns bigint
language plpgsql security definer set search_path = '' as $$
declare
  current_balance bigint;
  next_balance bigint;
begin
  if exp_delta = 0 then raise exception 'EXP adjustment cannot be zero'; end if;
  if char_length(trim(exp_reason)) < 1 or char_length(trim(exp_reason)) > 160 then
    raise exception 'EXP reason must contain between 1 and 160 characters';
  end if;

  select total_exp into current_balance
  from public.account_progression
  where account_id = target_account_id
  for update;

  if current_balance is null then raise exception 'Account progression record not found'; end if;
  next_balance := current_balance + exp_delta;
  if next_balance < 0 then raise exception 'EXP balance cannot become negative'; end if;

  update public.account_progression
  set total_exp = next_balance, last_exp_at = now()
  where account_id = target_account_id;

  insert into public.account_exp_history (
    account_id, amount, balance_after, reason, source_type, source_id, created_by
  ) values (
    target_account_id, exp_delta, next_balance, trim(exp_reason),
    nullif(trim(exp_source_type), ''), nullif(trim(exp_source_id), ''), actor_id
  );

  return next_balance;
end;
$$;

revoke all on function public.record_account_exp(uuid,integer,text,text,text,uuid) from public, anon, authenticated;
grant execute on function public.record_account_exp(uuid,integer,text,text,text,uuid) to service_role;

alter table public.podling_catalog enable row level security;
alter table public.account_progression enable row level security;
alter table public.account_podlings enable row level security;
alter table public.account_exp_history enable row level security;
alter table public.account_reward_history enable row level security;

create policy "available Podlings are readable by accounts"
  on public.podling_catalog for select to authenticated
  using (is_available);
create policy "accounts read own progression"
  on public.account_progression for select to authenticated
  using ((select auth.uid()) = account_id);
create policy "accounts read own unlocked Podlings"
  on public.account_podlings for select to authenticated
  using ((select auth.uid()) = account_id);
create policy "accounts read own EXP history"
  on public.account_exp_history for select to authenticated
  using ((select auth.uid()) = account_id);
create policy "accounts read own reward history"
  on public.account_reward_history for select to authenticated
  using ((select auth.uid()) = account_id);

grant select on public.podling_catalog, public.account_progression, public.account_podlings,
  public.account_exp_history, public.account_reward_history to authenticated;
revoke insert, update, delete on public.podling_catalog, public.account_progression, public.account_podlings,
  public.account_exp_history, public.account_reward_history from anon, authenticated;

comment on table public.account_progression is
  'Shared Podscape Labs account EXP, level, loyalty, discount, and active-Podling state.';
comment on table public.podling_catalog is
  'Platform Podling definitions; ownership is represented separately in account_podlings.';
comment on table public.account_podlings is
  'Podlings unlocked by an account, including the account-specific Podling name.';
comment on table public.account_exp_history is
  'Immutable server-issued account EXP ledger. Podlings never hold separate EXP.';
comment on table public.account_reward_history is
  'Immutable server-issued reward and entitlement history for a shared platform account.';

-- Keep the existing-account backfill last. The active-Podling foreign key is
-- deferred, so inserting rows earlier would leave pending trigger events and
-- prevent later ALTER TABLE statements (including enabling RLS) in this batch.
insert into public.account_progression (account_id)
select id from public.profiles
on conflict (account_id) do nothing;
