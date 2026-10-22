"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/ToastProvider";
import { PermisoModulo, Rol } from "@/lib/types";
import { ui } from "@/lib/ui";

const emptyForm = {
  nombre: "",
  descripcion: "",
  estado: 1,
  permisos: [] as string[],
};

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

function IconCheck({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.4">
      <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function RolesModule() {
  const { success, error: toastError } = useToast();
  const [roles, setRoles] = useState<Rol[]>([]);
  const [modulos, setModulos] = useState<PermisoModulo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Rol | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [rRes, pRes] = await Promise.all([
        fetch("/api/roles", { cache: "no-store", credentials: "include" }),
        fetch("/api/permisos", { cache: "no-store", credentials: "include" }),
      ]);
      const rData = await rRes.json();
      const pData = await pRes.json();
      if (!rRes.ok) throw new Error(rData.error || "Error al cargar roles");
      if (!pRes.ok) throw new Error(pData.error || "Error al cargar permisos");
      setRoles((rData.roles as Rol[]).map((r) => ({ ...r, permisos: r.permisos || [] })));
      setModulos((pData.modulos || []) as PermisoModulo[]);
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

  const totalPermisos = useMemo(
    () => modulos.reduce((acc, m) => acc + m.permisos.length, 0),
    [modulos],
  );

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(rol: Rol) {
    setEditing(rol);
    setForm({
      nombre: rol.nombre,
      descripcion: rol.descripcion || "",
      estado: rol.estado,
      permisos: [...(rol.permisos || [])],
    });
    setOpen(true);
  }

  function togglePermiso(codigo: string) {
    setForm((f) => ({
      ...f,
      permisos: f.permisos.includes(codigo)
        ? f.permisos.filter((c) => c !== codigo)
        : [...f.permisos, codigo],
    }));
  }

  function toggleModuloAll(mod: PermisoModulo) {
    const codes = mod.permisos.map((p) => p.codigo);
    const allOn = codes.every((c) => form.permisos.includes(c));
    setForm((f) => ({
      ...f,
      permisos: allOn
        ? f.permisos.filter((c) => !codes.includes(c))
        : Array.from(new Set([...f.permisos, ...codes])),
    }));
  }

  function selectAllPermisos() {
    const all = modulos.flatMap((m) => m.permisos.map((p) => p.codigo));
    setForm((f) => ({ ...f, permisos: all }));
  }

  function clearPermisos() {
    setForm((f) => ({ ...f, permisos: [] }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        nombre: form.nombre.trim().toUpperCase(),
        descripcion: form.descripcion.trim(),
        estado: form.estado === 1,
        permisos: form.permisos,
      };
      const res = await fetch(editing ? `/api/roles/${editing.id}` : "/api/roles", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo guardar");
      success(editing ? "Rol actualizado" : "Rol creado");
      setOpen(false);
      await load();
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(rol: Rol) {
    if (!confirm(`¿Eliminar rol "${rol.nombre}"?`)) return;
    try {
      const res = await fetch(`/api/roles/${rol.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo eliminar");
      success("Rol eliminado");
      await load();
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Error");
    }
  }

  return (
    <section className="mx-auto max-w-6xl space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className={ui.pageTitle}>Roles y permisos</h2>
          <p className={ui.pageSub}>
            Crea roles y asigna permisos desde el modal. {totalPermisos} permisos en el catálogo.
          </p>
        </div>
        <button type="button" onClick={openCreate} className={ui.btnPrimary}>
          <IconPlus />
          Nuevo rol
        </button>
      </header>

      <div className={`overflow-hidden ${ui.card}`}>
        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-borde bg-[var(--muted)] text-texto-suave">
              <tr>
                <th className="px-5 py-3 font-semibold">ID</th>
                <th className="px-5 py-3 font-semibold">Nombre</th>
                <th className="px-5 py-3 font-semibold">Descripción</th>
                <th className="px-5 py-3 font-semibold">Permisos</th>
                <th className="px-5 py-3 font-semibold">Estado</th>
                <th className="px-5 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-texto-suave">
                    Cargando…
                  </td>
                </tr>
              ) : (
                roles.map((r) => (
                  <tr key={r.id} className="border-t border-borde">
                    <td className="px-5 py-3 text-texto-suave">{r.id}</td>
                    <td className="px-5 py-3 font-semibold uppercase text-noche">{r.nombre}</td>
                    <td className="px-5 py-3 text-texto-suave">{r.descripcion || "—"}</td>
                    <td className="px-5 py-3 text-texto-suave">
                      {r.permisos?.length || 0}/{totalPermisos}
                    </td>
                    <td className="px-5 py-3">
                      <span className={r.estado ? ui.badgeOn : ui.badgeOff}>
                        {r.estado ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(r)}
                          className={ui.btnGhost}
                          aria-label={`Editar ${r.nombre}`}
                        >
                          <IconEdit />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(r)}
                          className={ui.btnDanger}
                          aria-label={`Eliminar ${r.nombre}`}
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

        <div className="space-y-3 p-3 md:hidden">
          {roles.map((r) => (
            <article key={r.id} className="rounded-[16px] border border-borde bg-[var(--muted)] p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold uppercase text-noche">{r.nombre}</p>
                <span className={r.estado ? ui.badgeOn : ui.badgeOff}>
                  {r.estado ? "Activo" : "Inactivo"}
                </span>
              </div>
              <p className="mt-1 text-sm text-texto-suave">{r.descripcion || "Sin descripción"}</p>
              <p className="mt-1 text-xs text-texto-suave">{r.permisos?.length || 0} permisos</p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(r)}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[14px] border border-borde bg-blanco py-2.5 text-sm font-medium text-noche"
                >
                  <IconEdit className="h-3.5 w-3.5" /> Editar
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(r)}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[14px] border border-[#fecaca] bg-blanco py-2.5 text-sm font-medium text-[#f87171]"
                >
                  <IconTrash className="h-3.5 w-3.5" /> Eliminar
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-[100] flex items-stretch justify-center p-0 sm:p-3">
          <button
            type="button"
            className={ui.overlay}
            aria-label="Cerrar"
            onClick={() => !saving && setOpen(false)}
          />
          <form
            onSubmit={handleSubmit}
            className="relative z-10 flex h-[100dvh] w-full max-w-[1400px] flex-col overflow-hidden rounded-none border border-borde bg-blanco shadow-[var(--sombra-menu)] sm:h-[96vh] sm:rounded-[18px]"
          >
            <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-borde px-5 py-4 md:px-8">
              <div>
                <h3 className="text-xl font-bold text-noche">
                  {editing ? "Editar rol y permisos" : "Nuevo rol y permisos"}
                </h3>
                <p className="mt-1 text-sm text-texto-suave">
                  {form.permisos.length} de {totalPermisos} permisos · {modulos.length} módulos
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={selectAllPermisos}
                  className="rounded-[12px] border border-borde bg-blanco px-3 py-2 text-xs font-semibold text-noche hover:bg-[var(--hover)]"
                >
                  Marcar todos
                </button>
                <button
                  type="button"
                  onClick={clearPermisos}
                  className="rounded-[12px] border border-borde bg-blanco px-3 py-2 text-xs font-semibold text-texto-suave hover:bg-[var(--hover)]"
                >
                  Limpiar
                </button>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto bg-fondo">
              <div className="sticky top-0 z-10 grid gap-3 border-b border-borde bg-blanco px-5 py-4 md:grid-cols-12 md:px-8">
                <label className="block md:col-span-3">
                  <span className={ui.label}>Nombre</span>
                  <input
                    className={`${ui.field} uppercase`}
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    required
                    placeholder="SUPERVISOR"
                  />
                </label>
                <div className="block md:col-span-3">
                  <span className={ui.label}>Estado</span>
                  <Select
                    aria-label="Estado"
                    value={String(form.estado)}
                    options={[
                      { value: "1", label: "Activo" },
                      { value: "0", label: "Inactivo" },
                    ]}
                    onChange={(v) => setForm({ ...form, estado: Number(v) })}
                  />
                </div>
                <label className="block md:col-span-6">
                  <span className={ui.label}>Descripción</span>
                  <input
                    className={ui.field}
                    value={form.descripcion}
                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                    placeholder="Qué puede hacer este rol"
                  />
                </label>
              </div>

              <div className="space-y-5 px-5 py-5 md:px-8">
                {modulos.length === 0 ? (
                  <p className="rounded-[16px] border border-borde bg-blanco py-12 text-center text-sm text-texto-suave">
                    No hay permisos en el catálogo. Reinicia el API Spring para sincronizarlos.
                  </p>
                ) : (
                  modulos.map((mod) => {
                    const count = mod.permisos.filter((p) =>
                      form.permisos.includes(p.codigo),
                    ).length;
                    const allOn =
                      mod.permisos.length > 0 &&
                      mod.permisos.every((p) => form.permisos.includes(p.codigo));
                    return (
                      <section
                        key={mod.modulo}
                        className="rounded-[16px] border border-borde bg-blanco p-4 shadow-sm md:p-5"
                      >
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-bold text-noche">{mod.modulo}</h4>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                                count > 0 ? ui.badgeOn : "bg-[var(--muted)] text-texto-suave"
                              }`}
                            >
                              {count}/{mod.permisos.length}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleModuloAll(mod)}
                            className="text-xs font-semibold text-ventryx hover:underline"
                          >
                            {allOn ? "Quitar módulo" : "Marcar módulo"}
                          </button>
                        </div>
                        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                          {mod.permisos.map((p) => {
                            const on = form.permisos.includes(p.codigo);
                            return (
                              <button
                                key={p.codigo}
                                type="button"
                                onClick={() => togglePermiso(p.codigo)}
                                className={`flex items-start gap-3 rounded-[14px] border px-3.5 py-3 text-left transition ${
                                  on
                                    ? "border-[#4ade80]/50 bg-[color-mix(in_srgb,#16a34a_16%,var(--blanco))]"
                                    : "border-borde bg-[var(--muted)] hover:border-lavanda hover:bg-[var(--hover)]"
                                }`}
                              >
                                <span
                                  className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border ${
                                    on
                                      ? "border-[#15803d] bg-[#16a34a] text-white"
                                      : "border-borde bg-blanco text-transparent"
                                  }`}
                                >
                                  <IconCheck />
                                </span>
                                <span className="min-w-0">
                                  <span className="block text-sm font-medium text-noche">
                                    {p.nombre}
                                  </span>
                                  <span className="mt-0.5 block text-xs text-texto-suave/90">
                                    {p.descripcion || p.codigo}
                                  </span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </section>
                    );
                  })
                )}
              </div>
            </div>

            <footer className={ui.modalFooter}>
              <button
                type="button"
                disabled={saving}
                onClick={() => setOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-borde bg-blanco text-texto-suave"
                aria-label="Cancelar"
              >
                <IconClose />
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-[#16a34a] px-7 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? "Guardando…" : editing ? "Guardar cambios" : "Crear rol"}
              </button>
            </footer>
          </form>
        </div>
      ) : null}
    </section>
  );
}
