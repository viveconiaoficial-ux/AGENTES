# Vive · SaaS (Fase 1)

Esqueleto Next.js 14 (App Router) + Supabase Auth + Tailwind en modo agencia (un admin, multiples clientes).

## Estructura

```
saas/
├── supabase/schema.sql            # Tablas, triggers, RLS, helpers
├── src/
│   ├── app/
│   │   ├── page.tsx               # Landing pública
│   │   ├── login/                 # Email + password
│   │   ├── register/              # Registro publico desactivado (modo agencia)
│   │   ├── auth/callback/         # Confirmación email / OAuth
│   │   ├── auth/signout/          # POST → cierra sesión
│   │   ├── demo/[negocioId]/      # Demo publica para pruebas/comercial
│   │   └── (panel)/               # Layout autenticado
│   │       ├── dashboard/
│   │       └── clientes/[clienteId]/
│   │           ├── negocio/
│   │           ├── conversaciones/
│   │           ├── citas/
│   │           ├── probar/
│   │           └── configuracion/
│   ├── components/Sidebar.tsx
│   ├── components/ChatWidget.tsx
│   └── lib/supabase/
│       ├── client.ts              # Browser client
│       ├── server.ts              # Server Components / Route Handlers
│       └── middleware.ts          # Refresca sesión + protege rutas
└── middleware.ts                  # Punto de entrada del middleware Next.js
```

## Setup local

### 1. Variables de entorno

Copia el ejemplo:

```bash
cp .env.example .env.local
```

Y rellénalo:

```env
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_CHAT_ENDPOINT=http://alfredito1981.duckdns.org/webhook/agente-web
```

Esos valores los sacas en Supabase → **Project Settings → API**.

### 2. Crear tablas y políticas RLS en Supabase

En tu proyecto Supabase, abre **SQL Editor** y ejecuta el archivo `supabase/schema.sql`.

> Si ya tenías tablas previas (de tu n8n actual), revisa el SQL antes — añade columnas y políticas. Es seguro re-ejecutarlo (todo es `if not exists` / `drop policy if exists`).

Esto te crea:

- Tabla `negocios` con `owner_user_id` (modo agencia).
- Tablas `conversaciones`, `citas`, `agent_errors`.
- Personalizacion por cliente: `widget_accent`, `widget_bg_from`, `widget_bg_to`.
- Sin trigger de autocreacion: los clientes se crean desde el dashboard.
- Políticas RLS: cada owner solo ve sus datos.
- Helper `is_owner_of(_negocio_id)` para reutilizar en políticas.

### 3. Configurar Auth en Supabase

En **Authentication → URL Configuration**:

- **Site URL**: `http://localhost:3000` (dev) y `https://TU-DOMINIO.vercel.app` (prod).
- **Redirect URLs**: añade `http://localhost:3000/auth/callback` y `https://TU-DOMINIO.vercel.app/auth/callback`.

Recomendado para modo agencia:
- Desactivar registro publico en Supabase Auth.
- Mantener solo tu usuario admin.

### 4. Instalar y arrancar

```bash
cd saas
npm install
npm run dev
```

Abrir http://localhost:3000.

## Flujo de uso

1. Entras con tu usuario admin en `/login`.
2. En `/dashboard` creas clientes (tabla `negocios`).
3. En `/clientes/<id>/negocio` configuras prompt, datos y fondo del widget.
4. En `/clientes/<id>/probar` validas el flujo de chat.
5. En `/clientes/<id>/configuracion` copias:
   - enlace demo para mostrar/prueba comercial
   - snippet de `embed.js` para web del cliente

## Conexión con n8n

Tu workflow de n8n debe usar el **service_role key** de Supabase (bypassa RLS) para escribir conversaciones y citas en nombre de un negocio sin tener una sesión de usuario.

> Pon `SUPABASE_SERVICE_ROLE_KEY` solo en n8n. **Nunca** en el frontend.

El widget web envía a `NEXT_PUBLIC_CHAT_ENDPOINT` con el body:

```json
{
  "negocio_id": "<uuid>",
  "session_id": "<uuid local>",
  "mensaje": "..."
}
```

n8n busca el negocio por `negocio_id`, llama al modelo, guarda mensaje + respuesta y devuelve el texto de respuesta.

## Despliegue en Vercel

1. **GitHub**: sube este repo (la carpeta raíz `saas/` o el monorepo entero).
2. **Vercel** → **New Project** → importa el repo.
3. Si subiste el monorepo, selecciona **Root Directory = `saas`**.
4. **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_CHAT_ENDPOINT`
5. Deploy.
6. Vuelve a Supabase → Authentication → URL Configuration → añade el dominio Vercel.

## Lo que viene en Fase 2

- Realtime: actualizar conversaciones y citas en vivo (Supabase Realtime).
- Calendario visual de citas.
- Logs de errores agrupados por negocio.

## Lo que viene en Fase 3

- Stripe + planes.
- Onboarding paso a paso.
- Métricas (mensajes/mes, citas reservadas, conversión).

---

Cualquier duda, dime y vamos pieza a pieza.
