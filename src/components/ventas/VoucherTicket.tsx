"use client";

import { useEffect, useRef } from "react";
import { renderBarcodeSvg } from "@/lib/barcode";
import type { Venta } from "@/lib/types";

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

export function VoucherTicket({
  venta,
  className = "",
}: {
  venta: Venta;
  className?: string;
}) {
  const barcodeRef = useRef<SVGSVGElement>(null);
  const barcodeValue = String(venta.id);

  useEffect(() => {
    if (!barcodeRef.current) return;
    try {
      renderBarcodeSvg(barcodeRef.current, barcodeValue, {
        width: 1.4,
        height: 42,
        displayValue: true,
      });
    } catch {
      barcodeRef.current.innerHTML = "";
    }
  }, [barcodeValue]);

  const serieNum =
    venta.serie && venta.numeroComprobante
      ? `${venta.serie}-${venta.numeroComprobante}`
      : venta.numeroComprobante || `#${venta.id}`;

  return (
    <div
      id="voucher-print-area"
      className={`voucher-ticket mx-auto w-full max-w-[320px] bg-white px-4 py-5 font-mono text-[12px] text-[#111827] ${className}`}
    >
      <header className="border-b border-dashed border-[#d1d5db] pb-3 text-center">
        <p className="text-base font-bold tracking-wide">VENTRYX</p>
        <p className="mt-0.5 text-[10px] uppercase tracking-wider text-[#6b7280]">
          Sistema de Ventas
        </p>
        <p className="mt-2 text-[11px] font-semibold uppercase">
          {venta.tipoComprobante === "NOTA_PEDIDO"
            ? "NOTA DE PEDIDO"
            : venta.tipoComprobante || "BOLETA"}
        </p>
        <p className="mt-0.5 text-[11px]">{serieNum}</p>
        <p className="mt-1 text-[10px] text-[#6b7280]">{formatDate(venta.fecha)}</p>
      </header>

      <div className="mt-3 space-y-0.5 border-b border-dashed border-[#d1d5db] pb-3 text-[11px]">
        <p>
          <span className="text-[#6b7280]">Cliente:</span>{" "}
          {venta.clienteNombre || "—"}
        </p>
        {venta.clienteDni && venta.clienteDni !== "00000000" ? (
          <p>
            <span className="text-[#6b7280]">
              {venta.tipoComprobante === "FACTURA" ? "RUC:" : "DNI:"}
            </span>{" "}
            {venta.clienteDni}
          </p>
        ) : null}
        {venta.empleadoNombre ? (
          <p>
            <span className="text-[#6b7280]">Cajero:</span> {venta.empleadoNombre}
          </p>
        ) : null}
      </div>

      <table className="mt-3 w-full border-b border-dashed border-[#d1d5db] pb-3 text-left">
        <thead>
          <tr className="text-[10px] uppercase text-[#6b7280]">
            <th className="pb-1 font-medium">Item</th>
            <th className="pb-1 text-right font-medium">Cant</th>
            <th className="pb-1 text-right font-medium">Imp.</th>
          </tr>
        </thead>
        <tbody>
          {(venta.detalles || []).map((d) => (
            <tr key={d.id || `${d.idProducto}-${d.cantidad}`}>
              <td className="max-w-[140px] truncate py-0.5 pr-1">
                {d.productoNombre || `#${d.idProducto}`}
              </td>
              <td className="py-0.5 text-right">{d.cantidad}</td>
              <td className="py-0.5 text-right">{formatMoney(d.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-3 space-y-1 border-b border-dashed border-[#d1d5db] pb-3">
        <div className="flex justify-between text-sm font-bold">
          <span>TOTAL</span>
          <span>{formatMoney(venta.total)}</span>
        </div>
        <p className="text-[11px]">
          <span className="text-[#6b7280]">Pago:</span>{" "}
          {venta.metodoPago || "EFECTIVO"}
        </p>
      </div>

      <div className="mt-4 flex flex-col items-center">
        <svg ref={barcodeRef} />
        <p className="mt-1 text-[9px] text-[#9ca3af]">Comprobante #{venta.id}</p>
      </div>

      <p className="mt-4 text-center text-[10px] text-[#6b7280]">
        Gracias por su compra
      </p>
    </div>
  );
}
