export type Usuario = {
  id: number;
  username: string;
  nombres: string | null;
  apellidos: string | null;
  dni: string | null;
  telefono: string | null;
  email: string | null;
  foto: string | null;
  rol: string;
  estado: number;
  mustChangePassword?: boolean;
  idEmpleado?: number | null;
  empleadoNombre?: string | null;
};

export type Rol = {
  id: number;
  nombre: string;
  descripcion: string | null;
  estado: number;
  permisos: string[];
};

export type Permiso = {
  id: number;
  codigo: string;
  modulo: string;
  nombre: string;
  descripcion: string | null;
};

export type PermisoModulo = {
  modulo: string;
  permisos: Permiso[];
};

export type Cliente = {
  id: number;
  nombres: string;
  apellidos: string | null;
  dni: string;
  telefono: string | null;
  direccion: string | null;
  email: string | null;
};

export type Empleado = {
  id: number;
  nombres: string;
  apellidos: string;
  dni: string;
  telefono: string | null;
  email: string | null;
  cargo: string | null;
  estado: number;
};

export type Categoria = {
  id: number;
  nombre: string;
  descripcion: string | null;
};

export type Producto = {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  stock: number;
  codigoBarras?: string | null;
  idCategoria: number;
  categoriaNombre?: string | null;
  estado: number;
  version?: number;
};

export type DetalleVenta = {
  id: number;
  idProducto: number;
  productoNombre: string | null;
  productoCodigoBarras?: string | null;
  cantidad: number;
  precio: number;
  subtotal: number;
};

export type TipoComprobante = "NOTA_PEDIDO" | "BOLETA" | "FACTURA";
export type MetodoPago =
  | "EFECTIVO"
  | "TARJETA"
  | "YAPE"
  | "PLIN"
  | "TRANSFERENCIA";

export type Venta = {
  id: number;
  fecha: string;
  total: number;
  tipoComprobante?: TipoComprobante | string | null;
  metodoPago?: MetodoPago | string | null;
  serie?: string | null;
  numeroComprobante?: string | null;
  idCliente: number;
  clienteNombre: string | null;
  clienteDni?: string | null;
  idEmpleado: number;
  empleadoNombre: string | null;
  detalles: DetalleVenta[];
};
