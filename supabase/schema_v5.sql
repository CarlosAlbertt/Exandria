-- ============================================================================
-- Tal'Dorei — esquema v5 (ejecutar DESPUÉS de v1..v4)
-- Config de la app editable por el DM (p. ej. la URL del túnel de la IA), para
-- no tener que tocar Vercel ni redeploy cada vez que cambia.
-- ============================================================================

create table if not exists public.app_config (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

insert into public.app_config (key, value) values ('ollama_host', '') on conflict (key) do nothing;

alter table public.app_config enable row level security;

drop policy if exists "cfg: leer autenticados" on public.app_config;
create policy "cfg: leer autenticados" on public.app_config
  for select to authenticated using (true);

drop policy if exists "cfg: el DM edita" on public.app_config;
create policy "cfg: el DM edita" on public.app_config
  for all to authenticated using (public.is_dm()) with check (public.is_dm());
