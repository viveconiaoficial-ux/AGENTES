# Supabase introspection
- URL: `https://dovoggkeoguqtscmsjna.supabase.co`
- Fecha: 2026-05-09T07:44:50.631Z

## Tablas (5)

### `agent_errors` — 0 filas

| columna | tipo | required | default | pk | fk |
|---|---|---|---|---|---|
| `id` | `uuid` | ✓ | gen_random_uuid() | ✓ |  |
| `negocio_id` | `uuid` |  |  |  |  |
| `workflow_name` | `text` |  |  |  |  |
| `node_name` | `text` |  |  |  |  |
| `error_message` | `text` |  |  |  |  |
| `created_at` | `timestamp with time zone` |  | now() |  |  |

### `citas` — 0 filas

| columna | tipo | required | default | pk | fk |
|---|---|---|---|---|---|
| `id` | `uuid` | ✓ | gen_random_uuid() | ✓ |  |
| `negocio_id` | `uuid` |  |  |  |  |
| `session_id` | `text` | ✓ |  |  |  |
| `fecha_hora` | `timestamp with time zone` |  |  |  |  |
| `nombre_cliente` | `text` |  |  |  |  |
| `servicio` | `text` |  |  |  |  |
| `estado` | `text` |  | pendiente |  |  |
| `created_at` | `timestamp with time zone` |  | now() |  |  |
| `cliente_telefono` | `text` |  |  |  |  |
| `duracion_min` | `integer` |  | 30 |  |  |
| `notas` | `text` |  |  |  |  |
| `updated_at` | `timestamp with time zone` | ✓ | now() |  |  |

### `mensajes` — 0 filas

| columna | tipo | required | default | pk | fk |
|---|---|---|---|---|---|
| `id` | `uuid` | ✓ | gen_random_uuid() | ✓ |  |
| `negocio_id` | `uuid` |  |  |  |  |
| `session_id` | `text` | ✓ |  |  |  |
| `rol` | `text` |  |  |  |  |
| `contenido` | `text` | ✓ |  |  |  |
| `tipo_agente` | `text` |  | conversacional |  |  |
| `created_at` | `timestamp with time zone` |  | now() |  |  |
| `canal` | `text` | ✓ | web |  |  |

### `negocios` — 1 filas

| columna | tipo | required | default | pk | fk |
|---|---|---|---|---|---|
| `id` | `uuid` | ✓ | gen_random_uuid() | ✓ |  |
| `nombre` | `text` | ✓ |  |  |  |
| `descripcion` | `text` |  |  |  |  |
| `horario` | `text` |  |  |  |  |
| `direccion` | `text` |  |  |  |  |
| `prompt_sistema` | `text` |  |  |  |  |
| `created_at` | `timestamp with time zone` |  | now() |  |  |
| `owner_user_id` | `uuid` |  |  |  |  |
| `evolution_host` | `text` |  |  |  |  |
| `evolution_apikey` | `text` |  |  |  |  |
| `evolution_instance` | `text` |  |  |  |  |
| `updated_at` | `timestamp with time zone` | ✓ | now() |  |  |

### `sesiones` — 0 filas

| columna | tipo | required | default | pk | fk |
|---|---|---|---|---|---|
| `id` | `uuid` | ✓ | gen_random_uuid() | ✓ |  |
| `negocio_id` | `uuid` |  |  |  |  |
| `session_id` | `text` | ✓ |  |  |  |
| `metadata` | `jsonb` |  |  |  |  |
| `created_at` | `timestamp with time zone` |  | now() |  |  |
