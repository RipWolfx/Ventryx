"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/ToastProvider";
import { Empleado } from "@/lib/types";
import { ui } from "@/lib/ui";

type FormState = {
  nombres: string;
  apellidos: string;
  dni: string;
  telefono: string;
  email: string;
  cargo: string;
  estado: number;
};

const emptyForm: FormState = {
  nombres: "",
  apellidos: "",
  dni: "",
  telefono: "",
  email: "",
  cargo: "",
  estado: 1,
};

function fullName(e: Empleado) {
  return [e.nombres, e.apellidos].filter(Boolean).join(" ").trim() || e.dni;
}

function initials(e: Empleado) {
  const a = (e.nombres || "?").charAt(0);
  const b = (e.apellidos || "").charAt(0);
  return (a + b).toUpperCase();
}

function IconPlus({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function IconEdit({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 20h9" strokeLinecap="round" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" strokeLinejoin="round" />
    </svg>
  );
}

function IconTrash({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 7h16M9 7V5h6v2M8 7l1 12h6l1-12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconClose({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

function IconCheck({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function EmpleadosModule() {
  const { success, error: toastError } = useToast();
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Empleado | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/empleados", { cache: "no-store", credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cargar empleados");
      setEmpleados(data.empleados || []);
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return empleados;
    return empleados.filter((e) => {
      const hay = [e.nombres, e.apellidos, e.dni, e.telefono, e.email, e.cargo]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [empleados, query]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(emp: Empleado) {
    setEditing(emp);
    setForm({
      nombres: emp.nombres || "",
      apellidos: emp.apellidos || "",
      dni: emp.dni || "",
      telefono: emp.telefono || "",
      email: emp.email || "",
      cargo: emp.cargo || "",
      estado: emp.estado,
    });
    setOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setOpen(false);
    setEditing(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        dni: form.dni.trim(),
        telefono: form.telefono.trim() || null,
        email: form.email.trim() || null,
        cargo: form.cargo.trim() || null,
        estado: form.estado === 1,
      };

      if (!/^\d{8,15}$/.test(body.dni)) {
        throw new Error("El DNI debe tener entre 8 y 15 dígitos");
      }

      const res = await fetch(editing ? `/api/empleados/${editing.id}` : "/api/empleados", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo guardar");

      success(editing ? "Empleado actualizado" : "Empleado registrado");
      setOpen(false);
      setEditing(null);
      await load();
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(emp: Empleado) {
    if (!confirm(`¿Eliminar empleado "${fullName(emp)}"?`)) return;
    try {
      const res = await fetch(`/api/empleados/${emp.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo eliminar");
      success("Empleado eliminado");
      await load();
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Error");
    }
  }

  const field = ui.fieldLg;
  const label = ui.label;
  const estadoOptions = [
    { value: "1", label: "Activo" },
    { value: "0", label: "Inactivo" },
  ];

  return (
    <section className="mx-auto max-w-6xl">
      <div className={ui.cardPad}>
        <header className="flex flex-col gap-4 border-b border-borde pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-noche">Empleados</h2>
            <p className="mt-1 text-sm text-texto-suave">
              Total: {empleados.length}
              {query ? ` · Mostrando ${filtered.length}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar…"
              className={ui.search}
            />
            <button
              type="button"
              onClick={openCreate}
              className={ui.btnPrimary}
            >
              <IconPlus />
              Nuevo
            </button>
          </div>
        </header>

        <div className="mt-4 hidden overflow-x-auto md:block">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="text-texto-suave">
                <th className="px-3 py-3 font-medium">Perfil</th>
                <th className="px-3 py-3 font-medium">Nombre</th>
                <th className="px-3 py-3 font-medium">DNI</th>
                <th className="px-3 py-3 font-medium">Cargo</th>
                <th className="px-3 py-3 font-medium">Teléfono</th>
                <th className="px-3 py-3 font-medium">Estado</th>
                <th className="px-3 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-3 py-12 text-center text-texto-suave">
                    Cargando…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-12 text-center text-texto-suave">
                    No hay empleados
                  </td>
                </tr>
              ) : (
                filtered.map((emp) => (
                  <tr key={emp.id} className="border-t border-borde">
                    <td className="px-3 py-3">
                      <span className={ui.avatar}>
                        {initials(emp)}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-medium text-noche">{fullName(emp)}</td>
                    <td className="px-3 py-3 text-texto-suave">{emp.dni}</td>
                    <td className="px-3 py-3 text-texto-suave">{emp.cargo || "—"}</td>
                    <td className="px-3 py-3 text-texto-suave">{emp.telefono || "—"}</td>
                    <td className="px-3 py-3">
                      <span className={emp.estado ? ui.badgeOn : ui.badgeOff}>
                        {emp.estado ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(emp)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-[12px] text-texto-suave transition hover:bg-[var(--hover)] hover:text-noche"
                          aria-label={`Editar ${fullName(emp)}`}
                        >
                          <IconEdit />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(emp)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-[12px] text-texto-suave transition hover:bg-[color-mix(in_srgb,#b91c1c_18%,var(--blanco))] hover:text-[#f87171]"
                          aria-label={`Eliminar ${fullName(emp)}`}
                        >
                          <IconTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 space-y-3 md:hidden">
          {loading ? (
            <p className="py-8 text-center text-sm text-texto-suave">Cargando…</p>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-texto-suave">No hay empleados</p>
          ) : (
            filtered.map((emp) => (
              <article key={emp.id} className="rounded-[16px] border border-[#f1f5f9] bg-[var(--muted)] p-4">
                <div className="flex items-center gap-3">
                  <span className={ui.avatar}>
                    {initials(emp)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-noche">{fullName(emp)}</p>
                    <p className="truncate text-xs text-texto-suave">
                      {emp.cargo || "Sin cargo"} · DNI {emp.dni}
                    </p>
                  </div>
                  <span
                    className={emp.estado  ? ui.badgeOn : ui.badgeOff}
                  >
                    {emp.estado ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(emp)}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[14px] border border-borde bg-blanco py-2.5 text-sm font-medium text-noche"
                  >
                    <IconEdit className="h-3.5 w-3.5" /> Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(emp)}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[14px] border border-[#fecaca]/60 bg-blanco py-2.5 text-sm font-medium text-[#f87171]"
                  >
                    <IconTrash className="h-3.5 w-3.5" /> Eliminar
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
            aria-label="Cerrar"
            onClick={closeModal}
          />
          <form
            onSubmit={handleSubmit}
            className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-[18px] bg-blanco shadow-[0_24px_80px_rgba(15,23,42,0.25)]"
          >
            <div className="overflow-y-auto px-5 py-6 md:px-7">
              <h3 className="text-xl font-bold text-noche">
                {editing ? "Editar empleado" : "Registrar empleado"}
              </h3>
              <p className="mt-1 text-sm text-texto-suave">Completa los datos del empleado.</p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={label}>Nombres</span>
                  <input
                    className={field}
                    value={form.nombres}
                    onChange={(e) => setForm({ ...form, nombres: e.target.value })}
                    required
                  />
                </label>
                <label className="block">
                  <span className={label}>Apellidos</span>
                  <input
                    className={field}
                    value={form.apellidos}
                    onChange={(e) => setForm({ ...form, apellidos: e.target.value })}
                    required
                  />
                </label>
                <label className="block">
                  <span className={label}>DNI</span>
                  <input
                    className={field}
                    value={form.dni}
                    onChange={(e) => setForm({ ...form, dni: e.target.value.replace(/\D/g, "") })}
                    required
                    minLength={8}
                    maxLength={15}
                    inputMode="numeric"
                  />
                </label>
                <label className="block">
                  <span className={label}>Cargo</span>
                  <input
                    className={field}
                    value={form.cargo}
                    onChange={(e) => setForm({ ...form, cargo: e.target.value })}
                  />
                </label>
                <label className="block">
                  <span className={label}>Teléfono</span>
                  <input
                    className={field}
                    value={form.telefono}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  />
                </label>
                <label className="block">
                  <span className={label}>Email</span>
                  <input
                    type="email"
                    className={field}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </label>
                <div className="block sm:col-span-2">
                  <span className={label}>Estado</span>
                  <Select
                    aria-label="Estado"
                    value={String(form.estado)}
                    options={estadoOptions}
                    onChange={(v) => setForm({ ...form, estado: Number(v) })}
                  />
                </div>
              </div>
            </div>

            <footer className="flex items-center justify-end gap-3 border-t border-borde bg-[var(--muted)] px-5 py-4">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-borde bg-blanco text-texto-suave transition hover:bg-[var(--hover)]"
                aria-label="Cancelar"
              >
                <IconClose />
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-[#16a34a] px-6 text-sm font-semibold text-white transition hover:bg-[#15803d] disabled:opacity-60"
              >
                <IconCheck />
                {saving ? "Guardando…" : editing ? "Guardar" : "Registrar"}
              </button>
            </footer>
          </form>
        </div>
      ) : null}
    </section>
  );
}
