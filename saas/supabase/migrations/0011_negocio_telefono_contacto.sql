-- Teléfono público de atención: se muestra en mensajes de reserva del widget si falla n8n.
alter table public.negocios
  add column if not exists telefono_contacto text;

comment on column public.negocios.telefono_contacto is
  'Opcional. Se ofrece al visitante del chat web cuando /api/chat no puede completar la respuesta vía n8n.';
