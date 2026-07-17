-- Fase H: bucket público 'assets' con escritura solo DM.
-- Ejecutar una vez en el SQL Editor de Supabase. is_dm() ya existe (schema.sql).

insert into storage.buckets (id, name, public)
values ('assets', 'assets', true)
on conflict (id) do update set public = true;

drop policy if exists "assets_select_public" on storage.objects;
create policy "assets_select_public" on storage.objects
  for select to public using (bucket_id = 'assets');

drop policy if exists "assets_insert_dm" on storage.objects;
create policy "assets_insert_dm" on storage.objects
  for insert to authenticated with check (bucket_id = 'assets' and public.is_dm());

drop policy if exists "assets_update_dm" on storage.objects;
create policy "assets_update_dm" on storage.objects
  for update to authenticated using (bucket_id = 'assets' and public.is_dm());

drop policy if exists "assets_delete_dm" on storage.objects;
create policy "assets_delete_dm" on storage.objects
  for delete to authenticated using (bucket_id = 'assets' and public.is_dm());
