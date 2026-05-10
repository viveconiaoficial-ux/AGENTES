-- ============================================================================
--  Migración 0008 · bucket Storage para imagen de fondo del widget
-- ============================================================================

begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'widget-assets',
  'widget-assets',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "widget_assets_public_read" on storage.objects;
create policy "widget_assets_public_read"
  on storage.objects for select
  using (bucket_id = 'widget-assets');

drop policy if exists "widget_assets_insert_own" on storage.objects;
create policy "widget_assets_insert_own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'widget-assets'
    and exists (
      select 1
      from public.negocios n
      where n.id::text = split_part(name, '/', 1)
        and n.owner_user_id = auth.uid()
    )
  );

drop policy if exists "widget_assets_update_own" on storage.objects;
create policy "widget_assets_update_own"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'widget-assets'
    and exists (
      select 1
      from public.negocios n
      where n.id::text = split_part(name, '/', 1)
        and n.owner_user_id = auth.uid()
    )
  );

drop policy if exists "widget_assets_delete_own" on storage.objects;
create policy "widget_assets_delete_own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'widget-assets'
    and exists (
      select 1
      from public.negocios n
      where n.id::text = split_part(name, '/', 1)
        and n.owner_user_id = auth.uid()
    )
  );

commit;
