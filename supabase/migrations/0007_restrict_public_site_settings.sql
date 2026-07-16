-- Public visitors only need the singleton key for filtering and the maintenance flag.
-- Keep administrator identifiers and operational metadata available to service-role code only.
revoke select on public.site_settings from anon, authenticated;
grant select (id, maintenance_enabled) on public.site_settings to anon, authenticated;

comment on table public.site_settings is
  'Public maintenance status. Anonymous and authenticated clients can read only id and maintenance_enabled; administrative metadata remains server-only.';
