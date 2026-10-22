"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { BarCompare, DonutChart } from "./PerfilCharts";

type Perfil = {
  id: number;
  username: string;
  nombres: string | null;
  apellidos: string | null;
  dni: string | null;
  telefono: string | null;
  email: string | null;
  rol: string;
  estado: number;
  fotoUrl: string | null;
  resumen: {
    ventasCantidad: number;
    ventasTotal: number;
    gastosCantidad: number;
    gastosTotal: number;
    balance: number;
  };
};

const card = "rounded-[16px] border border-borde bg-blanco shadow-sm";
const inputBase =
  "w-full rounded-[14px] border bg-[var(--muted)] px-3 py-2.5 text-sm text-noche outline-none transition placeholder:text-texto-suave disabled:cursor-not-allowed disabled:opacity-60 disabled:text-texto-suave";
const inputNormal =
  `${inputBase} border-borde focus:border-lavanda focus:bg-blanco focus:ring-2 focus:ring-[color-mix(in_srgb,var(--lavanda)_28%,transparent)]`;
const inputMatch =
  `${inputBase} border-emerald-400 bg-[color-mix(in_srgb,#16a34a_14%,var(--blanco))] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20`;
const inputMismatch =
  `${inputBase} border-red-300 bg-[color-mix(in_srgb,#b91c1c_14%,var(--blanco))] focus:border-red-400 focus:ring-2 focus:ring-red-400/20`;
const btnPrimary =
  "rounded-[14px] bg-[#6d28d9] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5b21b6] disabled:opacity-60";

