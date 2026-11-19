import { useState } from "react";
import { dayRate, dkey, isChecked, toggleCheck, update, type State } from "@/lib/store";
import { Bar, Check, LineChart, Panel, Stat } from "./ui";

const MN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const L = ["S", "M", "T", "W", "T", "F", "S"];

export function Month({ s, today, onEditHabits }: { s: State; today: Date; onEditHabits: () => void }) {
  const [off, setOff] = useState(0);
  const base = new Date(today.getFullYear(), today.getMonth() + off, 1);
  const n = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: n }, (_, i) => new Date(base.getFullYear(), base.getMonth(), i + 1));
  const tk = dkey(today);
  const elapsed = days.filter((d) => dkey(d) <= tk).length;
  const goal = s.habits.length * elapsed;
  const completed = days.filter((d) => dkey(d) <= tk).reduce((a, d) => a + (s.checks[dkey(d)] || []).length, 0);
  const hStats = s.habits.map((h) => { const c = days.filter((d) => dkey(d) <= tk && isChecked(s, dkey(d), h.id)).length; return { h, c, pct: elapsed ? c / elapsed : 0 }; });
  const top = [...hStats].sort((a, b) => b.pct - a.pct);
  const setDaily = (k: string, f: "mood" | "sleep", v: string) => update((st) => ({ ...st, daily: { ...st.daily, [k]: { ...st.daily[k], [f]: v === "" ? undefined : Number(v) } } }));
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button className="btn-ghost px-2" onClick={() => setOff(off - 1)}>‹</button>
        <div><div className="stat-label">Month</div><div className="text-sm font-bold">{MN[base.getMonth()]} {base.getFullYear()}</div></div>
        <button className="btn-ghost px-2" onClick={() => setOff(off + 1)}>›</button>
        <button className="btn-ghost" onClick={() => setOff(0)}>This month</button>
        <button className="btn-ghost ml-auto" onClick={onEditHabits}>Edit habits</button>
      </div>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Stat label="Goal to date" value={goal} sub={`${s.habits.length} habits × ${elapsed} days`} />
        <Stat label="Completed" value={completed} />
        <Stat label="Left" value={goal - completed} />
        <Stat label="Completion" value={`${goal ? Math.round((completed / goal) * 100) : 0}%`} />
      </div>
      <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr]">
        <Panel title="Daily progress"><div className="p-2"><LineChart height={240} values={days.map((d) => (dkey(d) <= tk ? dayRate(s, dkey(d)) * 100 : null))} labels={days.map((d) => String(d.getDate()))} every={2} highlight={days.findIndex((d) => dkey(d) === tk)} /></div></Panel>
        <Panel title="Top habits"><div className="space-y-2 p-3">{top.map((t, i) => (
          <div key={t.h.id} className="flex items-center gap-3 text-xs"><span className="w-3 text-muted-foreground">{i + 1}</span><div className="flex-1"><div className="mb-1 font-semibold">{t.h.name}</div><Bar pct={t.pct} /></div><span className="w-8 text-right font-bold">{Math.round(t.pct * 100)}%</span></div>
        ))}</div></Panel>
      </div>
      <Panel title="Habit grid">
        <div className="overflow-x-auto"><table className="w-full text-[10px]">
          <thead><tr className="border-b border-border"><th className="p-1.5 text-left text-brand-soft">My habits</th>
            {days.map((d) => <th key={d.getDate()} className={`w-5 ${dkey(d) === tk ? "bg-muted" : ""}`}>{d.getDate()}<div className="font-normal text-muted-foreground">{L[d.getDay()]}</div></th>)}
            <th className="px-1">Goal</th><th className="px-1">Done</th><th className="px-1">Left</th><th className="w-20">Progress</th><th className="px-1">%</th></tr></thead>
          <tbody>
            {hStats.map(({ h, c, pct }) => (<tr key={h.id} className="border-b border-border">
              <td className="whitespace-nowrap p-1.5 font-semibold">{h.name}</td>
              {days.map((d) => <td key={d.getDate()} className={`text-center ${dkey(d) === tk ? "bg-muted" : ""}`}><Check size="sm" checked={isChecked(s, dkey(d), h.id)} dim={dkey(d) > tk} onChange={() => toggleCheck(dkey(d), h.id)} /></td>)}
              <td className="text-center font-bold">{elapsed}</td><td className="text-center">{c}</td><td className="text-center">{elapsed - c}</td><td className="px-1"><Bar pct={pct} /></td><td className="text-center font-bold">{Math.round(pct * 100)}%</td>
            </tr>))}
            <tr className="bg-muted"><td className="p-1.5 font-bold" colSpan={n + 6}>Daily check-in</td></tr>
            {(["mood", "sleep"] as const).map((f) => (<tr key={f} className="border-b border-border">
              <td className="whitespace-nowrap p-1.5 font-semibold">{f === "mood" ? "Mood (1 to 5)" : "Hours of sleep"}</td>
              {days.map((d) => <td key={d.getDate()} className="p-px"><input type="number" min={f === "mood" ? 1 : 0} max={f === "mood" ? 5 : 24} className="cell" value={s.daily[dkey(d)]?.[f] ?? ""} onChange={(e) => setDaily(dkey(d), f, e.target.value)} /></td>)}
              <td colSpan={5} />
            </tr>))}
          </tbody>
        </table></div>
      </Panel>
    </div>
  );
}
