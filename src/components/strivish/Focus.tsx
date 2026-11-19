import { useEffect, useRef, useState } from "react";
import { addDays, dkey, update, type State } from "@/lib/store";
import { LineChart, Panel, Stat } from "./ui";

type Mode = "focus" | "short" | "long";
const LBL: Record<Mode, string> = { focus: "Focus", short: "Short break", long: "Long break" };
export function Focus({ s, today }: { s: State; today: Date }) {
  const [mode, setMode] = useState<Mode>("focus");
  const [left, setLeft] = useState(s.lengths.focus * 60);
  const [run, setRun] = useState(false);
  const [label, setLabel] = useState("");
  const total = s.lengths[mode] * 60;
  const ref = useRef({ mode, label, total }); ref.current = { mode, label, total };
  useEffect(() => { if (!run) setLeft(s.lengths[mode] * 60); }, [mode, s.lengths]); // eslint-disable-line
  useEffect(() => {
    if (!run) return;
    const t = setInterval(() => setLeft((l) => {
      if (l <= 1) { setRun(false); const r = ref.current;
        if (r.mode === "focus") update((st) => ({ ...st, sessions: [...st.sessions, { date: dkey(new Date()), minutes: Math.round(r.total / 60), label: r.label }] }));
        return r.total; }
      return l - 1; }), 1000);
    return () => clearInterval(t);
  }, [run]);
  const tk = dkey(today);
  const todayS = s.sessions.filter((x) => x.date === tk);
  const all = s.sessions.reduce((a, x) => a + x.minutes, 0);
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  const vals = days.map((d) => s.sessions.filter((x) => x.date === dkey(d)).reduce((a, x) => a + x.minutes, 0));
  const r = 76, c = 2 * Math.PI * r;
  const setLen = (k: Mode, v: string) => update((st) => ({ ...st, lengths: { ...st.lengths, [k]: Math.max(1, Math.min(180, Number(v) || 1)) } }));
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Panel title="Focus timer"><div className="flex flex-col items-center gap-3 p-4 pb-10">
        <div className="flex rounded-md border border-border p-0.5 text-xs">{(Object.keys(LBL) as Mode[]).map((m) => <button key={m} onClick={() => { setRun(false); setMode(m); }} className={`rounded px-2.5 py-1 ${mode === m ? "bg-foreground text-background" : ""}`}>{LBL[m]}</button>)}</div>
        <div className="relative h-44 w-44"><svg viewBox="0 0 170 170" className="-rotate-90"><circle cx={85} cy={85} r={r} fill="none" className="stroke-muted" strokeWidth={7} /><circle cx={85} cy={85} r={r} fill="none" className="stroke-foreground" strokeWidth={7} strokeDasharray={c} strokeDashoffset={c * (1 - left / total)} /></svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="font-display text-3xl font-bold">{String(Math.floor(left / 60)).padStart(2, "0")}:{String(left % 60).padStart(2, "0")}</span><span className="text-[10px] text-muted-foreground">{LBL[mode]}</span></div></div>
        <div className="flex gap-2"><button className="btn-solid" onClick={() => setRun(!run)}>{run ? "Pause" : "Start"}</button><button className="btn-ghost" onClick={() => { setRun(false); setLeft(total); }}>Reset</button></div>
        <input className="field max-w-56" placeholder="What are you working on?" value={label} onChange={(e) => setLabel(e.target.value)} />
      </div></Panel>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2"><Stat label="Today" value={`${todayS.reduce((a, x) => a + x.minutes, 0)} min`} sub={`${todayS.length} sessions`} /><Stat label="All time" value={`${(all / 60).toFixed(all % 60 ? 1 : 0)} h`} /></div>
        <Panel title="Focus minutes, last 7 days"><div className="p-2"><LineChart height={170} max={Math.max(60, ...vals)} ticks={[0, 15, 30, 45, 60]} values={vals} labels={days.map((d) => d.toLocaleDateString("en", { weekday: "short" }))} highlight={6} /></div></Panel>
        <Panel title="Lengths (minutes)"><div className="grid grid-cols-3 gap-2 p-2 text-[10px]">{(Object.keys(LBL) as Mode[]).map((m) => <label key={m}><span className="text-muted-foreground">{LBL[m]}</span><input type="number" className="field" value={s.lengths[m]} onChange={(e) => setLen(m, e.target.value)} /></label>)}</div></Panel>
      </div>
    </div>
  );
}