function money(value: number | undefined) {
  const n = Number(value ?? 0);
  return `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function IconVentas({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 19V5M4 19h16" strokeLinecap="round" />
      <path d="M8 15v-4M12 15V8M16 15v-6" strokeLinecap="round" />
    </svg>
  );
}

function IconGastos({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 8h16M4 12h10M4 16h7" strokeLinecap="round" />
      <path d="m14 14 6 6M20 14l-6 6" strokeLinecap="round" />
    </svg>
  );
}

function IconTicket({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        d="M4 9a2 2 0 0 0 2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1a2 2 0 0 0 2 2v6a2 2 0 0 0-2 2v1a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-1a2 2 0 0 0-2-2z"
        strokeLinejoin="round"
      />
      <path d="M12 8v8" strokeLinecap="round" strokeDasharray="2 3" />
    </svg>
  );
}

export function PerfilModule() {
  const { success, error: toastError } = useToast();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [dni, setDni] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [fotoTick, setFotoTick] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const passwordsMatch =
    newPassword.length > 0 &&
    confirmPassword.length > 0 &&
    newPassword === confirmPassword;

  const passwordsMismatch =
    confirmPassword.length > 0 && newPassword !== confirmPassword;

  const passInputClass = passwordsMatch
    ? inputMatch
    : passwordsMismatch
      ? inputMismatch
      : inputNormal;

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/perfil", { cache: "no-store", credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo cargar el perfil");
      const p = data.perfil as Perfil;
      setPerfil(p);
      setNombres(p.nombres || "");
      setApellidos(p.apellidos || "");
      setDni(p.dni || "");
      setTelefono(p.telefono || "");
      setEmail(p.email || "");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Error al cargar perfil");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const metrics = useMemo(() => {
    if (!perfil) return null;
    const r = perfil.resumen;
    const ventas = Number(r.ventasTotal) || 0;
    const gastos = Number(r.gastosTotal) || 0;
    const qty = Number(r.ventasCantidad) || 0;
    const ticket = qty > 0 ? ventas / qty : 0;
    const margen = ventas > 0 ? ((ventas - gastos) / ventas) * 100 : 0;
    return {
      ventas,
      gastos,
      qty,
      ticket,
      margen,
      balance: Number(r.balance) || 0,
      gastosQty: Number(r.gastosCantidad) || 0,
    };
  }, [perfil]);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch("/api/perfil", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombres, apellidos, dni, telefono, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo guardar");
      setPerfil(data.perfil);
      success("Datos actualizados");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Error");
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    setSavingPass(true);

    if (!passwordsMatch) {
      toastError("La nueva contraseña y la confirmación no coinciden");
      setSavingPass(false);
      return;
    }
    if (newPassword.length < 4) {
      toastError("La nueva contraseña debe tener al menos 4 caracteres");
      setSavingPass(false);
      return;
    }

    try {
      const res = await fetch("/api/perfil/password", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo cambiar la contraseña");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      success(data.message || "Contraseña actualizada");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Error");
    } finally {
      setSavingPass(false);
    }
  }

  async function onFotoSelected(file: File | null) {
    if (!file) return;
    setUploadingFoto(true);
    try {
      const form = new FormData();
      form.append("foto", file);
      const res = await fetch("/api/perfil/foto", {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo subir la foto");
      setPerfil(data.perfil);
      setFotoTick((n) => n + 1);
      success("Foto actualizada");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Error");
    } finally {
      setUploadingFoto(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-texto-suave">
        Cargando perfil…
      </div>
    );
  }

  if (!perfil || !metrics) {
    return (
      <div className="rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        No se pudo cargar el perfil
      </div>
    );
  }

  const displayName =
    [perfil.nombres, perfil.apellidos].filter(Boolean).join(" ").trim() || perfil.username;
  const initials = (
    (perfil.nombres || perfil.username).charAt(0) + (perfil.apellidos || "").charAt(0)
  ).toUpperCase();
  const fotoSrc = perfil.fotoUrl ? `${perfil.fotoUrl}&t=${fotoTick}` : null;

  return (
    <section className="grid gap-4 lg:grid-cols-[280px_1fr] xl:grid-cols-[300px_1fr]">
      <aside className={`${card} p-5`}>
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <div className="h-28 w-28 overflow-hidden rounded-full border-[3px] border-white bg-[#e8e4dc] shadow-md">
              {fotoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fotoSrc} alt={perfil.username} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[#d7d2c8] text-3xl font-bold text-texto-suave">
                  {initials}
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => onFotoSelected(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              disabled={uploadingFoto}
              onClick={() => fileRef.current?.click()}
              aria-label="Subir foto"
              className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#2563eb] text-white shadow-md transition hover:bg-[#1d4ed8] disabled:opacity-60"
            >
              {uploadingFoto ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9" strokeLinecap="round" />
                  <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </div>

          <h2 className="mt-4 font-[family-name:var(--font-syne)] text-xl font-bold text-noche">
            {displayName}
          </h2>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[#2563eb]">{perfil.rol}</p>
          <p className="mt-1 max-w-full truncate text-sm text-texto-suave">
            @{perfil.username}
          </p>
          <p className="mt-0.5 max-w-full truncate text-sm text-texto-suave">
            {perfil.email || "Sin correo"}
          </p>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <div className="rounded-[14px] bg-[#fff4e8] px-2 py-3 text-center">
            <div className="mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#ffd8a8] text-[#b86b2a]">
              <IconVentas />
            </div>
            <p className="text-[0.6rem] font-semibold uppercase tracking-wide text-[#b86b2a]">Ventas</p>
            <p className="text-lg font-bold text-noche">{metrics.qty}</p>
          </div>
          <div className="rounded-[14px] bg-[#ffeceb] px-2 py-3 text-center">
            <div className="mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#ffc9c2] text-[#b04a42]">
              <IconGastos />
            </div>
            <p className="text-[0.6rem] font-semibold uppercase tracking-wide text-[#b04a42]">Gastos</p>
            <p className="text-lg font-bold text-noche">{metrics.gastosQty}</p>
          </div>
          <div className="rounded-[14px] bg-[#eaf8ef] px-2 py-3 text-center">
            <div className="mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#c6ecd4] text-[#2f7a4f]">
              <IconTicket />
            </div>
            <p className="text-[0.6rem] font-semibold uppercase tracking-wide text-[#2f7a4f]">Ticket</p>
            <p className="text-sm font-bold text-noche">{money(metrics.ticket)}</p>
          </div>
        </div>

        <dl className="mt-5 space-y-2.5 text-sm">
          <div className="flex justify-between gap-2 border-b border-[#efece6] pb-2.5">
            <dt className="text-texto-suave">Usuario</dt>
            <dd className="font-medium text-noche">{perfil.username}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-texto-suave">Estado</dt>
            <dd>
              <span
                className={`rounded-[12px] px-2.5 py-0.5 text-xs font-semibold ${
                  perfil.estado ? "bg-[#eaf8ef] text-[#2f7a4f]" : "bg-[#fff4e8] text-[#b86b2a]"
                }`}
              >
                {perfil.estado ? "Activo" : "Inactivo"}
              </span>
            </dd>
          </div>
        </dl>
      </aside>

      <div className="flex min-w-0 flex-col gap-4">
        <div className="grid gap-4 xl:grid-cols-2">
          <section className={`${card} p-5`}>
            <div className="mb-4 flex items-start justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-noche">Flujo de caja</h3>
                <p className="text-xs text-texto-suave">Ventas frente a gastos</p>
              </div>
              <span
                className={`rounded-[12px] px-2.5 py-1 text-[0.65rem] font-bold ${
                  metrics.margen >= 0 ? "bg-[#eaf8ef] text-[#2f7a4f]" : "bg-[#ffeceb] text-[#b04a42]"
                }`}
              >
                Margen {metrics.margen.toFixed(0)}%
              </span>
            </div>
            <DonutChart
              centerLabel="Total"
              centerValue={money(metrics.ventas + metrics.gastos)}
              slices={[
                { label: "Ventas", value: metrics.ventas, color: "#3b82f6" },
                { label: "Gastos", value: metrics.gastos, color: "#f59e0b" },
              ]}
            />
          </section>

          <section className={`${card} p-5`}>
            <div className="mb-4">
              <h3 className="text-base font-bold text-noche">Indicadores</h3>
              <p className="text-xs text-texto-suave">Resumen del sistema de ventas</p>
            </div>
            <BarCompare
              items={[
                {
                  label: "Ingresos por ventas",
                  value: metrics.ventas,
                  color: "#3b82f6",
                  display: money(metrics.ventas),
                },
                {
                  label: "Gastos registrados",
                  value: metrics.gastos,
                  color: "#f59e0b",
                  display: money(metrics.gastos),
                },
                {
                  label: "Balance neto",
                  value: Math.abs(metrics.balance),
                  color: metrics.balance >= 0 ? "#22c55e" : "#ef4444",
                  display: money(metrics.balance),
                },
                {
                  label: "Ticket promedio",
                  value: metrics.ticket,
                  color: "#06b6d4",
                  display: money(metrics.ticket),
                },
              ]}
            />
          </section>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <form onSubmit={saveProfile} className={`${card} p-5`}>
            <h3 className="text-base font-bold text-noche">Datos personales</h3>
            <p className="mt-1 text-xs text-texto-suave">Completa tu perfil de acceso.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-medium text-texto-suave">Usuario</span>
                <input className={inputNormal} value={perfil.username} disabled />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-medium text-texto-suave">Rol</span>
                <input className={inputNormal} value={perfil.rol} disabled />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-medium text-texto-suave">Nombres</span>
                <input
                  className={inputNormal}
                  value={nombres}
                  onChange={(e) => setNombres(e.target.value)}
                  placeholder="Nombres"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-medium text-texto-suave">Apellidos</span>
                <input
                  className={inputNormal}
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                  placeholder="Apellidos"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-medium text-texto-suave">DNI</span>
                <input
                  className={inputNormal}
                  value={dni}
                  onChange={(e) => setDni(e.target.value.replace(/\D/g, ""))}
                  placeholder="Documento"
                  maxLength={15}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-medium text-texto-suave">Teléfono</span>
                <input
                  className={inputNormal}
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="999 000 000"
                />
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1 block text-xs font-medium text-texto-suave">Correo</span>
                <input
                  type="email"
                  className={inputNormal}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                />
              </label>
            </div>
            <button type="submit" disabled={savingProfile} className={`mt-4 ${btnPrimary}`}>
              {savingProfile ? "Guardando…" : "Actualizar"}
            </button>
          </form>

          <form onSubmit={changePassword} className={`${card} p-5`}>
            <h3 className="text-base font-bold text-noche">Cambiar contraseña</h3>
            <p className="mt-1 text-xs text-texto-suave">
              {passwordsMatch
                ? "Las contraseñas coinciden"
                : passwordsMismatch
                  ? "Las contraseñas no coinciden"
                  : "Actual, nueva y confirmación."}
            </p>
            <div className="mt-4 space-y-3">
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-medium text-texto-suave">Contraseña actual</span>
                <input
                  type="password"
                  className={inputNormal}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-medium text-texto-suave">Nueva</span>
                <input
                  type="password"
                  className={passInputClass}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={4}
                  autoComplete="new-password"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-medium text-texto-suave">Confirmar</span>
                <input
                  type="password"
                  className={passInputClass}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={4}
                  autoComplete="new-password"
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={savingPass || passwordsMismatch}
              className={`mt-4 ${btnPrimary}`}
            >
              {savingPass ? "Guardando…" : "Cambiar contraseña"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
