"use client";

export type ChartPoint = { label: string; value: number };
export type ChartSlice = { label: string; value: number; color: string };

function money(n: number) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function arcPath(cx: number, cy: number, r: number, start: number, end: number) {
  const s = polar(cx, cy, r, end);
  const e = polar(cx, cy, r, start);
  const large = end - start <= 180 ? 0 : 1;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 0 ${e.x} ${e.y}`;
}

export function LineChart({
  points,
  height = 200,
  color = "#714B67",
}: {
  points: ChartPoint[];
  height?: number;
  color?: string;
}) {
  const pad = { t: 16, r: 12, b: 36, l: 44 };
  const width = Math.max(points.length * 48, 320);
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const max = Math.max(...points.map((p) => p.value), 1);
  const coords = points.map((p, i) => {
    const x = pad.l + (points.length <= 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
    const y = pad.t + innerH - (p.value / max) * innerH;
    return { ...p, x, y };
  });
  const line = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  const area =
    coords.length > 0
      ? `${line} L ${coords[coords.length - 1].x} ${pad.t + innerH} L ${coords[0].x} ${pad.t + innerH} Z`
      : "";

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-full" role="img" aria-label="Gráfico lineal">
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = pad.t + innerH * (1 - t);
          return (
            <g key={t}>
              <line
                x1={pad.l}
                x2={width - pad.r}
                y1={y}
                y2={y}
                stroke="var(--borde)"
                strokeDasharray="3 4"
              />
              <text x={pad.l - 8} y={y + 3} textAnchor="end" className="fill-[var(--texto-suave)]" fontSize="10">
                {money(max * t)}
              </text>
            </g>
          );
        })}
        {area ? <path d={area} fill={color} opacity="0.12" /> : null}
        {line ? <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" /> : null}
        {coords.map((c) => (
          <g key={c.label}>
            <circle cx={c.x} cy={c.y} r="4" fill={color} stroke="var(--blanco)" strokeWidth="2" />
            <title>{`${c.label}: ${money(c.value)}`}</title>
            <text
              x={c.x}
              y={height - 10}
              textAnchor="middle"
              className="fill-[var(--texto-suave)]"
              fontSize="10"
            >
              {c.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export function BarChart({
  points,
  height = 200,
  color = "#963cff",
}: {
  points: ChartPoint[];
  height?: number;
  color?: string;
}) {
  const pad = { t: 16, r: 12, b: 40, l: 44 };
  const barGap = 10;
  const width = Math.max(points.length * 56, 280);
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const max = Math.max(...points.map((p) => p.value), 1);
  const barW = points.length ? Math.max(12, (innerW - barGap * (points.length - 1)) / points.length) : 0;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-full" role="img" aria-label="Gráfico de barras">
        {[0, 0.5, 1].map((t) => {
          const y = pad.t + innerH * (1 - t);
          return (
            <g key={t}>
              <line
                x1={pad.l}
                x2={width - pad.r}
                y1={y}
                y2={y}
                stroke="var(--borde)"
                strokeDasharray="3 4"
              />
              <text x={pad.l - 8} y={y + 3} textAnchor="end" className="fill-[var(--texto-suave)]" fontSize="10">
                {Number.isInteger(max * t) ? String(Math.round(max * t)) : (max * t).toFixed(0)}
              </text>
            </g>
          );
        })}
        {points.map((p, i) => {
          const h = (p.value / max) * innerH;
          const x = pad.l + i * (barW + barGap);
          const y = pad.t + innerH - h;
          return (
            <g key={p.label}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={Math.max(h, 2)}
                rx="6"
                fill={color}
                opacity={0.9}
              >
                <title>{`${p.label}: ${p.value}`}</title>
              </rect>
              <text
                x={x + barW / 2}
                y={height - 12}
                textAnchor="middle"
                className="fill-[var(--texto-suave)]"
                fontSize="10"
              >
                {p.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function DonutChart({
  slices,
  centerLabel,
  centerValue,
  size = 160,
}: {
  slices: ChartSlice[];
  centerLabel: string;
  centerValue: string;
  size?: number;
}) {
  const total = slices.reduce((acc, s) => acc + Math.max(0, s.value), 0);
  const stroke = 22;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  let angle = 0;
  const paths =
    total <= 0
      ? [{ d: arcPath(cx, cy, r, 0, 359.9), color: "var(--borde)", key: "empty" }]
      : slices
          .filter((s) => s.value > 0)
          .map((s) => {
            const sweep = (s.value / total) * 360;
            const start = angle;
            const end = angle + Math.max(sweep, 0.8);
            angle = end;
            return {
              d: arcPath(cx, cy, r, start, Math.min(end, start + 359.9)),
              color: s.color,
              key: s.label,
            };
          });

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--borde)" strokeWidth={stroke} />
          {paths.map((p) => (
            <path
              key={p.key}
              d={p.d}
              fill="none"
              stroke={p.color}
              strokeWidth={stroke}
              strokeLinecap="round"
            />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-3 text-center">
          <p className="text-[0.65rem] font-medium uppercase tracking-wide text-texto-suave">
            {centerLabel}
          </p>
          <p className="mt-0.5 text-sm font-bold text-noche">{centerValue}</p>
        </div>
      </div>
      <ul className="w-full space-y-2.5 sm:max-w-[200px]">
        {slices.map((s) => {
          const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
          return (
            <li key={s.label} className="flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2 text-texto-suave">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                {s.label}
              </span>
              <span className="font-semibold text-noche">
                {s.value} · {pct}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function HBarChart({
  items,
}: {
  items: { label: string; value: number; display: string; color?: string }[];
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-texto-suave">Sin datos</p>
      ) : (
        items.map((item) => (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between gap-2 text-xs">
              <span className="truncate font-medium text-texto-suave">{item.label}</span>
              <span className="shrink-0 font-semibold text-noche">{item.display}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[var(--muted)]">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.max(4, (item.value / max) * 100)}%`,
                  background: item.color || "#714B67",
                }}
              />
            </div>
          </div>
        ))
      )}
    </div>
  );
}
