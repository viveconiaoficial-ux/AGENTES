-- ============================================================================
--  Migracion 0002 · modo agencia + compatibilidad con esquema legado
-- ============================================================================

begin;

-- 1) Negocios: columnas nuevas para app actual
alter table public.negocios
  add column if not exists prompt_personalizado text,
  add column if not exists widget_accent text default '#7c9cff',
  add column if not exists widget_bg_from text default '#1a1a24',
  add column if not exists widget_bg_to text default '#09090b';

-- Copia prompt legado -> prompt nuevo cuando falte.
update public.negocios
set prompt_personalizado = prompt_sistema
where prompt_personalizado is null
  and prompt_sistema is not null;

-- 2) Modo agencia: sin autocreacion de negocio en registro.
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

commit;
