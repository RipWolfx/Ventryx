/** Clases semánticas (claro/oscuro) para formularios y tablas del panel. */
export const ui = {
  pageTitle: "text-xl font-bold text-noche",
  pageSub: "mt-1 text-sm text-texto-suave",
  card: "rounded-[18px] border border-borde bg-blanco shadow-sm",
  cardPad: "rounded-[18px] border border-borde bg-blanco p-5 shadow-sm md:p-6",
  field:
    "w-full rounded-[16px] border border-borde bg-[var(--muted)] px-4 py-2.5 text-sm text-noche outline-none transition placeholder:text-texto-suave focus:border-lavanda focus:bg-blanco focus:ring-2 focus:ring-[color-mix(in_srgb,var(--lavanda)_28%,transparent)]",
  fieldLg:
    "w-full rounded-[18px] border border-borde bg-[var(--muted)] px-4 py-3 text-sm text-noche outline-none transition placeholder:text-texto-suave focus:border-lavanda focus:bg-blanco focus:ring-2 focus:ring-[color-mix(in_srgb,var(--lavanda)_28%,transparent)]",
  label: "mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-texto-suave",
  muted: "text-texto-suave",
  strong: "font-semibold text-noche",
  body: "text-sm text-noche",
  bodyMuted: "text-sm text-texto-suave",
  th: "px-3 py-3 font-medium text-texto-suave",
  td: "text-noche",
  tdMuted: "text-texto-suave",
  rowBorder: "border-t border-borde",
  search:
    "min-w-[180px] flex-1 rounded-[14px] border border-borde bg-[var(--muted)] px-3.5 py-2.5 text-sm text-noche outline-none placeholder:text-texto-suave focus:border-lavanda focus:bg-blanco focus:ring-2 focus:ring-[color-mix(in_srgb,var(--lavanda)_28%,transparent)] sm:flex-none",
  btnPrimary:
    "inline-flex items-center gap-2 rounded-[14px] bg-[#6d28d9] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5b21b6]",
  btnGhost:
    "inline-flex h-9 w-9 items-center justify-center rounded-[12px] text-texto-suave transition hover:bg-[var(--hover)] hover:text-noche",
  btnDanger:
    "inline-flex h-9 w-9 items-center justify-center rounded-[12px] text-texto-suave transition hover:bg-[color-mix(in_srgb,#b91c1c_18%,var(--blanco))] hover:text-[#f87171]",
  badgeOn:
    "rounded-full bg-[color-mix(in_srgb,#047857_18%,var(--blanco))] px-2.5 py-1 text-xs font-semibold text-[#047857] dark:text-[#6ee7b7]",
  badgeOff:
    "rounded-full bg-[color-mix(in_srgb,#b91c1c_18%,var(--blanco))] px-2.5 py-1 text-xs font-semibold text-[#b91c1c] dark:text-[#fca5a5]",
  badgeWarn:
    "rounded-full bg-[color-mix(in_srgb,#c2410c_18%,var(--blanco))] px-2.5 py-1 text-xs font-semibold text-[#c2410c] dark:text-[#fdba74]",
  avatar:
    "inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--hover)] text-xs font-bold text-ventryx",
  modal:
    "relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-[18px] border border-borde bg-blanco shadow-[var(--sombra-menu)]",
  modalFooter:
    "flex shrink-0 items-center justify-end gap-3 border-t border-borde bg-[var(--muted)] px-5 py-4",
  overlay: "absolute inset-0 bg-black/55 backdrop-blur-[2px]",
  headerBorder: "border-b border-borde",
};
