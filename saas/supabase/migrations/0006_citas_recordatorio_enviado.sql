-- ============================================================================
--  Migración 0006 · recordatorio_enviado (emails recordatorio vía n8n/Resend)
--  Idempotente.
-- ============================================================================

begin;

alter table public.citas
  add column if not exists recordatorio_enviado boolean not null default false;

comment on column public.citas.recordatorio_enviado is
  'true cuando ya se envió el email de recordatorio (workflow Recordatorios citas Resend).';

-- Ayuda a la consulta del recordatorio: citas pendientes de aviso
create index if not exists citas_recordatorio_pendiente_idx
  on public.citas (fecha_hora)
  where recordatorio_enviado = false;

commit;
