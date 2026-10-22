"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/ToastProvider";
import { meRequest } from "@/lib/auth";
import { Empleado, Rol, Usuario } from "@/lib/types";
import { ui } from "@/lib/ui";

type FormState = {
  username: string;
  nombres: string;
  apellidos: string;
  dni: string;
  telefono: string;
  email: string;
  rol: string;
  estado: number;
  idEmpleado: string;
};

const emptyForm: FormState = {
  username: "",
  nombres: "",
  apellidos: "",
  dni: "",
  telefono: "",
  email: "",
  rol: "ADMIN",
  estado: 1,
  idEmpleado: "",
};

function fullName(u: Usuario) {
  const name = [u.nombres, u.apellidos].filter(Boolean).join(" ").trim();
  return name || u.username;
}

function initials(u: Usuario) {
  const a = (u.nombres || u.username || "?").charAt(0);
  const b = (u.apellidos || "").charAt(0);
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

function IconUser({ className = "h-16 w-16" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.4">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 19c1.6-3.2 4-4.8 7-4.8s5.4 1.6 7 4.8" strokeLinecap="round" />
    </svg>
  );
}

export function UsuariosModule() {
  const { success, error: toastError } = useToast();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Usuario | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [session, uRes, rRes, eRes] = await Promise.all([
        meRequest(),
        fetch("/api/usuarios", { cache: "no-store", credentials: "include" }),
        fetch("/api/roles", { cache: "no-store", credentials: "include" }),
        fetch("/api/empleados", { cache: "no-store", credentials: "include" }),
      ]);
      const uData = await uRes.json();
      const rData = await rRes.json();
      const eData = await eRes.json();
      if (!uRes.ok) throw new Error(uData.error || "Error al cargar usuarios");
      if (!rRes.ok) throw new Error(rData.error || "Error al cargar roles");
      if (!eRes.ok) throw new Error(eData.error || "Error al cargar empleados");
      setIsAdmin((session?.rol || "").toUpperCase() === "ADMIN");
      setUsuarios(uData.usuarios);
      setEmpleados((eData.empleados as Empleado[]) || []);
      const activeRoles = (rData.roles as Rol[]).filter((r) => r.estado === 1);
      setRoles(activeRoles);
      if (activeRoles.length) {
        setForm((f) => ({ ...f, rol: f.rol || activeRoles[0].nombre }));
      }
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
    if (!q) return usuarios;
    return usuarios.filter((u) => {
      const hay = [u.username, u.nombres, u.apellidos, u.dni, u.email, u.telefono, u.rol]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [usuarios, query]);

  const linkedEmpleadoIds = useMemo(() => {
    const set = new Set<number>();
    usuarios.forEach((u) => {
      if (u.idEmpleado) set.add(u.idEmpleado);
    });
    return set;
  }, [usuarios]);

  const empleadoOptions = useMemo(() => {
    const disponibles = empleados.filter((e) => {
      if (e.estado !== 1) return false;
      if (!linkedEmpleadoIds.has(e.id)) return true;
      // Al editar, incluir el ya ligado
      return editing?.idEmpleado === e.id;
    });
    return [
      { value: "", label: "Sin vincular" },
      ...disponibles.map((e) => ({
        value: String(e.id),
        label: `${[e.nombres, e.apellidos].filter(Boolean).join(" ")} · ${e.dni}`,
      })),
    ];
  }, [empleados, linkedEmpleadoIds, editing]);

  function applyEmpleado(idStr: string) {
    if (!idStr) {
      setForm((f) => ({ ...f, idEmpleado: "" }));
      return;
    }
    const emp = empleados.find((e) => String(e.id) === idStr);
    if (!emp) {
      setForm((f) => ({ ...f, idEmpleado: idStr }));
      return;
    }
    setForm((f) => ({
      ...f,
      idEmpleado: idStr,
      nombres: emp.nombres || f.nombres,
      apellidos: emp.apellidos || f.apellidos,
      dni: emp.dni || f.dni,
      telefono: emp.telefono || f.telefono,
      email: emp.email || f.email,
    }));
  }

  function openCreate() {
    setEditing(null);
    setForm({
      ...emptyForm,
      rol: roles[0]?.nombre || "ADMIN",
      idEmpleado: "",
    });
    setOpen(true);
  }

  function openEdit(user: Usuario) {
    setEditing(user);
    setForm({
      username: user.username,
      nombres: user.nombres || "",
      apellidos: user.apellidos || "",
      dni: user.dni || "",
      telefono: user.telefono || "",
      email: user.email || "",
      rol: user.rol,
      estado: user.estado,
      idEmpleado: user.idEmpleado ? String(user.idEmpleado) : "",
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
      const alreadyLinked = Boolean(editing?.idEmpleado);
      const body: Record<string, unknown> = {
        username: form.username.trim(),
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        dni: form.dni.trim(),
        telefono: form.telefono.trim() || null,
        email: form.email.trim() || null,
        rol: form.rol,
        estado: form.estado === 1,
      };
      if (isAdmin && !alreadyLinked) {
        body.idEmpleado = form.idEmpleado ? Number(form.idEmpleado) : null;
      } else if (alreadyLinked) {
        body.idEmpleado = editing!.idEmpleado;
      }

      const dni = String(body.dni);
      if (!/^\d{8,15}$/.test(dni)) {
        throw new Error("El DNI debe tener entre 8 y 15 dígitos");
      }

      const res = await fetch(editing ? `/api/usuarios/${editing.id}` : "/api/usuarios", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo guardar");

      success(
        editing
          ? "Usuario actualizado"
          : `Usuario registrado. Contraseña temporal: DNI ${dni}`,
      );
      setOpen(false);
      setEditing(null);
      await load();
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(user: Usuario) {
    if (!confirm(`¿Eliminar usuario "${fullName(user)}"?`)) return;
    try {
      const res = await fetch(`/api/usuarios/${user.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo eliminar");
      success("Usuario eliminado");
      await load();
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Error");
    }
  }

  const field = ui.fieldLg;
  const label = ui.label;
  const rolOptions = roles.map((r) => ({ value: r.nombre, label: r.nombre }));
  const estadoOptions = [
    { value: "1", label: "Activo" },
    { value: "0", label: "Inactivo" },
  ];

  return (
    <section className="mx-auto max-w-6xl">
      <div className={ui.cardPad}>
        <header className="flex flex-col gap-4 border-b border-borde pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-noche">Usuarios</h2>
            <p className="mt-1 text-sm text-texto-suave">
              Total: {usuarios.length}
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
                <th className="px-3 py-3 font-medium">Usuario</th>
                <th className="px-3 py-3 font-medium">Empleado</th>
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
                    No hay usuarios
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="border-t border-borde">
                    <td className="px-3 py-3">
                      <span className={ui.avatar}>
                        {initials(u)}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-medium text-noche">{fullName(u)}</td>
                    <td className="px-3 py-3 text-texto-suave">{u.username}</td>
                    <td className="px-3 py-3 text-texto-suave">
                      {u.empleadoNombre || (u.idEmpleado ? `#${u.idEmpleado}` : "—")}
                    </td>
                    <td className="px-3 py-3 text-texto-suave">{u.telefono || "—"}</td>
                    <td className="px-3 py-3">
                      <span className={u.estado ? ui.badgeOn : ui.badgeOff}>
                        {u.estado ? "Activo" : "Inactivo"}
                      </span>
                      {u.mustChangePassword ? (
                        <span className={`ml-2 ${ui.badgeWarn}`}>Temporal</span>
                      ) : null}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(u)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-[12px] text-texto-suave transition hover:bg-[var(--hover)] hover:text-noche"
                          aria-label={`Editar ${fullName(u)}`}
                        >
                          <IconEdit />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(u)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-[12px] text-texto-suave transition hover:bg-[color-mix(in_srgb,#b91c1c_18%,var(--blanco))] hover:text-[#f87171]"
                          aria-label={`Eliminar ${fullName(u)}`}
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
          ) : (
            filtered.map((u) => (
              <article key={u.id} className="rounded-[16px] border border-[#f1f5f9] bg-[var(--muted)] p-4">
                <div className="flex items-center gap-3">
                  <span className={ui.avatar}>
                    {initials(u)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-noche">{fullName(u)}</p>
                    <p className="truncate text-xs text-texto-suave">{u.email || u.username}</p>
                  </div>
                  <span
                    className={u.estado  ? ui.badgeOn : ui.badgeOff}
                  >
                    {u.estado ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(u)}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[14px] border border-borde bg-blanco py-2.5 text-sm font-medium text-noche"
                  >
                    <IconEdit className="h-3.5 w-3.5" /> Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(u)}
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
            className="relative z-10 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-[18px] bg-blanco shadow-[0_24px_80px_rgba(15,23,42,0.25)]"
          >
            <div className="grid flex-1 overflow-y-auto md:grid-cols-[220px_1fr]">
              <aside className="flex flex-col items-center gap-3 border-b border-borde bg-[var(--muted)] px-5 py-8 md:border-b-0 md:border-r">
                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-[var(--hover)] text-texto-suave">
                  {editing ? (
                    <span className="text-2xl font-bold text-ventryx">{initials(editing)}</span>
                  ) : (
                    <IconUser />
                  )}
                </div>
                <p className="text-center text-sm font-semibold text-noche">
                  {editing ? fullName(editing) : "Nuevo perfil"}
                </p>
                <p className="text-center text-xs text-texto-suave">
                  {editing
                    ? `Rol ${editing.rol}`
                    : "La contraseña temporal será el DNI"}
                </p>
              </aside>

              <div className="px-5 py-6 md:px-7">
                <h3 className="text-xl font-bold text-noche">
                  {editing ? "Editar usuario" : "Registrar usuario"}
                </h3>
                <p className="mt-1 text-sm text-texto-suave">
                  Completa los datos de perfil. No se pide contraseña al crear.
                </p>

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
                    <span className={label}>Usuario (login)</span>
                    <input
                      className={field}
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                      required
                      autoComplete="off"
                    />
                  </label>
                  <label className="block">
                    <span className={label}>DNI (contraseña temporal)</span>
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
                  <div className="block">
                    <span className={label}>Rol</span>
                    <Select
                      aria-label="Rol"
                      value={form.rol}
                      options={rolOptions}
                      onChange={(rol) => setForm({ ...form, rol })}
                    />
                  </div>
                  <div className="block">
                    <span className={label}>Estado</span>
                    <Select
                      aria-label="Estado"
                      value={String(form.estado)}
                      options={estadoOptions}
                      onChange={(v) => setForm({ ...form, estado: Number(v) })}
                    />
                  </div>

                  {(() => {
                    const linkedName =
                      editing?.empleadoNombre ||
                      (() => {
                        const emp = empleados.find((e) => e.id === editing?.idEmpleado);
                        return emp
                          ? [emp.nombres, emp.apellidos].filter(Boolean).join(" ")
                          : editing?.idEmpleado
                            ? `Empleado #${editing.idEmpleado}`
                            : "";
                      })();
                    const locked = Boolean(editing?.idEmpleado);

                    if (isAdmin) {
                      return (
                        <div className="block sm:col-span-2">
                          <span className={label}>Empleado</span>
                          {locked ? (
                            <div className="rounded-[18px] border border-borde bg-[var(--muted)] px-4 py-3 text-sm text-noche">
                              <p className="font-semibold uppercase tracking-wide">{linkedName}</p>
                              <p className="mt-1 text-xs text-texto-suave">
                                Registrado a este usuario · no se puede cambiar
                              </p>
                            </div>
                          ) : (
                            <>
                              <Select
                                aria-label="Empleado"
                                value={form.idEmpleado}
                                options={empleadoOptions}
                                placeholder="Seleccionar empleado"
                                onChange={applyEmpleado}
                              />
                              <p className="mt-1 text-[11px] text-texto-suave">
                                Solo admin. Al ligar, queda fijo en el usuario.
                              </p>
                            </>
                          )}
                        </div>
                      );
                    }

                    if (locked) {
                      return (
                        <div className="block sm:col-span-2">
                          <span className={label}>Empleado</span>
                          <p className="rounded-[18px] border border-borde bg-[var(--muted)] px-4 py-3 text-sm font-semibold uppercase text-noche">
                            {linkedName}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })()}
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
