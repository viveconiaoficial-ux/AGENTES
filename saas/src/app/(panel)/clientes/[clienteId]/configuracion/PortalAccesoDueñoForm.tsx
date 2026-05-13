"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  actualizarPortalUsuarioDueño,
  vincularPortalDueñoPorEmail,
} from "./portal-acceso-actions";

export default function PortalAccesoDueñoForm({
  negocioId,
  portalUserIdActual,
  portalDueñoEmail,
}: {
  negocioId: string;
  portalUserIdActual: string | null;
  portalDueñoEmail: string | null;
}) {
  const router = useRouter();
  const [emailDueño, setEmailDueño] = useState(portalDueñoEmail ?? "");
  const [uuidAvanzado, setUuidAvanzado] = useState(portalUserIdActual ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  const [msgTone, setMsgTone] = useState<"ok" | "err">("ok");
  const [pendingEmail, startEmail] = useTransition();
  const [pendingUuid, startUuid] = useTransition();
  const [pendingQuitar, startQuitar] = useTransition();
  const [originCliente, setOriginCliente] = useState<string | null>(null);

  useEffect(() => {
    setOriginCliente(window.location.origin);
  }, []);

  useEffect(() => {
    setEmailDueño(portalDueñoEmail ?? "");
    setUuidAvanzado(portalUserIdActual ?? "");
  }, [portalDueñoEmail, portalUserIdActual]);

  const envBase = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
  const portalUrlCompleta = envBase
    ? `${envBase}/portal`
    : originCliente
      ? `${originCliente}/portal`
      : null;

  function onVincularEmail(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    startEmail(async () => {
      const r = await vincularPortalDueñoPorEmail(negocioId, emailDueño);
      if ("error" in r && r.error) {
        setMsgTone("err");
        setMsg(r.error);
        return;
      }
      if ("ok" in r && r.ok) {
        setMsgTone("ok");
        setMsg(r.mensaje);
        router.refresh();
      }
    });
  }

  function onGuardarUuid(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    startUuid(async () => {
      const r = await actualizarPortalUsuarioDueño(negocioId, uuidAvanzado);
      if (r.error) {
        setMsgTone("err");
        setMsg(r.error);
        return;
      }
      setMsgTone("ok");
      setMsg("UUID guardado.");
      router.refresh();
    });
  }

  function onQuitarAcceso() {
    if (!confirm("¿Quitar el acceso del dueño al portal? Podrás volver a vincular otro email.")) {
      return;
    }
    setMsg(null);
    startQuitar(async () => {
      const r = await actualizarPortalUsuarioDueño(negocioId, "");
      if (r.error) {
        setMsgTone("err");
        setMsg(r.error);
        return;
      }
      setMsgTone("ok");
      setMsg("Acceso quitado.");
      setEmailDueño("");
      setUuidAvanzado("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-[13px] leading-relaxed text-emerald-100/95">
        <p className="font-medium text-emerald-50">Forma fácil (recomendada)</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-emerald-100/85">
          <li>Pregunta al dueño <strong>qué email quiere usar</strong> (el mismo para entrar al portal).</li>
          <li>
            Escríbelo abajo y pulsa <strong>Dar acceso</strong>. Si no tenía cuenta, Supabase le enviará un correo
            para activarla.
          </li>
          <li>
            Ese correo <strong>no incluye contraseña</strong> (es lo normal). El enlace activa la cuenta y entra al
            portal. Para poder entrar luego con email y contraseña, use después{" "}
            <strong>Iniciar sesión → Recuperar contraseña</strong> o el enlace «Contraseña» dentro del portal.
          </li>
          <li>
            En Supabase → Authentication → URL configuration, debe estar permitida la URL{" "}
            <code className="text-white/90">…/auth/callback</code> del sitio (además de la Site URL).
          </li>
        </ol>
      </div>

      {portalUserIdActual ? (
        <div className="rounded-xl border border-white/12 bg-white/[0.06] px-3 py-2 text-sm text-white/80">
          Estado: <span className="text-emerald-300">acceso del dueño activo</span>
          {portalDueñoEmail ? (
            <>
              {" "}
              → <span className="text-white">{portalDueñoEmail}</span>
            </>
          ) : (
            <span className="text-white/45"> (no vemos el email sin clave de servicio en servidor)</span>
          )}
        </div>
      ) : (
        <p className="text-sm text-white/50">Todavía no hay dueño vinculado a este negocio.</p>
      )}

      <form onSubmit={onVincularEmail} className="space-y-2">
        <label className="block">
          <span className="text-[11px] uppercase tracking-wide text-white/45">Email del dueño</span>
          <input
            type="email"
            autoComplete="email"
            value={emailDueño}
            onChange={(e) => setEmailDueño(e.target.value)}
            placeholder="ej. maria@clinica.com"
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-white/25"
          />
        </label>
        <p className="text-[11px] text-white/40">
          Requiere{" "}
          <code className="rounded bg-black/40 px-1 py-0.5 text-[10px]">SUPABASE_SERVICE_ROLE_KEY</code> en el
          servidor (Vercel). Ahí mismo debe estar bien configurado el correo de Auth en Supabase.
        </p>
        <button
          type="submit"
          disabled={pendingEmail || !emailDueño.trim()}
          className="w-full rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 shadow hover:bg-white/90 disabled:opacity-50 sm:w-auto"
        >
          {pendingEmail ? "Procesando…" : "Dar acceso con este email"}
        </button>
      </form>

      <div className="space-y-1">
        <span className="text-[11px] uppercase tracking-wide text-white/45">URL donde entra el dueño</span>
        <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 font-mono text-[11px] text-white/80 break-all">
          {portalUrlCompleta ?? (
            <span className="text-white/40">
              Define <code className="text-[10px]">NEXT_PUBLIC_APP_URL</code> en Vercel para mostrar el enlace
              exacto.
            </span>
          )}
        </div>
        <p className="text-xs text-white/45">
          Esto no es el widget de la web del cliente: es el panel reducido solo para calendario y conversaciones.
        </p>
      </div>

      {portalUserIdActual ? (
        <button
          type="button"
          onClick={onQuitarAcceso}
          disabled={pendingQuitar}
          className="text-sm text-red-300/90 underline-offset-2 hover:underline disabled:opacity-50"
        >
          {pendingQuitar ? "Quitando…" : "Quitar acceso del dueño"}
        </button>
      ) : null}

      <details className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm">
        <summary className="cursor-pointer select-none text-white/55">Opción avanzada: pegar UUID de Supabase</summary>
        <p className="mt-2 text-xs text-white/40 leading-relaxed">
          Solo si ya copiaste el User UID desde Supabase → Authentication → Users.
        </p>
        <form onSubmit={onGuardarUuid} className="mt-2 space-y-2">
          <input
            value={uuidAvanzado}
            onChange={(e) => setUuidAvanzado(e.target.value)}
            placeholder="UUID o vacío para quitar"
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-xs text-white outline-none focus:border-white/25"
          />
          <button
            type="submit"
            disabled={pendingUuid}
            className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white ring-1 ring-white/15 hover:bg-white/15 disabled:opacity-50"
          >
            {pendingUuid ? "Guardando…" : "Guardar UUID"}
          </button>
        </form>
      </details>

      {msg ? (
        <p className={`text-sm ${msgTone === "ok" ? "text-emerald-300" : "text-red-300"}`}>{msg}</p>
      ) : null}
    </div>
  );
}
