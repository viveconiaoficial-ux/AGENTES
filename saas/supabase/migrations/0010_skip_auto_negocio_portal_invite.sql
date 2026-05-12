-- ============================================================================
--  Migración 0010 · invitaciones al portal sin crear negocio automático
--  El trigger handle_new_user (0001) inserta un negocio por cada auth.users.
--  Los dueños invitados desde la agencia llevan raw_user_meta_data.vive_invite = portal
--  y no deben tener un negocio propio: solo portal_user_id en el negocio del cliente.
-- ============================================================================
--  Proyecto hosted: en Dashboard → Authentication → URL configuration añade
--  Redirect URLs: https://TU_DOMINIO/portal (y el origen de la app).
-- ============================================================================

begin;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(new.raw_user_meta_data->>'vive_invite', '') = 'portal' then
    return new;
  end if;

  insert into public.negocios (owner_user_id, nombre)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', 'Mi negocio')
  );
  return new;
end;
$$;

commit;
