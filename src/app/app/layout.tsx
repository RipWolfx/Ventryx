import { AppShell } from "@/components/layout/AppShell";

/** Área autenticada: la sesión es client-side; no forzar validación instant. */
export const instant = false;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
