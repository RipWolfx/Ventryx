"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  href?: string;
  createdAt: string;
  read: boolean;
};

type NotificationsContextValue = {
  items: AppNotification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
  clearAll: () => void;
  push: (n: Omit<AppNotification, "id" | "createdAt" | "read"> & { id?: string }) => void;
};

const STORAGE_KEY = "ventryx_notifications_v1";
const NotificationsContext = createContext<NotificationsContextValue | null>(null);

const SEED: AppNotification[] = [
  {
    id: "seed-pos",
    title: "POS listo",
    body: "Usa Nota de pedido, Boleta (DNI) o Factura (RUC) desde Ventas.",
    href: "/app/ventas",
    createdAt: new Date().toISOString(),
    read: false,
  },
  {
    id: "seed-scan",
    title: "Escáner móvil",
    body: "Genera el link de escáner en caja para agregar productos con la cámara.",
    href: "/app/ventas",
    createdAt: new Date(Date.now() - 36e5).toISOString(),
    read: false,
  },
  {
    id: "seed-decolecta",
    title: "Decolecta",
    body: "Configura la API key en el backend para consultar DNI y RUC.",
    href: "/app/api-docs",
    createdAt: new Date(Date.now() - 72e5).toISOString(),
    read: true,
  },
];

function loadStored(): AppNotification[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AppNotification[];
    if (!Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function persist(items: AppNotification[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<AppNotification[]>([]);

  useEffect(() => {
    const stored = loadStored();
    if (stored && stored.length) {
      setItems(stored);
    } else {
      setItems(SEED);
      persist(SEED);
    }
  }, []);

  const commit = useCallback((updater: (prev: AppNotification[]) => AppNotification[]) => {
    setItems((prev) => {
      const next = updater(prev);
      persist(next);
      return next;
    });
  }, []);

  const markRead = useCallback(
    (id: string) => {
      commit((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    },
    [commit],
  );

  const markAllRead = useCallback(() => {
    commit((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [commit]);

  const dismiss = useCallback(
    (id: string) => {
      commit((prev) => prev.filter((n) => n.id !== id));
    },
    [commit],
  );

  const clearAll = useCallback(() => {
    commit(() => []);
  }, [commit]);

  const push = useCallback(
    (n: Omit<AppNotification, "id" | "createdAt" | "read"> & { id?: string }) => {
      const item: AppNotification = {
        id: n.id || `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: n.title,
        body: n.body,
        href: n.href,
        createdAt: new Date().toISOString(),
        read: false,
      };
      commit((prev) => [item, ...prev].slice(0, 40));
    },
    [commit],
  );

  const unreadCount = useMemo(() => items.filter((n) => !n.read).length, [items]);

  const value = useMemo(
    () => ({ items, unreadCount, markRead, markAllRead, dismiss, clearAll, push }),
    [items, unreadCount, markRead, markAllRead, dismiss, clearAll, push],
  );

  return (
    <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications debe usarse dentro de NotificationsProvider");
  return ctx;
}
