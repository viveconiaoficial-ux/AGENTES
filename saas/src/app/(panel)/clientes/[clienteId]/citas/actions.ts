"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const ESTADOS = new Set([
  "pendiente",
  "confirmada",
  "cancelada",
  "completada",
  "no_show",
]);

export type CitaFormInput = {
  fecha_hora: string;
  nombre: string;
  apellido?: string;
  telefono?: string;
  email?: string;
  servicio?: string;
  duracion_min?: number;
  estado?: string;
  notas?: string;
};

export async function crearCitaCliente(negocioId: string, data: CitaFormInput) {
  if (!negocioId || !data.fecha_hora?.trim() || !data.nombre?.trim()) {
    return { error: "Fecha y nombre son obligatorios." };
  }
  const estado = data.estado?.trim() || "pendiente";
  if (!ESTADOS.has(estado)) {
    return { error: "Estado no válido." };
  }
  const supabase = createClient();
  const { error } = await supabase.from("citas").insert({
    negocio_id: negocioId,
    fecha_hora: data.fecha_hora,
    nombre: data.nombre.trim(),
    apellido: data.apellido?.trim() || null,
    telefono: data.telefono?.trim() || null,
    email: data.email?.trim() || null,
    servicio: data.servicio?.trim() || null,
    duracion_min: data.duracion_min ?? 30,
    estado,
    notas: data.notas?.trim() || null,
  });
  if (error) return { error: error.message };
  revalidatePath(`/clientes/${negocioId}/citas`);
  revalidatePath("/portal/calendario");
  revalidatePath(`/clientes/${negocioId}/vista-portal/calendario`);
  return { ok: true as const };
}

export async function actualizarCitaCliente(
  citaId: string,
  negocioId: string,
  patch: Partial<CitaFormInput>
) {
  if (!citaId || !negocioId) {
    return { error: "Datos incompletos." };
  }
  const row: Record<string, unknown> = {};
  if (patch.fecha_hora != null) row.fecha_hora = patch.fecha_hora;
  if (patch.nombre != null) row.nombre = patch.nombre.trim() || null;
  if (patch.apellido !== undefined) row.apellido = patch.apellido?.trim() || null;
  if (patch.telefono !== undefined) row.telefono = patch.telefono?.trim() || null;
  if (patch.email !== undefined) row.email = patch.email?.trim() || null;
  if (patch.servicio !== undefined) row.servicio = patch.servicio?.trim() || null;
  if (patch.duracion_min != null) row.duracion_min = patch.duracion_min;
  if (patch.estado != null) {
    if (!ESTADOS.has(patch.estado)) return { error: "Estado no válido." };
    row.estado = patch.estado;
  }
  if (patch.notas !== undefined) row.notas = patch.notas?.trim() || null;
  if (Object.keys(row).length === 0) {
    return { error: "Nada que actualizar." };
  }
  const supabase = createClient();
  const { error } = await supabase
    .from("citas")
    .update(row)
    .eq("id", citaId)
    .eq("negocio_id", negocioId);
  if (error) return { error: error.message };
  revalidatePath(`/clientes/${negocioId}/citas`);
  revalidatePath("/portal/calendario");
  revalidatePath(`/clientes/${negocioId}/vista-portal/calendario`);
  return { ok: true as const };
}

export async function eliminarCitaCliente(citaId: string, negocioId: string) {
  if (!citaId || !negocioId) {
    return { error: "Datos incompletos." };
  }
  const supabase = createClient();
  const { error } = await supabase
    .from("citas")
    .delete()
    .eq("id", citaId)
    .eq("negocio_id", negocioId);
  if (error) return { error: error.message };
  revalidatePath(`/clientes/${negocioId}/citas`);
  revalidatePath("/portal/calendario");
  revalidatePath(`/clientes/${negocioId}/vista-portal/calendario`);
  return { ok: true as const };
}
