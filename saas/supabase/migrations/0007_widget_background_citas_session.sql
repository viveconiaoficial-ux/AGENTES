-- ============================================================================
--  Migración 0007 · imagen de fondo del widget + session_id en citas (si falta)
-- ============================================================================

begin;

alter table public.negocios
  add column if not exists widget_background_image_url text;

comment on column public.negocios.widget_background_image_url is
  'URL HTTPS de imagen de fondo del chat embebido (opcional).';

alter table public.citas
  add column if not exists session_id text;

create index if not exists citas_negocio_session_idx
  on public.citas(negocio_id, session_id);

commit;
