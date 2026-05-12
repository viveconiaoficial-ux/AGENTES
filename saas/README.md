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
N8N_CHAT_WEBHOOK_URL=https://TU-N8N/webhook/agente-web
```

(El webhook debe ser el del flujo **web** en n8n, path `agente-web`, no el de WhatsApp.)

Opcional: `NEXT_PUBLIC_CHAT_ENDPOINT` solo si quieres que el navegador llame **directo** a n8n (a veces falla por **CORS** entre dominios).

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

Importante: hay **dos flujos distintos**:

| Canal | Workflow | Webhook (path típico) | Entrada |
|-----|----------|------------------------|---------|
| **Web / widget** | Agente Universal Web + Agenda | `/webhook/agente-web` | JSON `negocio_id`, `session_id`, `mensaje` |
| **WhatsApp** | Agente Universal WhatsApp | `/webhook/whatsapp-agente` | Payload Evolution (`messages.upsert`) |

Si solo tienes activo el de WhatsApp, el chat de la **web no llegará**: son nodos y formatos diferentes.

### Proxy sin CORS (recomendado en Vercel)

Por defecto el widget llama a **`/api/chat`** (mismo dominio). Esa ruta reenvía el body a **`N8N_CHAT_WEBHOOK_URL`** (secreto en servidor). Así el navegador no habla directo con n8n y no choca con CORS.

Tu workflow de n8n debe usar el **service_role key** de Supabase (bypassa RLS) para escribir conversaciones y citas en nombre de un negocio sin sesión de usuario.

> Pon `SUPABASE_SERVICE_ROLE_KEY` solo en n8n. **Nunca** en el frontend.

Cuerpo que llega a n8n (igual que antes):

```json
{
  "negocio_id": "<uuid>",
  "session_id": "<uuid local>",
  "mensaje": "..."
}
```

n8n busca el negocio por `negocio_id`, llama al modelo, guarda mensaje + respuesta y devuelve el texto de respuesta.

## Despliegue en Vercel

1. **GitHub**: importa este repo (monorepo con carpeta `saas/`).

2. **Recomendado** — **Project → Settings → General → Root Directory** → **`saas`**.  
   Así `npm install` y `next build` corren solo en la app; no instales la raíz del monorepo sola. **No copies** `saas/.next` a la raíz del repo (eso provoca 500 genéricos en producción).

3. **Si el despliegue sigue anclado en la raíz del monorepo** (Vercel sin Root Directory `saas`): el **`vercel.json`** de la raíz instala `saas` y, **después del build**, copia `saas/.next` y `saas/public` a la raíz porque Vercel espera ahí el `routes-manifest.json`. Si más adelante ves 500 raros en producción, cambia a Root Directory `saas` y quita esa copia del `buildCommand`.

4. **Build & Development Settings**: si usas Root Directory `saas`, deja install/build por defecto y los overrides del panel solo para lo que falte. Si usas raíz + `vercel.json`, no pongas en el panel un install que **reemplace** y omita el `vercel.json`.

5. **Environment Variables** (Production):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (solo servidor, para `/api/widget/citas`)
   - **`N8N_CHAT_WEBHOOK_URL`** — URL completa del webhook **web** (`…/webhook/agente-web`)
   - Opcional: `NEXT_PUBLIC_CHAT_ENDPOINT` (llamada directa navegador→n8n; puede fallar por CORS)
   - Opcional: `NEXT_PUBLIC_APP_URL` con tu dominio o `*.vercel.app`
6. **Deploy** (Redeploy tras cambiar Root Directory o `vercel.json`).
7. En **Supabase → Authentication → URL Configuration** añade la URL de tu app en Vercel.

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
