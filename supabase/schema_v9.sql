-- v9: tiradas de PG por nivel.
alter table public.characters add column if not exists hp_rolls jsonb not null default '{}'::jsonb;
