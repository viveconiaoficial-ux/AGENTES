-- ============================================================================
--  Migracion 0004 · estado parcial de cita en sesiones
--  Permite acumular datos de cita entre mensajes (fecha, hora, nombre, etc.)
-- ============================================================================

begin;

alter table public.sesiones
  add column if not exists datos_cita jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists sesiones_negocio_session_uniq
  on public.sesiones(negocio_id, session_id);

drop trigger if exists trg_sesiones_updated on public.sesiones;
create trigger trg_sesiones_updated
before update on public.sesiones
for each row execute procedure public.set_updated_at();

commit;
