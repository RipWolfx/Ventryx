import JsBarcode from "jsbarcode";

/** Genera un código CODE128-friendly para tiquetera (12 dígitos con prefijo 77). */
export function generarCodigoBarras(): string {
  const n = Math.floor(Math.random() * 10_000_000_000);
  return `77${String(n).padStart(10, "0")}`;
}

export function renderBarcodeSvg(
  svg: SVGSVGElement,
  value: string,
  options?: { width?: number; height?: number; displayValue?: boolean },
) {
  if (!value.trim()) {
    svg.innerHTML = "";
    return;
  }
  JsBarcode(svg, value.trim(), {
    format: "CODE128",
    width: options?.width ?? 1.6,
    height: options?.height ?? 56,
    displayValue: options?.displayValue ?? true,
    fontSize: 12,
    margin: 6,
    background: "#ffffff",
    lineColor: "#111827",
  });
}

/** Abre una ventana de impresión con etiqueta para tiquetera. */
export function imprimirEtiqueta(opts: {
  codigo: string;
  nombre: string;
  precio?: number | string;
}) {
  const win = window.open("", "_blank", "width=360,height=280");
  if (!win) return;
  const precio =
    opts.precio !== undefined && opts.precio !== ""
      ? Number(opts.precio).toLocaleString("es-PE", {
          style: "currency",
          currency: "PEN",
        })
      : "";
  win.document.write(`<!doctype html><html><head><title>Etiqueta</title>
<style>
  body{font-family:Arial,sans-serif;margin:12px;text-align:center}
  h1{font-size:13px;margin:0 0 6px;font-weight:700}
  .precio{font-size:12px;margin:4px 0 8px}
  svg{max-width:100%}
</style></head><body>
  <h1>${escapeHtml(opts.nombre)}</h1>
  ${precio ? `<div class="precio">${precio}</div>` : ""}
  <svg id="bc"></svg>
  <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
  <script>
    JsBarcode("#bc", ${JSON.stringify(opts.codigo)}, {
      format: "CODE128", width: 1.5, height: 48, displayValue: true, fontSize: 11, margin: 4
    });
    setTimeout(function(){ window.print(); }, 250);
  <\/script>
</body></html>`);
  win.document.close();
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
