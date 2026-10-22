"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  DonutChart,
  HBarChart,
  LineChart,
} from "@/components/dashboard/DashboardCharts";
import type { Producto, Venta } from "@/lib/types";

function formatMoney(n: number) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(Number(n) || 0);
}

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function shortDay(iso: string) {
  const d = new Date(iso + "T12:00:00");
  return new Intl.DateTimeFormat("es-PE", { weekday: "short", day: "numeric" }).format(d);
}

const PAGO_COLORS: Record<string, string> = {
  EFECTIVO: "#16a34a",
  TARJETA: "#2563eb",
  YAPE: "#7c3aed",
  PLIN: "#0891b2",
  TRANSFERENCIA: "#ea580c",
};

const TIPO_COLORS: Record<string, string> = {
  NOTA_PEDIDO: "#6b7280",
  BOLETA: "#714B67",
  FACTURA: "#963cff",
};

const TIPO_LABEL: Record<string, string> = {
  NOTA_PEDIDO: "Nota pedido",
  BOLETA: "Boleta",
  FACTURA: "Factura",
};

export default function AppHomePage() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [clientes, setClientes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetch("/api/ventas", { credentials: "include", cache: "no-store" }).then((r) => r.json()),
      fetch("/api/productos", { credentials: "include", cache: "no-store" }).then((r) => r.json()),
      fetch("/api/clientes", { credentials: "include", cache: "no-store" }).then((r) => r.json()),
    ])
      .then(([v, p, c]) => {
        if (!alive) return;
        setVentas(v.ventas || []);
        setProductos(p.productos || []);
        setClientes(c.clientes?.length ?? 0);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const kpis = useMemo(() => {
    const totalMonto = ventas.reduce((a, v) => a + Number(v.total || 0), 0);
    const hoy = dayKey(new Date());
    const ventasHoy = ventas.filter((v) => dayKey(new Date(v.fecha)) === hoy);
    const montoHoy = ventasHoy.reduce((a, v) => a + Number(v.total || 0), 0);
    const stockBajo = productos.filter((p) => p.estado === 1 && p.stock > 0 && p.stock <= 5).length;
    const sinStock = productos.filter((p) => p.estado === 1 && p.stock < 1).length;
    return {
      totalMonto,
      montoHoy,
      ventasHoy: ventasHoy.length,
      stockBajo,
      sinStock,
      nVentas: ventas.length,
      nProductos: productos.length,
      nClientes: clientes,
    };
  }, [ventas, productos, clientes]);

  const ventas7d = useMemo(() => {
    const days: { key: string; label: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(12, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = dayKey(d);
      days.push({ key, label: shortDay(key), value: 0 });
    }
    const map = new Map(days.map((d) => [d.key, d]));
    ventas.forEach((v) => {
      const k = dayKey(new Date(v.fecha));
      const row = map.get(k);
      if (row) row.value += Number(v.total || 0);
    });
    return days.map(({ label, value }) => ({ label, value }));
  }, [ventas]);

  const ticketsPorDia = useMemo(() => {
    const days: { key: string; label: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(12, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = dayKey(d);
      days.push({ key, label: shortDay(key), value: 0 });
    }
    const map = new Map(days.map((d) => [d.key, d]));
    ventas.forEach((v) => {
      const k = dayKey(new Date(v.fecha));
      const row = map.get(k);
      if (row) row.value += 1;
    });
    return days.map(({ label, value }) => ({ label, value }));
  }, [ventas]);

  const porPago = useMemo(() => {
    const m = new Map<string, number>();
    ventas.forEach((v) => {
      const k = (v.metodoPago || "OTRO").toUpperCase();
      m.set(k, (m.get(k) || 0) + 1);
    });
    return [...m.entries()]
      .map(([label, value]) => ({
        label,
        value,
        color: PAGO_COLORS[label] || "#9ca3af",
      }))
      .sort((a, b) => b.value - a.value);
  }, [ventas]);

  const porTipo = useMemo(() => {
    const m = new Map<string, number>();
    ventas.forEach((v) => {
      const k = (v.tipoComprobante || "NOTA_PEDIDO").toUpperCase();
      m.set(k, (m.get(k) || 0) + 1);
    });
    return [...m.entries()].map(([key, value]) => ({
      label: TIPO_LABEL[key] || key,
      value,
      color: TIPO_COLORS[key] || "#9ca3af",
    }));
  }, [ventas]);

  const topProductos = useMemo(() => {
    const m = new Map<string, { nombre: string; qty: number; monto: number }>();
    ventas.forEach((v) => {
      (v.detalles || []).forEach((d) => {
        const key = String(d.idProducto);
        const cur = m.get(key) || {
          nombre: d.productoNombre || `#${d.idProducto}`,
          qty: 0,
          monto: 0,
        };
        cur.qty += Number(d.cantidad || 0);
        cur.monto += Number(d.subtotal || 0);
        m.set(key, cur);
      });
    });
    return [...m.values()]
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 6)
      .map((p) => ({
        label: p.nombre,
        value: p.qty,
        display: `${p.qty} ud · ${formatMoney(p.monto)}`,
        color: "#714B67",
      }));
  }, [ventas]);

  const stockCritico = useMemo(() => {
    return productos
      .filter((p) => p.estado === 1)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 6)
      .map((p) => ({
        label: p.nombre,
        value: Math.max(p.stock, 0),
        display: `${p.stock} ud`,
        color: p.stock <= 0 ? "#dc2626" : p.stock <= 5 ? "#ea580c" : "#16a34a",
      }));
  }, [productos]);

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-texto-suave">
            Dashboard
          </p>
          <h2 className="mt-1 text-2xl font-bold text-noche">Resumen operativo</h2>
          <p className="mt-1 text-sm text-texto-suave">
            Ventas, cobros e inventario en gráficos en vivo.
          </p>
        </div>
        <Link
          href="/app/ventas"
          className="inline-flex items-center justify-center rounded-lg bg-[#714B67] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5c3d54]"
        >
          Abrir POS
        </Link>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Ingresos totales", value: formatMoney(kpis.totalMonto), tip: `${kpis.nVentas} ventas` },
          { label: "Hoy", value: formatMoney(kpis.montoHoy), tip: `${kpis.ventasHoy} tickets` },
          { label: "Productos", value: String(kpis.nProductos), tip: `${kpis.stockBajo} stock bajo` },
          { label: "Clientes", value: String(kpis.nClientes), tip: `${kpis.sinStock} sin stock` },
        ].map((k) => (
          <div
            key={k.label}
            className="rounded-2xl border border-borde bg-blanco p-4 shadow-sm"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-texto-suave">
              {k.label}
            </p>
            <p className="mt-2 text-2xl font-bold text-noche">{loading ? "…" : k.value}</p>
            <p className="mt-1 text-xs text-texto-suave">{k.tip}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-borde bg-blanco p-4 shadow-sm md:p-5">
          <h3 className="text-sm font-bold text-noche">Ingresos · últimos 7 días</h3>
          <p className="mt-0.5 text-xs text-texto-suave">Gráfico lineal por monto cobrado</p>
          <div className="mt-3">
            <LineChart points={ventas7d} color="#714B67" />
          </div>
        </article>

        <article className="rounded-2xl border border-borde bg-blanco p-4 shadow-sm md:p-5">
          <h3 className="text-sm font-bold text-noche">Tickets · últimos 7 días</h3>
          <p className="mt-0.5 text-xs text-texto-suave">Barras por cantidad de ventas</p>
          <div className="mt-3">
            <BarChart points={ticketsPorDia} color="#963cff" />
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-borde bg-blanco p-4 shadow-sm md:p-5">
          <h3 className="text-sm font-bold text-noche">Métodos de pago</h3>
          <p className="mt-0.5 text-xs text-texto-suave">Distribución de cobros</p>
          <div className="mt-4">
            <DonutChart
              slices={
                porPago.length
                  ? porPago
                  : [{ label: "Sin ventas", value: 1, color: "var(--borde)" }]
              }
              centerLabel="Tickets"
              centerValue={String(kpis.nVentas)}
            />
          </div>
        </article>

        <article className="rounded-2xl border border-borde bg-blanco p-4 shadow-sm md:p-5">
          <h3 className="text-sm font-bold text-noche">Tipo de comprobante</h3>
          <p className="mt-0.5 text-xs text-texto-suave">Nota · Boleta · Factura</p>
          <div className="mt-4">
            <DonutChart
              slices={
                porTipo.length
                  ? porTipo
                  : [{ label: "Sin ventas", value: 1, color: "var(--borde)" }]
              }
              centerLabel="Docs"
              centerValue={String(porTipo.reduce((a, s) => a + s.value, 0))}
            />
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-borde bg-blanco p-4 shadow-sm md:p-5">
          <h3 className="text-sm font-bold text-noche">Top productos vendidos</h3>
          <p className="mt-0.5 mb-4 text-xs text-texto-suave">Por unidades en el historial</p>
          <HBarChart items={topProductos} />
        </article>

        <article className="rounded-2xl border border-borde bg-blanco p-4 shadow-sm md:p-5">
          <h3 className="text-sm font-bold text-noche">Stock crítico</h3>
          <p className="mt-0.5 mb-4 text-xs text-texto-suave">Productos con menos unidades</p>
          <HBarChart items={stockCritico} />
        </article>
      </section>

      <section className="flex flex-wrap gap-2">
        {[
          { href: "/app/ventas", label: "POS" },
          { href: "/app/productos", label: "Productos" },
          { href: "/app/clientes", label: "Clientes" },
          { href: "/app/empleados", label: "Empleados" },
          { href: "/app/categorias", label: "Categorías" },
          { href: "/app/usuarios", label: "Usuarios" },
        ].map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-full border border-borde bg-blanco px-3.5 py-1.5 text-xs font-semibold text-noche transition hover:border-lavanda hover:bg-[var(--muted)]"
          >
            {l.label}
          </Link>
        ))}
      </section>
    </div>
  );
}
