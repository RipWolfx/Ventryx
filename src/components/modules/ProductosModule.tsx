"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { BarcodePreview } from "@/components/ui/BarcodePreview";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/ToastProvider";
import { generarCodigoBarras, imprimirEtiqueta } from "@/lib/barcode";
import { Categoria, Producto } from "@/lib/types";
import { ui } from "@/lib/ui";

type FormState = {
  nombre: string;
  descripcion: string;
  precio: string;
  stock: string;
  codigoBarras: string;
  idCategoria: string;
  estado: number;
};

const emptyForm: FormState = {
  nombre: "",
  descripcion: "",
  precio: "",
  stock: "0",
  codigoBarras: "",
  idCategoria: "",
  estado: 1,
};

function formatMoney(n: number) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(Number(n) || 0);
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

export function ProductosModule() {
  const { success, error: toastError } = useToast();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Producto | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        fetch("/api/productos", { cache: "no-store", credentials: "include" }),
        fetch("/api/categorias", { cache: "no-store", credentials: "include" }),
      ]);
      const pData = await pRes.json();
      const cData = await cRes.json();
      if (!pRes.ok) throw new Error(pData.error || "Error al cargar productos");
      if (!cRes.ok) throw new Error(cData.error || "Error al cargar categorías");
      setProductos(pData.productos || []);
      setCategorias(cData.categorias || []);
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
    if (!q) return productos;
    return productos.filter((p) => {
      const hay = [
        p.nombre,
        p.descripcion,
        p.categoriaNombre,
        p.codigoBarras,
        String(p.precio),
        String(p.stock),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [productos, query]);

  function openCreate() {
    setEditing(null);
    setForm({
      ...emptyForm,
      codigoBarras: generarCodigoBarras(),
      idCategoria: categorias[0] ? String(categorias[0].id) : "",
    });
    setOpen(true);
  }

  function openEdit(p: Producto) {
    setEditing(p);
    setForm({
      nombre: p.nombre || "",
      descripcion: p.descripcion || "",
      precio: String(p.precio ?? ""),
      stock: String(p.stock ?? 0),
      codigoBarras: p.codigoBarras || "",
      idCategoria: String(p.idCategoria ?? ""),
      estado: p.estado,
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
      if (!form.idCategoria) throw new Error("Selecciona una categoría");
      const precio = Number(form.precio);
      const stock = Number(form.stock);
      if (Number.isNaN(precio) || precio < 0) throw new Error("Precio inválido");
      if (!Number.isInteger(stock) || stock < 0) throw new Error("Stock inválido");

      const body = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        precio,
        stock,
        codigoBarras: form.codigoBarras.trim() || null,
        idCategoria: Number(form.idCategoria),
        estado: form.estado === 1,
      };

      const res = await fetch(editing ? `/api/productos/${editing.id}` : "/api/productos", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo guardar");

      success(editing ? "Producto actualizado" : "Producto creado");
      setOpen(false);
      setEditing(null);
      await load();
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(p: Producto) {
    if (!confirm(`¿Eliminar producto "${p.nombre}"?`)) return;
    try {
      const res = await fetch(`/api/productos/${p.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo eliminar");
      success("Producto eliminado");
      await load();
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Error");
    }
  }

  const field = ui.fieldLg;
  const label = ui.label;
  const categoriaOptions = categorias.map((c) => ({ value: String(c.id), label: c.nombre }));
  const estadoOptions = [
    { value: "1", label: "Activo" },
    { value: "0", label: "Inactivo" },
  ];

  return (
    <section className="mx-auto max-w-6xl">
      <div className={ui.cardPad}>
        <header className="flex flex-col gap-4 border-b border-borde pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-noche">Productos</h2>
            <p className="mt-1 text-sm text-texto-suave">
              Total: {productos.length}
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
                <th className="px-3 py-3 font-medium">Nombre</th>
                <th className="px-3 py-3 font-medium">Código</th>
                <th className="px-3 py-3 font-medium">Categoría</th>
                <th className="px-3 py-3 font-medium">Precio</th>
                <th className="px-3 py-3 font-medium">Stock</th>
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
                    No hay productos
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="border-t border-borde">
                    <td className="px-3 py-3">
                      <p className="font-medium text-noche">{p.nombre}</p>
                      {p.descripcion ? (
                        <p className="mt-0.5 text-xs text-texto-suave line-clamp-1">{p.descripcion}</p>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-texto-suave">
                      {p.codigoBarras || "—"}
                    </td>
                    <td className="px-3 py-3 text-texto-suave">{p.categoriaNombre || "—"}</td>
                    <td className="px-3 py-3 font-medium text-noche">{formatMoney(p.precio)}</td>
                    <td className="px-3 py-3">
                      <span className={p.stock > 0 ? ui.badgeOn : ui.badgeOff}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={p.estado ? ui.badgeOn : ui.badgeOff}>
                        {p.estado ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-1">
                        {p.codigoBarras ? (
                          <button
                            type="button"
                            onClick={() =>
                              imprimirEtiqueta({
                                codigo: p.codigoBarras!,
                                nombre: p.nombre,
                                precio: p.precio,
                              })
                            }
                            className="rounded-[12px] px-2 text-xs font-semibold text-ventryx hover:bg-[var(--hover)]"
                            title="Imprimir etiqueta"
                          >
                            Etiqueta
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => openEdit(p)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-[12px] text-texto-suave transition hover:bg-[var(--hover)] hover:text-noche"
                          aria-label={`Editar ${p.nombre}`}
                        >
                          <IconEdit />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-[12px] text-texto-suave transition hover:bg-[color-mix(in_srgb,#b91c1c_18%,var(--blanco))] hover:text-[#f87171]"
                          aria-label={`Eliminar ${p.nombre}`}
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
            <p className="py-8 text-center text-sm text-texto-suave">No hay productos</p>
          ) : (
            filtered.map((p) => (
              <article key={p.id} className="rounded-[16px] border border-[#f1f5f9] bg-[var(--muted)] p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-noche">{p.nombre}</p>
                    <p className="mt-0.5 text-xs text-texto-suave">{p.categoriaNombre || "Sin categoría"}</p>
                  </div>
                  <span
                    className={p.estado  ? ui.badgeOn : ui.badgeOff}
                  >
                    {p.estado ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <div className="mt-2 flex gap-3 text-sm text-texto-suave">
                  <span>{formatMoney(p.precio)}</span>
                  <span>Stock: {p.stock}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(p)}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[14px] border border-borde bg-blanco py-2.5 text-sm font-medium text-noche"
                  >
                    <IconEdit className="h-3.5 w-3.5" /> Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(p)}
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
                {editing ? "Editar producto" : "Nuevo producto"}
              </h3>
              <p className="mt-1 text-sm text-texto-suave">
                Precio, stock, categoría y código de barras (CODE128) para tiquetera.
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className={label}>Nombre</span>
                  <input
                    className={field}
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    required
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className={label}>Descripción</span>
                  <input
                    className={field}
                    value={form.descripcion}
                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  />
                </label>
                <label className="block">
                  <span className={label}>Precio</span>
                  <input
                    className={field}
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.precio}
                    onChange={(e) => setForm({ ...form, precio: e.target.value })}
                    required
                  />
                </label>
                <label className="block">
                  <span className={label}>Stock</span>
                  <input
                    className={field}
                    type="number"
                    min="0"
                    step="1"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    required
                  />
                </label>
                <div className="block">
                  <span className={label}>Categoría</span>
                  <Select
                    aria-label="Categoría"
                    value={form.idCategoria}
                    options={categoriaOptions}
                    placeholder="Seleccionar categoría"
                    onChange={(v) => setForm({ ...form, idCategoria: v })}
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

                <div className="block sm:col-span-2">
                  <span className={label}>Código de barras</span>
                  <div className="flex flex-wrap gap-2">
                    <input
                      className={`${field} min-w-0 flex-1 font-mono`}
                      value={form.codigoBarras}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          codigoBarras: e.target.value.replace(/[^a-zA-Z0-9\-]/g, ""),
                        })
                      }
                      placeholder="Se genera al crear o con el botón"
                      maxLength={64}
                    />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, codigoBarras: generarCodigoBarras() })}
                      className="rounded-[14px] border border-borde bg-blanco px-4 py-2.5 text-sm font-semibold text-ventryx hover:bg-[var(--hover)]"
                    >
                      Generar
                    </button>
                    <button
                      type="button"
                      disabled={!form.codigoBarras.trim() || !form.nombre.trim()}
                      onClick={() =>
                        imprimirEtiqueta({
                          codigo: form.codigoBarras.trim(),
                          nombre: form.nombre.trim(),
                          precio: form.precio,
                        })
                      }
                      className="rounded-[14px] border border-borde bg-blanco px-4 py-2.5 text-sm font-semibold text-noche hover:bg-[var(--muted)] disabled:opacity-40"
                    >
                      Imprimir
                    </button>
                  </div>
                  <div className="mt-3">
                    <BarcodePreview value={form.codigoBarras} />
                  </div>
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
                {saving ? "Guardando…" : editing ? "Guardar" : "Crear"}
              </button>
            </footer>
          </form>
        </div>
      ) : null}
    </section>
  );
}
