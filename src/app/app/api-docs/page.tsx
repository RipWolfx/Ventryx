const groups = [
  {
    title: "Auth",
    rows: [
      ["POST", "/api/auth/login", "Iniciar sesión"],
      ["POST", "/api/auth/logout", "Cerrar sesión"],
      ["GET", "/api/auth/me", "Sesión actual"],
      ["POST", "/api/auth/password-inicial", "Cambio obligatorio de clave"],
    ],
  },
  {
    title: "Usuarios / Roles / Perfil",
    rows: [
      ["GET/POST", "/api/usuarios", "Listar / crear (password = DNI)"],
      ["PUT/DELETE", "/api/usuarios/{id}", "Actualizar / eliminar"],
      ["GET/POST", "/api/roles", "Listar / crear con permisos"],
      ["PUT", "/api/roles/{id}/permisos", "Actualizar matriz"],
      ["GET", "/api/permisos", "Catálogo de permisos"],
      ["GET/PUT", "/api/perfil", "Ver / editar perfil"],
      ["PUT", "/api/perfil/password", "Cambiar contraseña"],
      ["POST/GET", "/api/perfil/foto", "Subir / ver foto"],
    ],
  },
  {
    title: "Operación",
    rows: [
      ["CRUD", "/api/empleados", "Empleados"],
      ["CRUD", "/api/clientes", "Clientes"],
      ["CRUD", "/api/categorias", "Categorías"],
      ["CRUD", "/api/productos", "Productos + stock + codigoBarras"],
      ["GET", "/api/productos/barcode/{codigo}", "Buscar producto por código de barras"],
      ["GET", "/api/ventas", "Listar ventas con detalle"],
      ["GET", "/api/ventas/{id}", "Detalle de una venta"],
      [
        "POST",
        "/api/ventas",
        "Registrar venta: idCliente, idEmpleado, tipoComprobante, metodoPago, items[]",
      ],
    ],
  },
  {
    title: "POS (escáner móvil)",
    rows: [
      ["POST", "/api/pos/sesion", "Crear sesión de escáner (auth) → { token }"],
      ["GET", "/api/pos/sesion/{token}", "Estado de sesión (público) → { ok }"],
      ["POST", "/api/pos/sesion/{token}/codigo", "Encolar código (público) → { codigo }"],
      ["GET", "/api/pos/sesion/{token}/cola", "Drenar códigos pendientes (auth)"],
    ],
  },
];

export default function ApiDocsPage() {
  return (
    <section className="mx-auto max-w-4xl space-y-5">
      <header>
        <h2 className="text-xl font-bold text-noche">Índice de endpoints</h2>
        <p className="mt-1 text-sm text-texto-suave">
          API REST Spring Boot en puerto 8080. El front proxifica{" "}
          <code className="rounded bg-[var(--muted)] px-1.5 py-0.5 text-xs text-noche">/api/*</code>.
          Documento completo:{" "}
          <code className="rounded bg-[var(--muted)] px-1.5 py-0.5 text-xs text-noche">
            ENDPOINTS.md
          </code>{" "}
          en la raíz del proyecto.
        </p>
      </header>

      {groups.map((g) => (
        <div
          key={g.title}
          className="overflow-hidden rounded-[18px] border border-borde bg-blanco shadow-sm"
        >
          <div className="border-b border-borde px-5 py-3">
            <h3 className="text-sm font-bold text-noche">{g.title}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="text-texto-suave">
                  <th className="px-5 py-2 font-medium">Método</th>
                  <th className="px-5 py-2 font-medium">Ruta</th>
                  <th className="px-5 py-2 font-medium">Descripción</th>
                </tr>
              </thead>
              <tbody>
                {g.rows.map(([method, path, desc]) => (
                  <tr key={method + path} className="border-t border-borde">
                    <td className="px-5 py-2.5 font-mono text-xs font-semibold text-ventryx">
                      {method}
                    </td>
                    <td className="px-5 py-2.5 font-mono text-xs text-noche">{path}</td>
                    <td className="px-5 py-2.5 text-texto-suave">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </section>
  );
}
