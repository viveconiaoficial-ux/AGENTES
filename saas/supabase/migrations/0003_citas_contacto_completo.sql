-- ============================================================================
--  Migracion 0003 · contacto completo en citas (nombre, apellido, tel, email)
--  Idempotente.
-- ============================================================================

begin;

alter table public.citas
  add column if not exists nombre text,
  add column if not exists apellido text,
  add column if not exists telefono text,
  add column if not exists email text;

-- Si ya hay datos antiguos en cliente_telefono, copialos a telefono cuando este vacio.
update public.citas
set telefono = cliente_telefono
where telefono is null
  and cliente_telefono is not null;

-- Si nombre_cliente tiene "Nombre Apellido", parte y rellena nombre/apellido si faltan.
update public.citas
set
  nombre = coalesce(nombre, split_part(nombre_cliente, ' ', 1)),
  apellido = coalesce(
    apellido,
    nullif(trim(substring(nombre_cliente from position(' ' in nombre_cliente) + 1)), '')
  )
where nombre_cliente is not null
  and (nombre is null or apellido is null);

create index if not exists citas_telefono_idx on public.citas(telefono);
create index if not exists citas_email_idx on public.citas(email);

commit;
