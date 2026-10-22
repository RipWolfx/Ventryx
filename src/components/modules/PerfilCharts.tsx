"use client";

type Slice = { label: string; value: number; color: string };

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

export function DonutChart({
  slices,
  centerLabel,
  centerValue,
  size = 168,
}: {
  slices: Slice[];
  centerLabel: string;
  centerValue: string;
  size?: number;
}) {
  const total = slices.reduce((acc, s) => acc + Math.max(0, s.value), 0);
  const stroke = 20;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;

  let angle = 0;
  const paths =
    total <= 0
      ? [{ d: arcPath(cx, cy, r, 0, 359.9), color: "#e8e6e1", key: "empty" }]
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
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-between">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#efece6" strokeWidth={stroke} />
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
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          <p className="text-[0.65rem] font-medium uppercase tracking-wide text-[#8a8680]">
            {centerLabel}
          </p>
          <p className="mt-0.5 text-base font-bold text-[#1c1b19]">{centerValue}</p>
        </div>
      </div>

      <ul className="w-full space-y-3 sm:max-w-[190px]">
        {slices.map((s) => {
          const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
          return (
            <li key={s.label} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 text-[#5c5852]">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                {s.label}
              </span>
              <span className="font-semibold text-[#1c1b19]">{pct}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function BarCompare({
  items,
}: {
  items: { label: string; value: number; color: string; display: string }[];
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="space-y-3.5">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-medium text-[#5c5852]">{item.label}</span>
            <span className="font-semibold text-[#1c1b19]">{item.display}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-[12px] bg-[#efece6]">
            <div
              className="h-full rounded-[12px] transition-all duration-500"
              style={{
                width: `${Math.max(5, (item.value / max) * 100)}%`,
                background: item.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
