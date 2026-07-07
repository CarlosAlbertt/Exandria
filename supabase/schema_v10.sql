-- v10: puntos de experiencia.
alter table public.characters add column if not exists xp int not null default 0;
