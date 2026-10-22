"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ForcePasswordModal } from "@/components/auth/ForcePasswordModal";
import { AuthSession, logoutRequest, meRequest } from "@/lib/auth";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    meRequest().then((session) => {
      if (!alive) return;
      if (!session) {
        router.replace("/");
        setLoading(false);
        return;
      }
      setUser(session);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [router]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const saved = localStorage.getItem("ventryx_sidebar_collapsed");
    if (saved === "1") setCollapsed(true);
  }, []);

  function toggleCollapse() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("ventryx_sidebar_collapsed", next ? "1" : "0");
      return next;
    });
  }

  async function handleLogout() {
    await logoutRequest();
    router.replace("/");
  }

  // Siempre renderizar {children} para que Next pueda validar instant navigation.
  if (loading || !user) {
    return (
      <div className="min-h-dvh bg-fondo">
        <main className="flex min-h-dvh items-center justify-center text-texto-suave">
          {loading ? "Cargando…" : "Redirigiendo…"}
        </main>
        <div className="hidden" aria-hidden="true">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-fondo">
      {user.mustChangePassword ? (
        <ForcePasswordModal
          onDone={() => setUser((prev) => (prev ? { ...prev, mustChangePassword: false } : prev))}
        />
      ) : null}

      <AppSidebar
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div
        className={`min-h-dvh transition-[padding] duration-300 ${
          collapsed ? "lg:pl-[84px]" : "lg:pl-[272px]"
        }`}
      >
        <TopBar
          user={user}
          onOpenMobile={() => setMobileOpen(true)}
          onLogout={handleLogout}
        />

        <div
          className={
            pathname.startsWith("/app/perfil")
              ? "perfil-glow p-4 md:p-6 lg:p-8"
              : "p-4 md:p-6 lg:p-8"
          }
        >
          {children}
        </div>
      </div>
    </div>
  );
}
