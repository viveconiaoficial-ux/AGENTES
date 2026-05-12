-- ============================================================================
--  Migración 0009 · acceso «dueño del negocio» (portal) sin ser la agencia
--  El dueño consulta calendario y conversaciones; la agencia sigue con owner_user_id.
-- ============================================================================

begin;

alter table public.negocios
  add column if not exists portal_user_id uuid references auth.users(id) on delete set null;

create index if not exists negocios_portal_user_idx
  on public.negocios(portal_user_id)
  where portal_user_id is not null;

comment on column public.negocios.portal_user_id is
  'Usuario (dueño del negocio) con acceso solo al portal /portal: citas y mensajes. Sin gestión de widget/embed.';

create or replace function public.is_portal_of(_negocio_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from public.negocios
    where id = _negocio_id and portal_user_id = auth.uid()
  );
$$;

-- Ver su negocio (la UI portal solo muestra campos no sensibles)
drop policy if exists "negocios_sel_portal" on public.negocios;
create policy "negocios_sel_portal"
  on public.negocios for select
  using (portal_user_id = auth.uid());

-- Citas: mismo alcance operativo que la agencia para ese negocio
drop policy if exists "citas_select_portal" on public.citas;
create policy "citas_select_portal"
  on public.citas for select
  using (public.is_portal_of(negocio_id));

drop policy if exists "citas_insert_portal" on public.citas;
create policy "citas_insert_portal"
  on public.citas for insert
  with check (public.is_portal_of(negocio_id));

drop policy if exists "citas_update_portal" on public.citas;
create policy "citas_update_portal"
  on public.citas for update
  using (public.is_portal_of(negocio_id))
  with check (public.is_portal_of(negocio_id));

drop policy if exists "citas_delete_portal" on public.citas;
create policy "citas_delete_portal"
  on public.citas for delete
  using (public.is_portal_of(negocio_id));

-- Mensajes: lectura del historial de conversaciones
drop policy if exists "mensajes_select_portal" on public.mensajes;
create policy "mensajes_select_portal"
  on public.mensajes for select
  using (public.is_portal_of(negocio_id));

commit;
