"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useNotifications } from "@/components/providers/NotificationsProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { AuthSession } from "@/lib/auth";
import { ALL_NAV_ITEMS, NAV_GROUPS, NavIcon, findNavMatch } from "./nav-items";

type Props = {
  user: AuthSession;
  onOpenMobile: () => void;
  onLogout: () => void;
};

type Crumb = { label: string; href?: string };

function buildCrumbs(pathname: string): Crumb[] {
  const crumbs: Crumb[] = [{ label: "Ventryx", href: "/app" }];

  if (pathname === "/app") {
    crumbs.push({ label: "Inicio" });
    return crumbs;
  }

  const match = findNavMatch(pathname);
  if (match) {
    const group = NAV_GROUPS.find((g) => g.items.some((i) => i.href === match.href));
    if (group && group.label !== "General") {
      crumbs.push({ label: group.label, href: group.hub || group.items[0]?.href });
    }
    crumbs.push({ label: match.label });
    return crumbs;
  }

  crumbs.push({ label: "Panel" });
  return crumbs;
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Ahora";
  if (mins < 60) return `Hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs} h`;
  const days = Math.floor(hrs / 24);
  return `Hace ${days} d`;
}

export function TopBar({ user, onOpenMobile, onLogout }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const crumbs = useMemo(() => buildCrumbs(pathname), [pathname]);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);
  const { theme, toggleTheme } = useTheme();
  const { items, unreadCount, markRead, markAllRead, dismiss } = useNotifications();
  const initials = user.username.slice(0, 2).toUpperCase();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL_NAV_ITEMS;
    return ALL_NAV_ITEMS.filter((item) => {
      const hay = [item.label, item.group, item.href, ...(item.keywords || [])]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [query]);

  useEffect(() => {
    setActiveIdx(0);
  }, [query, searchOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isK = e.key.toLowerCase() === "k";
      if ((e.ctrlKey || e.metaKey) && isK) {
        e.preventDefault();
        setNotifOpen(false);
        setProfileOpen(false);
        setSearchOpen(true);
        setTimeout(() => {
          (window.matchMedia("(min-width: 1024px)").matches
            ? searchRef.current
            : mobileSearchRef.current
          )?.focus();
        }, 0);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function closeMenus() {
    setProfileOpen(false);
    setNotifOpen(false);
  }

  function closeSearch() {
    setSearchOpen(false);
    setQuery("");
  }

  function goTo(href: string) {
    closeSearch();
    closeMenus();
    router.push(href);
  }

  function onSearchKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      closeSearch();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Enter" && results[activeIdx]) {
      e.preventDefault();
      goTo(results[activeIdx].href);
    }
  }

  const searchPanel = searchOpen ? (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 cursor-default bg-noche/20 backdrop-blur-[1px]"
        aria-label="Cerrar búsqueda"
        onClick={closeSearch}
      />
      <div className="absolute left-0 right-0 top-[calc(100%+0.4rem)] z-50 overflow-hidden rounded-2xl border border-borde bg-blanco shadow-[var(--sombra-menu)] lg:left-auto lg:right-0 lg:w-[360px]">
        <div className="border-b border-borde px-3 py-2 lg:hidden">
          <input
            ref={mobileSearchRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onSearchKeyDown}
            placeholder="Ir a módulo…"
            className="w-full rounded-xl border border-borde bg-[var(--muted)] px-3 py-2 text-sm outline-none focus:border-lavanda"
            autoFocus
          />
        </div>
        <ul className="max-h-72 overflow-y-auto py-1" role="listbox">
          {results.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-texto-suave">Sin resultados</li>
          ) : (
            results.map((item, idx) => (
              <li key={item.href} role="option" aria-selected={idx === activeIdx}>
                <button
                  type="button"
                  onClick={() => goTo(item.href)}
                  onMouseEnter={() => setActiveIdx(idx)}
                  className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition ${
                    idx === activeIdx ? "bg-[var(--hover)] text-ventryx" : "text-noche hover:bg-[var(--muted)]"
                  }`}
                >
                  <NavIcon name={item.icon} className="h-4 w-4 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{item.label}</span>
                    <span className="block text-[11px] text-texto-suave">{item.group}</span>
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </>
  ) : null;

  return (
    <header className="sticky top-0 z-20 border-b border-borde bg-[color-mix(in_srgb,var(--blanco)_95%,transparent)] backdrop-blur">
      <div className="flex h-14 items-center gap-2 px-3 md:h-[64px] md:gap-3 md:px-5">
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-borde text-noche lg:hidden"
          aria-label="Abrir menú"
          onClick={onOpenMobile}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          </svg>
        </button>

        <nav aria-label="Breadcrumb" className="min-w-0 flex-1 overflow-hidden">
          <ol className="flex items-center gap-1.5 text-[0.8rem] md:text-sm">
            {crumbs.map((crumb, index) => {
              const last = index === crumbs.length - 1;
              return (
                <li key={`${crumb.label}-${index}`} className="flex min-w-0 items-center gap-1.5">
                  {index > 0 ? <span className="text-texto-suave/60">›</span> : null}
                  {last || !crumb.href ? (
                    <span
                      className={`truncate ${
                        last ? "font-semibold text-noche" : "font-medium text-texto-suave"
                      }`}
                      aria-current={last ? "page" : undefined}
                    >
                      {crumb.label}
                    </span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="truncate font-medium text-texto-suave transition hover:text-ventryx hover:underline"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="relative hidden min-w-[200px] max-w-[280px] flex-1 lg:block xl:max-w-[320px]">
          <label className="relative flex items-center">
            <span className="pointer-events-none absolute left-3 text-texto-suave">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="11" cy="11" r="6.5" />
                <path d="m16 16 3.5 3.5" strokeLinecap="round" />
              </svg>
            </span>
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => {
                closeMenus();
                setSearchOpen(true);
              }}
              onKeyDown={onSearchKeyDown}
              placeholder="Buscar módulo…"
              className="w-full rounded-full border border-borde bg-[var(--muted)] py-2 pl-9 pr-16 text-sm text-noche outline-none transition placeholder:text-texto-suave focus:border-lavanda focus:bg-blanco"
              aria-label="Buscar en el sistema"
              aria-expanded={searchOpen}
              aria-controls="nav-search-results"
            />
            <kbd className="pointer-events-none absolute right-3 rounded-md border border-borde bg-blanco px-1.5 py-0.5 text-[0.65rem] font-semibold text-texto-suave">
              Ctrl K
            </kbd>
          </label>
          <div id="nav-search-results">{searchPanel}</div>
        </div>

        <div className="relative flex items-center gap-1.5 md:gap-2">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-texto-suave transition hover:bg-[var(--hover)] hover:text-ventryx lg:hidden"
            aria-label="Buscar"
            onClick={() => {
              closeMenus();
              setSearchOpen((v) => !v);
            }}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="11" cy="11" r="6.5" />
              <path d="m16 16 3.5 3.5" strokeLinecap="round" />
            </svg>
          </button>
          <div className="lg:hidden">{searchPanel}</div>

          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-texto-suave transition hover:bg-[var(--hover)] hover:text-ventryx"
            aria-label={theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
            title={theme === "dark" ? "Tema claro" : "Tema oscuro"}
          >
            {theme === "dark" ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
                <circle cx="12" cy="12" r="4" />
                <path
                  d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M20 14.5A7.5 7.5 0 1 1 9.5 4 6 6 0 0 0 20 14.5z" strokeLinejoin="round" />
              </svg>
            )}
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setProfileOpen(false);
                setSearchOpen(false);
                setNotifOpen((v) => !v);
              }}
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-texto-suave transition hover:bg-[var(--hover)] hover:text-ventryx"
              aria-label="Notificaciones"
              aria-expanded={notifOpen}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M6 9.5a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13.5 6 9.5z" />
                <path d="M10 18.5a2 2 0 0 0 4 0" />
              </svg>
              {unreadCount > 0 ? (
                <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ventryx px-1 text-[0.62rem] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
            </button>

            {notifOpen ? (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-40 cursor-default"
                  aria-label="Cerrar notificaciones"
                  onClick={closeMenus}
                />
                <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(100vw-1.5rem,22rem)] overflow-hidden rounded-2xl border border-borde bg-blanco shadow-[var(--sombra-menu)]">
                  <div className="flex items-center justify-between border-b border-borde px-3 py-2.5">
                    <p className="text-sm font-semibold text-noche">Notificaciones</p>
                    {unreadCount > 0 ? (
                      <button
                        type="button"
                        onClick={markAllRead}
                        className="text-xs font-semibold text-ventryx hover:underline"
                      >
                        Marcar todas
                      </button>
                    ) : null}
                  </div>
                  <ul className="max-h-[22rem] overflow-y-auto">
                    {items.length === 0 ? (
                      <li className="px-4 py-8 text-center text-sm text-texto-suave">
                        Sin notificaciones
                      </li>
                    ) : (
                      items.map((n) => (
                        <li
                          key={n.id}
                          className={`border-b border-borde last:border-0 ${
                            n.read ? "bg-blanco" : "bg-[var(--muted)]"
                          }`}
                        >
                          {n.href ? (
                            <Link
                              href={n.href}
                              onClick={() => {
                                markRead(n.id);
                                closeMenus();
                              }}
                              className="block px-3 py-3 transition hover:bg-[var(--hover)]"
                            >
                              <div className="flex items-start gap-2">
                                {!n.read ? (
                                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-ventryx" />
                                ) : (
                                  <span className="mt-1.5 h-2 w-2 shrink-0" />
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold text-noche">{n.title}</p>
                                  <p className="mt-0.5 text-xs text-texto-suave">{n.body}</p>
                                  <p className="mt-1 text-[0.65rem] text-texto-suave/80">
                                    {formatRelative(n.createdAt)}
                                  </p>
                                </div>
                              </div>
                            </Link>
                          ) : (
                            <button
                              type="button"
                              onClick={() => markRead(n.id)}
                              className="w-full px-3 py-3 text-left transition hover:bg-[var(--hover)]"
                            >
                              <div className="flex items-start gap-2">
                                {!n.read ? (
                                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-ventryx" />
                                ) : (
                                  <span className="mt-1.5 h-2 w-2 shrink-0" />
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold text-noche">{n.title}</p>
                                  <p className="mt-0.5 text-xs text-texto-suave">{n.body}</p>
                                  <p className="mt-1 text-[0.65rem] text-texto-suave/80">
                                    {formatRelative(n.createdAt)}
                                  </p>
                                </div>
                              </div>
                            </button>
                          )}
                          <div className="flex justify-end px-3 pb-2">
                            <button
                              type="button"
                              onClick={() => dismiss(n.id)}
                              className="text-[0.65rem] font-medium text-texto-suave hover:text-noche"
                            >
                              Descartar
                            </button>
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </>
            ) : null}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setNotifOpen(false);
                setSearchOpen(false);
                setProfileOpen((v) => !v);
              }}
              className="flex items-center gap-2 rounded-full border border-borde bg-blanco py-1 pl-1 pr-2 transition hover:border-lavanda md:pr-3"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purpura to-electrico text-[0.7rem] font-bold text-white">
                {initials}
              </span>
              <span className="hidden min-w-0 text-left leading-tight sm:block">
                <span className="block max-w-[110px] truncate text-sm font-semibold text-noche">
                  {user.username}
                </span>
                <span className="block text-[0.65rem] font-semibold uppercase tracking-wide text-ventryx">
                  {user.rol}
                </span>
              </span>
            </button>

            {profileOpen ? (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-40 cursor-default"
                  aria-label="Cerrar menú perfil"
                  onClick={closeMenus}
                />
                <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-56 rounded-2xl border border-borde bg-blanco p-2 shadow-[var(--sombra-menu)]">
                  <div className="border-b border-borde px-3 py-2">
                    <p className="text-sm font-semibold text-noche">{user.username}</p>
                    <p className="text-xs uppercase tracking-wide text-ventryx">{user.rol}</p>
                  </div>
                  <Link
                    href="/app/perfil"
                    onClick={closeMenus}
                    className="mt-1 flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium text-noche transition hover:bg-[var(--hover)]"
                  >
                    Mi perfil
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      closeMenus();
                      onLogout();
                    }}
                    className="flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium text-[#f97066] transition hover:bg-[var(--hover)]"
                  >
                    Cerrar sesión
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
