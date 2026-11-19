import type { ReactNode } from "react";

export function Panel({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-head">{title}</div>
      {children}
    </section>
  );
}
export function Stat({ label, value, sub, children }: { label: string; value: ReactNode; sub?: string; children?: ReactNode }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
      {children}
    </div>
  );
}
export function Bar({ pct }: { pct: number }) {
  return <div className="bar"><div className="bar-fill" style={{ width: `${Math.round(pct * 100)}%` }} /></div>;
}
export function Ring({ pct, size = 60, stroke = 7, children }: { pct: number; size?: number; stroke?: number; children?: ReactNode }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" className="stroke-muted" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" className="stroke-foreground transition-all" strokeWidth={stroke} strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children ?? <span className="text-sm font-bold">{Math.round(pct * 100)}%</span>}</div>
    </div>
  );
}
export function LineChart({ values, labels, max = 100, ticks = [0, 25, 50, 75, 100], highlight, height = 200, every = 1 }: { values: (number | null)[]; labels: string[]; max?: number; ticks?: number[]; highlight?: number; height?: number; every?: number }) {
  const W = 600, H = height, pl = 28, pb = 18, pt = 8, pr = 8;
  const x = (i: number) => pl + (values.length <= 1 ? 0 : (i * (W - pl - pr)) / (values.length - 1));
  const y = (v: number) => pt + (H - pt - pb) * (1 - v / max);
  const pts = values.map((v, i) => (v == null ? null : `${x(i)},${y(v)}`)).filter(Boolean);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      {ticks.map((t) => (
        <g key={t}><line x1={pl} x2={W - pr} y1={y(t)} y2={y(t)} className="stroke-border" strokeWidth={1} />
          <text x={pl - 6} y={y(t) + 3} textAnchor="end" className="fill-muted-foreground" fontSize={8}>{t}</text></g>
      ))}
      {pts.length > 1 && <polyline points={pts.join(" ")} fill="none" className="stroke-brand" strokeWidth={2} />}
      {values.map((v, i) => v != null && v > 0 && <circle key={i} cx={x(i)} cy={y(v)} r={3} className="fill-brand" />)}
      {labels.map((l, i) => i % every === 0 && (
        <text key={i} x={x(i)} y={H - 4} textAnchor="middle" fontSize={8} className={i === highlight ? "fill-foreground font-bold" : "fill-muted-foreground"}>{l}</text>
      ))}
    </svg>
  );
}
export function Check({ checked, onChange, dim, size = "md", disabled }: { checked: boolean; onChange: () => void; dim?: boolean; size?: "sm" | "md"; disabled?: boolean }) {
  return (
    <button type="button" aria-pressed={checked} onClick={onChange} disabled={disabled}
      className={`check ${size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} ${checked ? "check-on" : ""} ${dim && !checked ? "opacity-40" : ""} ${disabled ? "cursor-not-allowed" : ""}`}>
      {checked && <svg viewBox="0 0 12 12" className="h-full w-full"><path d="M2.5 6.5l2.2 2L9.5 3.5" fill="none" stroke="currentColor" strokeWidth={2} /></svg>}
    </button>
  );
}

export function BarChart({ values, labels, max = 100, ticks = [0, 25, 50, 75, 100], highlight, height = 200, every = 1, showValues = true, width = 600 }: { width?: number; values: (number | null)[]; labels: string[]; max?: number; ticks?: number[]; highlight?: number; height?: number; every?: number; showValues?: boolean }) {
  const W = width, H = height, pl = 28, pb = 18, pt = 14, pr = 8;
  const slot = (W - pl - pr) / values.length, bw = slot * 0.62;
  const y = (v: number) => pt + (H - pt - pb) * (1 - Math.min(v, max) / max);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      {ticks.map((t) => (
        <g key={t}><line x1={pl} x2={W - pr} y1={y(t)} y2={y(t)} className="stroke-border" strokeWidth={1} />
          <text x={pl - 6} y={y(t) + 3} textAnchor="end" className="fill-muted-foreground" fontSize={8}>{t}</text></g>
      ))}
      {values.map((v, i) => {
        const cx = pl + slot * i + slot / 2;
        return (
          <g key={i}>
            {v != null && v > 0 && <>
              <rect x={cx - bw / 2} y={y(v)} width={bw} height={y(0) - y(v)} rx={1.5} className={i === highlight ? "fill-brand" : "fill-foreground"} />
              {showValues && <text x={cx} y={y(v) - 3} textAnchor="middle" fontSize={8} className="fill-foreground font-bold">{Math.round(v)}</text>}
            </>}
            {i % every === 0 && <text x={cx} y={H - 4} textAnchor="middle" fontSize={8} className={i === highlight ? "fill-foreground font-bold" : "fill-muted-foreground"}>{labels[i]}</text>}
          </g>
        );
      })}
    </svg>
  );
}
