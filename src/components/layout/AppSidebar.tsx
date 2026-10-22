"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_GROUPS, NavIcon } from "./nav-items";

type Props = {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
};

function isActive(pathname: string, href: string) {
  if (href === "/app") return pathname === "/app";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: Props) {
  const pathname = usePathname();

  const asideClass = [
    "fixed inset-y-0 left-0 z-40 flex h-dvh flex-col border-r border-borde bg-blanco transition-all duration-300 ease-out",
    "w-[272px]",
    collapsed ? "lg:w-[84px]" : "lg:w-[272px]",
    mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0",
  ].join(" ");

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-30 bg-noche/40 backdrop-blur-[2px] lg:hidden"
          onClick={onCloseMobile}
        />
      ) : null}

      <aside className={asideClass}>
        <div
          className={`relative flex h-16 items-center gap-3 border-b border-borde px-4 ${
            collapsed ? "lg:justify-center lg:px-2" : ""
          }`}
        >
          <Link
            href="/app"
            onClick={onCloseMobile}
            className={`flex min-w-0 items-center gap-3 rounded-lg transition hover:opacity-90 ${
              collapsed ? "lg:justify-center" : ""
            }`}
            title="Ir al inicio"
          >
            <Image
              src="/img/isotipo.png"
              alt="Ventryx"
              width={36}
              height={36}
              className="shrink-0 rounded-lg"
            />
            <div className={`min-w-0 ${collapsed ? "lg:hidden" : ""}`}>
              <p className="truncate font-[family-name:var(--font-syne)] text-base font-bold text-noche">
                Ventryx
              </p>
            <p className="truncate text-[0.62rem] tracking-[0.18em] text-texto-suave/90">
              SISTEMA DE VENTAS
            </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
            className="absolute -right-3 top-1/2 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-borde bg-blanco text-texto-suave shadow-sm transition hover:text-ventryx lg:flex"
          >
            <svg
              viewBox="0 0 24 24"
              className={`h-3.5 w-3.5 transition ${collapsed ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M14 6 8 12l6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-5">
              <p
                className={`mb-2 px-2 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-texto-suave/80 ${
                  collapsed ? "lg:hidden" : ""
                }`}
              >
                {group.label}
              </p>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        title={collapsed ? item.label : undefined}
                        onClick={onCloseMobile}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                          collapsed ? "lg:justify-center lg:px-2" : ""
                        } ${
                          active
                            ? "bg-[var(--hover)] text-ventryx"
                            : "text-noche/75 hover:bg-[var(--muted)] hover:text-noche"
                        }`}
                      >
                        <NavIcon name={item.icon} />
                        <span className={collapsed ? "lg:hidden" : ""}>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
