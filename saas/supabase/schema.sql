-- ============================================================================
--  Vive SaaS · esquema base
--  Modo agencia: un login admin gestiona multiples negocios/clientes.
--  RLS activado para que cada owner solo vea sus propios negocios.
-- ============================================================================

-- ─── Extensiones ────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ─── 1. NEGOCIOS ────────────────────────────────────────────────────────────
create table if not exists public.negocios (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,

  nombre text not null,
  descripcion text,
  prompt_personalizado text,
  horario text,
  direccion text,

  -- Conexión Evolution API
  evolution_host text,
  evolution_apikey text,
  evolution_instance text unique,

  -- Personalizacion visual del widget por cliente
  widget_accent text default '#7c9cff',
  widget_bg_from text default '#1a1a24',
  widget_bg_to text default '#09090b',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists negocios_owner_idx on public.negocios(owner_user_id);

alter table public.negocios
  add column if not exists widget_accent text default '#7c9cff',
  add column if not exists widget_bg_from text default '#1a1a24',
  add column if not exists widget_bg_to text default '#09090b';

-- ─── 2. CONVERSACIONES ──────────────────────────────────────────────────────
create table if not exists public.conversaciones (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios(id) on delete cascade,

  -- Identidad del visitante (whatsapp = teléfono ; web = uuid de sesión)
  telefono_cliente text,
  session_id text,
  canal text not null default 'whatsapp', -- whatsapp | web

  rol text not null check (rol in ('user','assistant','system')),
  mensaje text,
  respuesta text,

  created_at timestamptz not null default now()
);

create index if not exists conv_negocio_idx on public.conversaciones(negocio_id);
create index if not exists conv_negocio_tel_idx on public.conversaciones(negocio_id, telefono_cliente);
create index if not exists conv_negocio_session_idx on public.conversaciones(negocio_id, session_id);
create index if not exists conv_created_idx on public.conversaciones(created_at desc);

-- ─── 3. CITAS ───────────────────────────────────────────────────────────────
create table if not exists public.citas (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios(id) on delete cascade,

  cliente_nombre text,
  cliente_telefono text,

  servicio text,
  fecha timestamptz not null,
  duracion_min int default 30,

  estado text not null default 'pendiente'
    check (estado in ('pendiente','confirmada','cancelada','completada','no_show')),

  notas text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists citas_negocio_idx on public.citas(negocio_id);
create index if not exists citas_negocio_fecha_idx on public.citas(negocio_id, fecha);

-- ─── 4. ERRORES (monitor de n8n) ────────────────────────────────────────────
create table if not exists public.agent_errors (
  id uuid primary key default gen_random_uuid(),
  workflow_name text,
  node_name text,
  error_message text,
  created_at timestamptz not null default now()
);

-- ─── 5. updated_at trigger ──────────────────────────────────────────────────
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

-- ─── 6. MODO AGENCIA: sin autocreacion al registrarse ───────────────────────
-- El alta de clientes/negocios se hace desde el panel admin.
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- ─── 7. ROW LEVEL SECURITY ──────────────────────────────────────────────────
alter table public.negocios       enable row level security;
alter table public.conversaciones enable row level security;
alter table public.citas          enable row level security;

-- Helpers: "este negocio es del usuario logueado"
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

-- ── negocios ───────────────────────────────────────────────────────────────
drop policy if exists "negocios_select_own" on public.negocios;
create policy "negocios_select_own"
  on public.negocios for select
  using (owner_user_id = auth.uid());

drop policy if exists "negocios_update_own" on public.negocios;
create policy "negocios_update_own"
  on public.negocios for update
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

drop policy if exists "negocios_insert_own" on public.negocios;
create policy "negocios_insert_own"
  on public.negocios for insert
  with check (owner_user_id = auth.uid());

drop policy if exists "negocios_delete_own" on public.negocios;
create policy "negocios_delete_own"
  on public.negocios for delete
  using (owner_user_id = auth.uid());

-- ── conversaciones ─────────────────────────────────────────────────────────
drop policy if exists "conv_select_own" on public.conversaciones;
create policy "conv_select_own"
  on public.conversaciones for select
  using (public.is_owner_of(negocio_id));

drop policy if exists "conv_insert_own" on public.conversaciones;
create policy "conv_insert_own"
  on public.conversaciones for insert
  with check (public.is_owner_of(negocio_id));

drop policy if exists "conv_delete_own" on public.conversaciones;
create policy "conv_delete_own"
  on public.conversaciones for delete
  using (public.is_owner_of(negocio_id));

-- ── citas ──────────────────────────────────────────────────────────────────
drop policy if exists "citas_select_own" on public.citas;
create policy "citas_select_own"
  on public.citas for select
  using (public.is_owner_of(negocio_id));

drop policy if exists "citas_insert_own" on public.citas;
create policy "citas_insert_own"
  on public.citas for insert
  with check (public.is_owner_of(negocio_id));

drop policy if exists "citas_update_own" on public.citas;
create policy "citas_update_own"
  on public.citas for update
  using (public.is_owner_of(negocio_id))
  with check (public.is_owner_of(negocio_id));

drop policy if exists "citas_delete_own" on public.citas;
create policy "citas_delete_own"
  on public.citas for delete
  using (public.is_owner_of(negocio_id));

-- ─── 8. SERVICE_ROLE bypass note ────────────────────────────────────────────
-- El service_role salta RLS. n8n debe usar service_role o el anon-key con
-- políticas adicionales si necesita escribir conversaciones/citas en nombre
-- del negocio sin sesión de usuario. Recomendado: usar service_role en n8n.
