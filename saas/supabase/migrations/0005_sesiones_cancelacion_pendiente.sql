-- ============================================================================
--  Migracion 0005 · cola de confirmacion para anular citas
-- ============================================================================

begin;

alter table public.sesiones
  add column if not exists cancelacion_pendiente jsonb;

commit;
