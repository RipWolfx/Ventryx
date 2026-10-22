export type NavItem = {
  href: string;
  label: string;
  icon: "home" | "users" | "roles" | "sales" | "products" | "clients" | "settings" | "docs" | "profile";
  keywords?: string[];
};

export type NavGroup = {
  label: string;
  hub?: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "General",
    hub: "/app",
    items: [
      { href: "/app", label: "Inicio", icon: "home", keywords: ["dashboard", "graficos", "resumen"] },
      {
        href: "/app/api-docs",
        label: "API / Endpoints",
        icon: "docs",
        keywords: ["api", "endpoints", "docs"],
      },
    ],
  },
  {
    label: "Administración",
    hub: "/app/usuarios",
    items: [
      { href: "/app/usuarios", label: "Usuarios", icon: "users", keywords: ["login", "cuenta"] },
      {
        href: "/app/roles",
        label: "Roles y permisos",
        icon: "roles",
        keywords: ["permisos", "matriz"],
      },
      {
        href: "/app/empleados",
        label: "Empleados",
        icon: "users",
        keywords: ["personal", "caja"],
      },
    ],
  },
  {
    label: "Operación",
    hub: "/app/ventas",
    items: [
      {
        href: "/app/ventas",
        label: "Punto de Venta",
        icon: "sales",
        keywords: ["pos", "caja", "cobrar", "boleta", "factura"],
      },
      {
        href: "/app/productos",
        label: "Productos",
        icon: "products",
        keywords: ["stock", "barcode", "inventario"],
      },
      {
        href: "/app/categorias",
        label: "Categorías",
        icon: "products",
        keywords: ["clasificacion"],
      },
      {
        href: "/app/clientes",
        label: "Clientes",
        icon: "clients",
        keywords: ["agenda", "dni"],
      },
    ],
  },
  {
    label: "Cuenta",
    hub: "/app/perfil",
    items: [
      {
        href: "/app/perfil",
        label: "Mi perfil",
        icon: "profile",
        keywords: ["password", "foto", "cuenta"],
      },
    ],
  },
];

export const ALL_NAV_ITEMS = NAV_GROUPS.flatMap((g) =>
  g.items.map((item) => ({ ...item, group: g.label })),
);

export function findNavMatch(pathname: string) {
  const sorted = [...ALL_NAV_ITEMS].sort((a, b) => b.href.length - a.href.length);
  return sorted.find((i) => {
    if (i.href === "/app") return pathname === "/app";
    return pathname === i.href || pathname.startsWith(`${i.href}/`);
  });
}

export function NavIcon({
  name,
  className = "h-5 w-5",
}: {
  name: NavItem["icon"];
  className?: string;
}) {
  const props = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "home":
      return (
        <svg {...props}>
          <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
        </svg>
      );
    case "users":
      return (
        <svg {...props}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3.5 19c.8-2.5 2.7-4 5.5-4s4.7 1.5 5.5 4" />
          <circle cx="17" cy="9" r="2.2" />
          <path d="M14.8 19c.4-1.5 1.5-2.6 3.2-2.6 1.2 0 2.2.5 2.8 1.4" />
        </svg>
      );
    case "roles":
      return (
        <svg {...props}>
          <path d="M12 3 4.5 6.5v4.2c0 4.4 3 8.2 7.5 9.3 4.5-1.1 7.5-4.9 7.5-9.3V6.5z" />
          <path d="M9.5 12.2 11.2 14l3.5-3.8" />
        </svg>
      );
    case "sales":
      return (
        <svg {...props}>
          <path d="M4 19V5M4 19h16" />
          <path d="M8 15v-4M12 15V8M16 15v-6" />
        </svg>
      );
    case "products":
      return (
        <svg {...props}>
          <path d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5z" />
          <path d="M12 12v8M4 8.5 12 12l8-3.5" />
        </svg>
      );
    case "clients":
      return (
        <svg {...props}>
          <circle cx="12" cy="8" r="3.2" />
          <path d="M5 19c1.2-3 3.6-4.5 7-4.5s5.8 1.5 7 4.5" />
        </svg>
      );
    case "docs":
      return (
        <svg {...props}>
          <path d="M7 4h8l4 4v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
          <path d="M15 4v4h4M9 12h6M9 16h6" />
        </svg>
      );
    case "profile":
      return (
        <svg {...props}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 19c1.5-3.2 3.8-4.8 7-4.8s5.5 1.6 7 4.8" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
        </svg>
      );
  }
}
