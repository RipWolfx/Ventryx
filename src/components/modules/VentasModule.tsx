"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNotifications } from "@/components/providers/NotificationsProvider";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/ToastProvider";
import { VoucherTicket } from "@/components/ventas/VoucherTicket";
import {
  Cliente,
  Empleado,
  MetodoPago,
  Producto,
  TipoComprobante,
  Venta,
} from "@/lib/types";
import { ui } from "@/lib/ui";

type CartLine = {
  idProducto: number;
  nombre: string;
  precio: number;
  cantidad: number;
  stock: number;
};

type TabId = "pos" | "historial";

const TIPO_OPTIONS = [
  { value: "NOTA_PEDIDO", label: "Nota de pedido" },
  { value: "BOLETA", label: "Boleta" },
  { value: "FACTURA", label: "Factura" },
];

const PAGO_OPTIONS = [
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "TARJETA", label: "Tarjeta" },
  { value: "YAPE", label: "Yape" },
  { value: "PLIN", label: "Plin" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
];

function formatMoney(n: number) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(Number(n) || 0);
}

function formatDate(iso: string) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("es-PE", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function empleadoLabel(e: Empleado) {
  return [e.nombres, e.apellidos].filter(Boolean).join(" ").trim() || e.dni;
}

function IconLink({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M10 13a5 5 0 0 0 7.07 0l2.12-2.12a5 5 0 0 0-7.07-7.07L11 5" strokeLinecap="round" />
      <path d="M14 11a5 5 0 0 0-7.07 0L4.8 13.12a5 5 0 1 0 7.07 7.07L13 19" strokeLinecap="round" />
    </svg>
  );
}

function IconSearch({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
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

function IconChevron({ open, className = "h-4 w-4" }: { open: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`${className} transition ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
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

export function VentasModule() {
  const { success, error: toastError, info } = useToast();
  const { push: pushNotif } = useNotifications();
  const [tab, setTab] = useState<TabId>("pos");
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [linking, setLinking] = useState(false);

  const [idEmpleado, setIdEmpleado] = useState("");
  const [tipoComprobante, setTipoComprobante] = useState<TipoComprobante>("NOTA_PEDIDO");
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("EFECTIVO");
  const [documento, setDocumento] = useState("");
  const [docNombre, setDocNombre] = useState("");
  const [consultando, setConsultando] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [search, setSearch] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [posToken, setPosToken] = useState<string | null>(null);
  const [voucher, setVoucher] = useState<Venta | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const barcodeRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [vRes, cRes, eRes, pRes] = await Promise.all([
        fetch("/api/ventas", { cache: "no-store", credentials: "include" }),
        fetch("/api/clientes", { cache: "no-store", credentials: "include" }),
        fetch("/api/empleados", { cache: "no-store", credentials: "include" }),
        fetch("/api/productos", { cache: "no-store", credentials: "include" }),
      ]);
      const [vData, cData, eData, pData] = await Promise.all([
        vRes.json(),
        cRes.json(),
        eRes.json(),
        pRes.json(),
      ]);
      if (!vRes.ok) throw new Error(vData.error || "Error al cargar ventas");
      if (!cRes.ok) throw new Error(cData.error || "Error al cargar clientes");
      if (!eRes.ok) throw new Error(eData.error || "Error al cargar empleados");
      if (!pRes.ok) throw new Error(pData.error || "Error al cargar productos");

      setVentas(vData.ventas || []);
      setClientes(cData.clientes || []);
      const activosEmp = ((eData.empleados as Empleado[]) || []).filter((e) => e.estado === 1);
      const activosProd = ((pData.productos as Producto[]) || []).filter((p) => p.estado === 1);
      setEmpleados(activosEmp);
      setProductos(activosProd);

      setIdEmpleado((prev) => {
        if (prev) return prev;
        return activosEmp[0] ? String(activosEmp[0].id) : "";
      });
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    load();
  }, [load]);

  const productoMap = useMemo(() => {
    const m = new Map<number, Producto>();
    productos.forEach((p) => m.set(p.id, p));
    return m;
  }, [productos]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return productos;
    return productos.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        (p.codigoBarras || "").toLowerCase().includes(q) ||
        String(p.id).includes(q),
    );
  }, [productos, search]);

  const total = useMemo(
    () => cart.reduce((acc, l) => acc + l.precio * l.cantidad, 0),
    [cart],
  );

  const addProducto = useCallback(
    (p: Producto, qty = 1) => {
      if (p.stock < 1) {
        toastError(`Sin stock: ${p.nombre}`);
        return;
      }
      setCart((list) => {
        const existing = list.find((l) => l.idProducto === p.id);
        if (existing) {
          const nextQty = existing.cantidad + qty;
          if (nextQty > p.stock) {
            toastError(`Stock insuficiente para "${p.nombre}" (disponible: ${p.stock})`);
            return list;
          }
          return list.map((l) =>
            l.idProducto === p.id ? { ...l, cantidad: nextQty, stock: p.stock } : l,
          );
        }
        if (qty > p.stock) {
          toastError(`Stock insuficiente para "${p.nombre}" (disponible: ${p.stock})`);
          return list;
        }
        return [
          ...list,
          {
            idProducto: p.id,
            nombre: p.nombre,
            precio: Number(p.precio),
            cantidad: qty,
            stock: p.stock,
          },
        ];
      });
    },
    [toastError],
  );

  const addByBarcode = useCallback(
    async (codigo: string) => {
      const code = codigo.trim();
      if (!code) return;
      try {
        const res = await fetch(`/api/productos/barcode/${encodeURIComponent(code)}`, {
          cache: "no-store",
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Producto no encontrado: ${code}`);
        const p = data.producto as Producto;
        if (!p) throw new Error(`Producto no encontrado: ${code}`);
        addProducto(p, 1);
        success(`Agregado: ${p.nombre}`);
      } catch (err) {
        toastError(err instanceof Error ? err.message : "Error");
      }
    },
    [addProducto, success, toastError],
  );

  useEffect(() => {
    if (!posToken) return;
    const id = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/pos/sesion/${encodeURIComponent(posToken)}/cola`, {
          cache: "no-store",
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        const codigos: string[] = data.codigos || [];
        for (const codigo of codigos) {
          await addByBarcode(codigo);
        }
      } catch {
        /* ignore poll errors */
      }
    }, 1500);
    return () => window.clearInterval(id);
  }, [posToken, addByBarcode]);

  function setQty(idProducto: number, cantidad: number) {
    setCart((list) =>
      list
        .map((l) => {
          if (l.idProducto !== idProducto) return l;
          const next = Math.max(0, Math.min(cantidad, l.stock));
          return { ...l, cantidad: next };
        })
        .filter((l) => l.cantidad > 0),
    );
  }

  function removeLine(idProducto: number) {
    setCart((list) => list.filter((l) => l.idProducto !== idProducto));
  }

  async function handleBarcodeSubmit(e: FormEvent) {
    e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;
    setBarcodeInput("");
    await addByBarcode(code);
    barcodeRef.current?.focus();
  }

  async function handleLinkScanner() {
    setLinking(true);
    try {
      const res = await fetch("/api/pos/sesion", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo crear la sesión POS");
      const token = data.token as string;
      if (!token) throw new Error("Token inválido");
      setPosToken(token);
      const url = `${window.location.origin}/pos/scan?t=${token}`;
      await navigator.clipboard.writeText(url);
      success("Enlace del escáner copiado al portapapeles");
      info("Abre el enlace en el celular para escanear");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Error");
    } finally {
      setLinking(false);
    }
  }

  async function ensureClienteGenerico(): Promise<number> {
    const existing = clientes.find((c) => c.dni === "00000000");
    if (existing) return existing.id;
    const res = await fetch("/api/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        nombres: "Público",
        apellidos: "General",
        dni: "00000000",
        telefono: null,
        direccion: null,
        email: null,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      const listRes = await fetch("/api/clientes", { credentials: "include", cache: "no-store" });
      const listData = await listRes.json();
      const found = (listData.clientes as Cliente[] | undefined)?.find((c) => c.dni === "00000000");
      if (found) {
        setClientes(listData.clientes || []);
        return found.id;
      }
      throw new Error(data.error || "No se pudo crear cliente genérico");
    }
    const nuevo = data.cliente as Cliente;
    setClientes((list) => [...list, nuevo]);
    return nuevo.id;
  }

  async function ensureClienteFromDocumento(): Promise<number> {
    if (tipoComprobante === "NOTA_PEDIDO") {
      return ensureClienteGenerico();
    }
    const digitos = documento.replace(/\D/g, "");
    if (tipoComprobante === "BOLETA" && digitos.length !== 8) {
      throw new Error("Ingresa un DNI de 8 dígitos y consúltalo");
    }
    if (tipoComprobante === "FACTURA" && digitos.length !== 11) {
      throw new Error("Ingresa un RUC de 11 dígitos y consúltalo");
    }
    if (!docNombre.trim()) {
      throw new Error("Consulta el documento con Decolecta antes de cobrar");
    }

    const existing = clientes.find((c) => c.dni === digitos);
    if (existing) return existing.id;

    const parts = docNombre.trim().split(/\s+/);
    const body =
      tipoComprobante === "FACTURA"
        ? {
            nombres: docNombre.trim(),
            apellidos: "",
            dni: digitos,
            telefono: null,
            direccion: null,
            email: null,
          }
        : {
            nombres: parts.slice(0, -2).join(" ") || parts[0] || docNombre,
            apellidos: parts.slice(-2).join(" ") || "",
            dni: digitos,
            telefono: null,
            direccion: null,
            email: null,
          };

    const res = await fetch("/api/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "No se pudo registrar el cliente");
    const nuevo = data.cliente as Cliente;
    setClientes((list) => [...list, nuevo]);
    return nuevo.id;
  }

  async function consultarDocumento() {
    setConsultando(true);
    try {
      const digitos = documento.replace(/\D/g, "");
      if (tipoComprobante === "BOLETA") {
        if (digitos.length !== 8) throw new Error("Ingresa un DNI de 8 dígitos");
        const res = await fetch(`/api/consultas/dni?n=${encodeURIComponent(digitos)}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "No se pudo consultar el DNI");
        const p = data.persona;
        setDocNombre(
          p.nombreCompleto ||
            `${p.nombres || ""} ${p.apellidoPaterno || ""} ${p.apellidoMaterno || ""}`.trim(),
        );
        setDocumento(digitos);
        success("DNI encontrado");
      } else if (tipoComprobante === "FACTURA") {
        if (digitos.length !== 11) throw new Error("Ingresa un RUC de 11 dígitos");
        const res = await fetch(`/api/consultas/ruc?n=${encodeURIComponent(digitos)}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "No se pudo consultar el RUC");
        const e = data.empresa;
        setDocNombre(e.razonSocial || "");
        setDocumento(digitos);
        success("RUC encontrado");
      }
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Error");
      setDocNombre("");
    } finally {
      setConsultando(false);
    }
  }

  async function handleCobrar() {
    setSaving(true);
    try {
      if (!idEmpleado) throw new Error("Selecciona un empleado");
      if (!cart.length) throw new Error("Agrega al menos un producto");

      const clienteId = await ensureClienteFromDocumento();

      for (const line of cart) {
        const p = productoMap.get(line.idProducto);
        if (!p) throw new Error(`Producto no válido: ${line.nombre}`);
        if (line.cantidad > p.stock) {
          throw new Error(`Stock insuficiente para "${p.nombre}" (disponible: ${p.stock})`);
        }
      }

      const res = await fetch("/api/ventas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          idCliente: clienteId,
          idEmpleado: Number(idEmpleado),
          tipoComprobante,
          metodoPago,
          items: cart.map((l) => ({
            idProducto: l.idProducto,
            cantidad: l.cantidad,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo registrar la venta");

      const venta = data.venta as Venta;
      setCart([]);
      setDocumento("");
      setDocNombre("");
      setVoucher(venta);
      success("Venta registrada");
      pushNotif({
        title: "Venta registrada",
        body: `${venta.tipoComprobante || "Venta"} ${
          venta.serie && venta.numeroComprobante
            ? `${venta.serie}-${venta.numeroComprobante}`
            : `#${venta.id}`
        } · ${formatMoney(Number(venta.total))}`,
        href: "/app/ventas",
      });
      await load();
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  const empleadoOptions = empleados.map((e) => ({
    value: String(e.id),
    label: empleadoLabel(e),
  }));

  const field = ui.field;
  const label = ui.label;

  return (
    <section className="mx-auto max-w-[1400px] space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <h2 className="text-xl font-bold text-noche">Punto de Venta</h2>
        </div>
        <div className="inline-flex rounded-lg border border-borde bg-blanco p-1">
          <button
            type="button"
            onClick={() => setTab("pos")}
            className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
              tab === "pos"
                ? "bg-[#714B67] text-white"
                : "text-texto-suave hover:bg-[var(--hover)]"
            }`}
          >
            Caja
          </button>
          <button
            type="button"
            onClick={() => setTab("historial")}
            className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
              tab === "historial"
                ? "bg-[#714B67] text-white"
                : "text-texto-suave hover:bg-[var(--hover)]"
            }`}
          >
            Ventas recientes
          </button>
        </div>
      </header>

      {tab === "pos" ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px] print:hidden">
          {/* Left: products */}
          <div className="flex min-h-[560px] flex-col rounded-xl border border-borde bg-blanco shadow-sm">
            <div className="space-y-3 border-b border-borde p-4">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-texto-suave">
                  <IconSearch />
                </span>
                <input
                  className={`${field} pl-9`}
                  placeholder="Buscar producto por nombre o código…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
                <input
                  ref={barcodeRef}
                  className={field}
                  placeholder="Código de barras (Enter)"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-lg bg-[#714B67] px-4 text-sm font-semibold text-white transition hover:bg-[#5c3d54]"
                >
                  Agregar
                </button>
              </form>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {loading ? (
                <p className="py-16 text-center text-sm text-texto-suave">Cargando productos…</p>
              ) : filteredProducts.length === 0 ? (
                <p className="py-16 text-center text-sm text-texto-suave">Sin productos</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
                  {filteredProducts.map((p) => {
                    const out = p.stock < 1;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        disabled={out}
                        onClick={() => addProducto(p, 1)}
                        className="flex flex-col rounded-lg border border-borde bg-[var(--muted)] p-3 text-left transition hover:border-lavanda hover:bg-blanco disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        <span className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-noche">
                          {p.nombre}
                        </span>
                        <span className="mt-2 text-base font-bold text-ventryx">
                          {formatMoney(p.precio)}
                        </span>
                        <span
                          className={`mt-1 text-xs ${
                            out ? "text-[#b91c1c]" : "text-texto-suave"
                          }`}
                        >
                          Stock: {p.stock}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right: cart */}
          <aside className="sticky top-[72px] flex max-h-[calc(100dvh-5.5rem)] flex-col rounded-xl border border-borde bg-blanco shadow-sm lg:max-h-[calc(100dvh-6.5rem)]">
            <div className="shrink-0 border-b border-borde px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-noche">
                  Pedido
                  {cart.length > 0 ? (
                    <span className="ml-1.5 font-medium text-texto-suave">({cart.length})</span>
                  ) : null}
                </h3>
                <button
                  type="button"
                  onClick={handleLinkScanner}
                  disabled={linking}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-borde bg-blanco px-2.5 py-1 text-xs font-semibold text-noche transition hover:bg-[var(--hover)] disabled:opacity-60"
                >
                  <IconLink className="h-3.5 w-3.5" />
                  {linking ? "…" : "Escáner"}
                </button>
              </div>
              {posToken ? (
                <p className="mt-1 truncate text-[10px] text-[#16a34a]">Escáner activo</p>
              ) : null}
            </div>

            <div className="shrink-0 space-y-2 border-b border-borde px-3 py-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className={label}>Comprobante</span>
                  <Select
                    aria-label="Tipo comprobante"
                    value={tipoComprobante}
                    options={TIPO_OPTIONS}
                    onChange={(v) => {
                      setTipoComprobante(v as TipoComprobante);
                      setDocumento("");
                      setDocNombre("");
                    }}
                  />
                </div>
                <div>
                  <span className={label}>Pago</span>
                  <Select
                    aria-label="Método de pago"
                    value={metodoPago}
                    options={PAGO_OPTIONS}
                    onChange={(v) => setMetodoPago(v as MetodoPago)}
                  />
                </div>
              </div>

              {tipoComprobante === "NOTA_PEDIDO" ? (
                <p className="text-[11px] leading-snug text-texto-suave">
                  Nota de pedido · sin DNI/RUC
                </p>
              ) : (
                <div className="space-y-1.5">
                  <span className={label}>
                    {tipoComprobante === "BOLETA" ? "DNI (Decolecta)" : "RUC (Decolecta)"}
                  </span>
                  <div className="flex gap-1.5">
                    <input
                      className="min-w-0 flex-1 rounded-lg border border-[#d8c8ef] bg-blanco px-2.5 py-2 font-mono text-sm outline-none focus:border-[#a78bfa] focus:ring-2 focus:ring-[#ede9fe]"
                      value={documento}
                      onChange={(e) => setDocumento(e.target.value.replace(/\D/g, ""))}
                      maxLength={tipoComprobante === "BOLETA" ? 8 : 11}
                      placeholder={tipoComprobante === "BOLETA" ? "8 dígitos" : "11 dígitos"}
                      inputMode="numeric"
                    />
                    <button
                      type="button"
                      disabled={consultando}
                      onClick={consultarDocumento}
                      className="rounded-lg bg-[#714B67] px-2.5 py-2 text-xs font-semibold text-white hover:bg-[#5c3d55] disabled:opacity-60"
                    >
                      {consultando ? "…" : "Buscar"}
                    </button>
                  </div>
                  {docNombre ? (
                    <p className="truncate rounded-md bg-[color-mix(in_srgb,#16a34a_18%,var(--blanco))] px-2 py-1 text-xs font-medium text-[#34d399]">
                      {docNombre}
                    </p>
                  ) : null}
                </div>
              )}

              <div>
                <span className={label}>Empleado</span>
                <Select
                  aria-label="Empleado"
                  value={idEmpleado}
                  options={empleadoOptions}
                  placeholder="Seleccionar empleado"
                  onChange={setIdEmpleado}
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-2 py-1.5">
              {cart.length === 0 ? (
                <p className="py-8 text-center text-sm text-texto-suave">
                  Selecciona productos o escanea
                </p>
              ) : (
                <ul className="divide-y divide-[#f3f4f6]">
                  {cart.map((line) => (
                    <li
                      key={line.idProducto}
                      className="flex items-center gap-1.5 py-1.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold leading-tight text-noche">
                          {line.nombre}
                        </p>
                        <p className="text-[10px] text-texto-suave">{formatMoney(line.precio)}</p>
                      </div>
                      <div className="inline-flex shrink-0 items-center rounded-md border border-borde bg-[var(--muted)]">
                        <button
                          type="button"
                          className="px-1.5 py-0.5 text-xs font-bold text-noche hover:bg-[var(--hover)]"
                          onClick={() => setQty(line.idProducto, line.cantidad - 1)}
                          aria-label="Menos"
                        >
                          −
                        </button>
                        <span className="min-w-[1.5rem] text-center text-xs font-semibold tabular-nums">
                          {line.cantidad}
                        </span>
                        <button
                          type="button"
                          className="px-1.5 py-0.5 text-xs font-bold text-noche hover:bg-[var(--hover)]"
                          onClick={() => setQty(line.idProducto, line.cantidad + 1)}
                          aria-label="Más"
                        >
                          +
                        </button>
                      </div>
                      <span className="w-[4.5rem] shrink-0 text-right text-xs font-bold tabular-nums text-noche">
                        {formatMoney(line.precio * line.cantidad)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeLine(line.idProducto)}
                        className="shrink-0 rounded p-1 text-texto-suave hover:bg-[color-mix(in_srgb,#b91c1c_18%,var(--blanco))] hover:text-[#f87171]"
                        aria-label="Quitar"
                      >
                        <IconTrash className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <footer className="shrink-0 border-t border-borde px-3 py-3">
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-sm text-texto-suave">Total</span>
                <span className="text-xl font-bold text-noche">{formatMoney(total)}</span>
              </div>
              <button
                type="button"
                onClick={handleCobrar}
                disabled={saving || loading || cart.length === 0}
                className="flex h-11 w-full items-center justify-center rounded-lg bg-[#16a34a] text-sm font-bold text-white transition hover:bg-[#15803d] disabled:opacity-50"
              >
                {saving ? "Procesando…" : "Cobrar"}
              </button>
            </footer>
          </aside>
        </div>
      ) : (
        <div className="rounded-xl border border-borde bg-blanco p-5 shadow-sm print:hidden md:p-6">
          <header className="border-b border-borde pb-4">
            <h3 className="text-lg font-bold text-noche">Ventas recientes</h3>
            <p className="mt-1 text-sm text-texto-suave">Total: {ventas.length}</p>
          </header>
          <div className="mt-4 space-y-2">
            {loading ? (
              <p className="py-10 text-center text-sm text-texto-suave">Cargando…</p>
            ) : ventas.length === 0 ? (
              <p className="py-10 text-center text-sm text-texto-suave">No hay ventas registradas</p>
            ) : (
              ventas.map((v) => {
                const open = expanded === v.id;
                return (
                  <article
                    key={v.id}
                    className="overflow-hidden rounded-lg border border-borde bg-[var(--muted)]"
                  >
                    <div className="flex w-full items-center gap-3 px-4 py-3 transition hover:bg-blanco">
                      <button
                        type="button"
                        onClick={() => setExpanded(open ? null : v.id)}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <IconChevron open={open} className="h-4 w-4 shrink-0 text-texto-suave" />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-noche">
                            {v.tipoComprobante || "Venta"}{" "}
                            {v.serie && v.numeroComprobante
                              ? `${v.serie}-${v.numeroComprobante}`
                              : `#${v.id}`}
                            <span className="ml-2 text-sm font-normal text-texto-suave">
                              {formatDate(v.fecha)}
                            </span>
                          </p>
                          <p className="mt-0.5 truncate text-xs text-texto-suave">
                            {v.clienteNombre || "Cliente"} · {v.metodoPago || "—"} ·{" "}
                            {v.empleadoNombre || "Empleado"}
                          </p>
                        </div>
                      </button>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setVoucher(v)}
                          className="rounded-md border border-borde bg-blanco px-2.5 py-1 text-xs font-semibold text-noche hover:bg-[var(--hover)]"
                        >
                          Ticket
                        </button>
                        <span className={ui.badgeOn}>
                          {formatMoney(v.total)}
                        </span>
                      </div>
                    </div>
                    {open ? (
                      <div className="border-t border-borde bg-blanco px-4 py-3">
                        {!v.detalles?.length ? (
                          <p className="text-sm text-texto-suave">Sin detalle</p>
                        ) : (
                          <table className="min-w-full text-left text-sm">
                            <thead>
                              <tr className="text-texto-suave">
                                <th className="py-2 pr-3 font-medium">Producto</th>
                                <th className="py-2 pr-3 font-medium">Cant.</th>
                                <th className="py-2 pr-3 font-medium">Precio</th>
                                <th className="py-2 font-medium text-right">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {v.detalles.map((d) => (
                                <tr key={d.id} className="border-t border-borde">
                                  <td className="py-2 pr-3 text-noche">
                                    {d.productoNombre || `#${d.idProducto}`}
                                  </td>
                                  <td className="py-2 pr-3 text-texto-suave">{d.cantidad}</td>
                                  <td className="py-2 pr-3 text-texto-suave">
                                    {formatMoney(d.precio)}
                                  </td>
                                  <td className="py-2 text-right font-medium text-noche">
                                    {formatMoney(d.subtotal)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    ) : null}
                  </article>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Voucher modal */}
      {voucher ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 print:static print:bg-transparent print:p-0">
          <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-blanco shadow-xl print:max-h-none print:max-w-none print:overflow-visible print:rounded-none print:shadow-none">
            <div className="flex items-center justify-between border-b border-borde px-4 py-3 print:hidden">
              <h3 className="text-sm font-bold text-noche">Comprobante</h3>
              <button
                type="button"
                onClick={() => setVoucher(null)}
                className="rounded-md p-1 text-texto-suave hover:bg-[var(--hover)] hover:text-noche"
                aria-label="Cerrar"
              >
                <IconClose />
              </button>
            </div>
            <div className="p-4 print:p-0">
              <VoucherTicket venta={voucher} />
            </div>
            <div className="flex gap-2 border-t border-borde p-4 print:hidden">
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 rounded-lg bg-[#714B67] py-2.5 text-sm font-semibold text-white hover:bg-[#5c3d54]"
              >
                Imprimir
              </button>
              <button
                type="button"
                onClick={() => setVoucher(null)}
                className="rounded-lg border border-borde px-4 py-2.5 text-sm font-semibold text-noche hover:bg-[var(--hover)]"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
