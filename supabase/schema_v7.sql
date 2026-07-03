-- ============================================================================
-- Tal'Dorei — esquema v7 (ejecutar DESPUÉS de v1..v6)
-- Pines del mundo editables por el DM (añadir, quitar, editar, mover, revelar,
-- cambiar icono). Sustituye a los pines fijos del código como fuente de verdad
-- una vez "sembrados". El DM edita en Panel DM › Mapa › Mundo.
-- ============================================================================

create table if not exists public.world_poi (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'ciudad',        -- WorldType (ciudad, capital, pueblo, region, natural, peligro, fortaleza, ruina, continente)
  continent text not null default 'Tal''Dorei',
  icon text,                                    -- override opcional (p. ej. 'fa-dragon'); si null se usa el icono del tipo
  x real not null default 50,
  y real not null default 50,
  blurb text not null default '',
  revealed boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.world_poi enable row level security;

drop policy if exists "world_poi: leer autenticados" on public.world_poi;
create policy "world_poi: leer autenticados" on public.world_poi
  for select to authenticated using (true);

drop policy if exists "world_poi: el DM edita" on public.world_poi;
create policy "world_poi: el DM edita" on public.world_poi
  for all to authenticated using (public.is_dm()) with check (public.is_dm());

-- Realtime para que los cambios lleguen a todos al instante.
alter publication supabase_realtime add table public.world_poi;
