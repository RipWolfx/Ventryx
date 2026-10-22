import Image from "next/image";
import { LoginForm } from "./LoginForm";

const features = [
  {
    title: "Ventas con control de stock en tiempo real",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 7h16M4 12h10M4 17h7" strokeLinecap="round" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    ),
  },
  {
    title: "Clientes, productos y categorías en un solo lugar",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="8" cy="8" r="2.5" />
        <circle cx="16" cy="8" r="2.5" />
        <path d="M4.5 18c.8-2.2 2.6-3.5 5-3.5s4.2 1.3 5 3.5" strokeLinecap="round" />
        <path d="M13.5 14.8c.7-.4 1.6-.6 2.5-.6 2.4 0 4.2 1.3 5 3.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Reportes listos para operar el día a día",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="4" y="3.5" width="16" height="17" rx="2" />
        <path d="M8 8h8M8 12h8M8 16h5" strokeLinecap="round" />
      </svg>
    ),
  },
] as const;

export function LoginPanel() {
  return (
    <div className="login-card grid w-full max-w-[980px] overflow-hidden rounded-[28px] bg-white md:grid-cols-[1.05fr_0.95fr]">
      {/* Panel marca */}
      <aside className="relative flex min-h-[420px] flex-col justify-between overflow-hidden bg-[linear-gradient(160deg,#4c0dbf_0%,#230c42_100%)] px-8 py-9 text-white sm:px-10 sm:py-10">
        <div
          className="login-glow pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#963cff]/35 blur-3xl"
          aria-hidden
        />
        <div
          className="login-glow pointer-events-none absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-[#c77dff]/25 blur-3xl"
          aria-hidden
        />

        <div className="relative z-10">
          <div className="mb-10 flex items-center gap-3">
            <Image
              src="/img/isotipo.png"
              alt="Isotipo Ventryx"
              width={48}
              height={48}
              className="rounded-xl shadow-lg shadow-black/25"
              priority
            />
            <div className="leading-tight">
              <p className="font-[family-name:var(--font-syne)] text-lg font-bold tracking-wide text-white">
                Ventryx
              </p>
              <p className="text-[0.65rem] font-medium tracking-[0.28em] text-[#ebd5ff]/90">
                SISTEMA DE VENTAS
              </p>
            </div>
          </div>

          <h1 className="font-[family-name:var(--font-syne)] text-[1.85rem] font-bold leading-tight tracking-tight text-white sm:text-[2.05rem]">
            Plataforma de gestión Ventryx
          </h1>
          <p className="mt-3 max-w-sm text-[0.95rem] leading-relaxed text-[#ebd5ff]/95">
            Centraliza ventas, inventario y clientes en un único panel seguro.
          </p>

          <ul className="mt-8 space-y-4">
            {features.map((feature) => (
              <li key={feature.title} className="feature-item flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/12 text-[#ebd5ff]">
                  {feature.icon}
                </span>
                <span className="pt-1 text-sm leading-snug text-white/92">{feature.title}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 mt-10 text-xs text-[#ebd5ff]/70">© 2026 Ventryx · Sistema de Ventas</p>
      </aside>

      {/* Formulario: colores fijos (legible con tema oscuro del sistema) */}
      <section className="login-form-pane flex flex-col px-8 py-9 sm:px-12 sm:py-12">
        <h2 className="mb-9 text-center font-[family-name:var(--font-syne)] text-[1.55rem] font-bold text-[#230c42]">
          Iniciar sesión
        </h2>
        <LoginForm />
      </section>
    </div>
  );
}
