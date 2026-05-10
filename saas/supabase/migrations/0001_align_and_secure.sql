-- ============================================================================
--  Migración 0001 · alinear tablas existentes + seguridad multi-tenant
--  Idempotente: se puede re-ejecutar sin romper nada.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ─── 1. NEGOCIOS · añadir multi-tenant + Evolution + updated_at ──────────────
alter table public.negocios
  add column if not exists owner_user_id uuid references auth.users(id) on delete cascade,
  add column if not exists evolution_host text,
  add column if not exists evolution_apikey text,
  add column if not exists evolution_instance text,
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists negocios_evolution_instance_uniq
  on public.negocios(evolution_instance)
  where evolution_instance is not null;

create index if not exists negocios_owner_idx on public.negocios(owner_user_id);

-- ─── 2. MENSAJES · añadir canal (web/whatsapp) + índices ────────────────────
alter table public.mensajes
  add column if not exists canal text not null default 'web';

create index if not exists mensajes_negocio_idx on public.mensajes(negocio_id);
create index if not exists mensajes_session_idx on public.mensajes(session_id);
create index if not exists mensajes_negocio_session_idx
  on public.mensajes(negocio_id, session_id, created_at desc);
create index if not exists mensajes_created_idx on public.mensajes(created_at desc);

-- ─── 3. CITAS · campos extra + updated_at ───────────────────────────────────
alter table public.citas
  add column if not exists cliente_telefono text,
  add column if not exists duracion_min int default 30,
  add column if not exists notas text,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists citas_negocio_idx on public.citas(negocio_id);
create index if not exists citas_negocio_fecha_idx on public.citas(negocio_id, fecha_hora);

-- ─── 4. SESIONES · índices ──────────────────────────────────────────────────
create index if not exists sesiones_session_idx on public.sesiones(session_id);
create index if not exists sesiones_negocio_idx on public.sesiones(negocio_id);

-- ─── 5. AGENT_ERRORS · negocio_id puede ser null (errores globales) ─────────
create index if not exists agent_errors_negocio_idx
  on public.agent_errors(negocio_id);

-- ─── 6. updated_at trigger ──────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_negocios_updated on public.negocios;
create trigger trg_negocios_updated
before update on public.negocios
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_citas_updated on public.citas;
create trigger trg_citas_updated
before update on public.citas
for each row execute procedure public.set_updated_at();

-- ─── 7. AUTO-CREAR negocio al registrarse usuario ───────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.negocios (owner_user_id, nombre)
  values (new.id, coalesce(new.raw_user_meta_data->>'nombre', 'Mi negocio'));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- ─── 8. Helper: ¿el negocio es del usuario logueado? ────────────────────────
create or replace function public.is_owner_of(_negocio_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.negocios
    where id = _negocio_id and owner_user_id = auth.uid()
  );
$$;

-- ─── 9. ROW LEVEL SECURITY ──────────────────────────────────────────────────
alter table public.negocios     enable row level security;
alter table public.mensajes     enable row level security;
alter table public.citas        enable row level security;
alter table public.sesiones     enable row level security;
alter table public.agent_errors enable row level security;

-- ── negocios ────────────────────────────────────────────────────────────────
drop policy if exists "negocios_sel_own" on public.negocios;
create policy "negocios_sel_own"
  on public.negocios for select
  using (owner_user_id = auth.uid());

drop policy if exists "negocios_upd_own" on public.negocios;
create policy "negocios_upd_own"
  on public.negocios for update
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

drop policy if exists "negocios_ins_own" on public.negocios;
create policy "negocios_ins_own"
  on public.negocios for insert
  with check (owner_user_id = auth.uid());

drop policy if exists "negocios_del_own" on public.negocios;
create policy "negocios_del_own"
  on public.negocios for delete
  using (owner_user_id = auth.uid());

-- ── mensajes (lectura por dueño del negocio) ────────────────────────────────
drop policy if exists "mensajes_sel_own" on public.mensajes;
create policy "mensajes_sel_own"
  on public.mensajes for select
  using (public.is_owner_of(negocio_id));

drop policy if exists "mensajes_ins_own" on public.mensajes;
create policy "mensajes_ins_own"
  on public.mensajes for insert
  with check (public.is_owner_of(negocio_id));

drop policy if exists "mensajes_del_own" on public.mensajes;
create policy "mensajes_del_own"
  on public.mensajes for delete
  using (public.is_owner_of(negocio_id));

-- ── citas ───────────────────────────────────────────────────────────────────
drop policy if exists "citas_sel_own" on public.citas;
create policy "citas_sel_own"
  on public.citas for select
  using (public.is_owner_of(negocio_id));

drop policy if exists "citas_ins_own" on public.citas;
create policy "citas_ins_own"
  on public.citas for insert
  with check (public.is_owner_of(negocio_id));

drop policy if exists "citas_upd_own" on public.citas;
create policy "citas_upd_own"
  on public.citas for update
  using (public.is_owner_of(negocio_id))
  with check (public.is_owner_of(negocio_id));

drop policy if exists "citas_del_own" on public.citas;
create policy "citas_del_own"
  on public.citas for delete
  using (public.is_owner_of(negocio_id));

-- ── sesiones ────────────────────────────────────────────────────────────────
drop policy if exists "sesiones_sel_own" on public.sesiones;
create policy "sesiones_sel_own"
  on public.sesiones for select
  using (public.is_owner_of(negocio_id));

drop policy if exists "sesiones_ins_own" on public.sesiones;
create policy "sesiones_ins_own"
  on public.sesiones for insert
  with check (public.is_owner_of(negocio_id));

-- ── agent_errors ────────────────────────────────────────────────────────────
drop policy if exists "errors_sel_own" on public.agent_errors;
create policy "errors_sel_own"
  on public.agent_errors for select
  using (negocio_id is null or public.is_owner_of(negocio_id));

-- ─── 10. NOTA SOBRE n8n / SERVICE ROLE ──────────────────────────────────────
--  El service_role salta RLS. n8n debe usar service_role en sus headers para
--  poder escribir en mensajes/citas sin sesión de usuario.
--  Esquema mínimo de cabeceras n8n:
--    apikey:        <service_role_key>
--    Authorization: Bearer <service_role_key>
