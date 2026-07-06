-- v8: hoja interactiva — nivel, oro, ASI, equipo e inventario enriquecido.
alter table public.characters add column if not exists level int not null default 1;
alter table public.characters add column if not exists gold int not null default 0;
alter table public.characters add column if not exists asi jsonb not null default '{}'::jsonb;
alter table public.characters add column if not exists equipment jsonb not null default '{}'::jsonb;
alter table public.characters add column if not exists items jsonb not null default '[]'::jsonb;
