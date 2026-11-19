import { useState } from "react";
import { addDays, dayRate, dkey, isChecked, startOfWeek, toggleCheck, uid, update, type State } from "@/lib/store";
import { Bar, Check, LineChart, Panel, Ring } from "./ui";

const DN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const FULL = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function Week({ s, today, onEditHabits }: { s: State; today: Date; onEditHabits: () => void }) {
  const [off, setOff] = useState(0);
  const start = addDays(startOfWeek(today), off * 7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const tk = dkey(today);
  const wk = dkey(start);
  const meta = s.weekMeta[wk] || { focus: "", reward: "", affirmation: "" };
  const setMeta = (k: keyof typeof meta, v: string) => update((st) => ({ ...st, weekMeta: { ...st.weekMeta, [wk]: { ...meta, [k]: v } } }));
  const total = s.habits.length * 7;
  const done = days.reduce((a, d) => a + Math.round(dayRate(s, dkey(d)) * s.habits.length), 0);
  const fmt = (d: Date) => `${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}`;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex items-center gap-2">
          <button className="btn-ghost px-2" onClick={() => setOff(off - 1)}>‹</button>
          <div><div className="stat-label">Week of</div><div className="text-sm font-bold">{`${start.getDate()} ${MON[start.getMonth()]} – ${fmt(days[6]!)}`}</div></div>
          <button className="btn-ghost px-2" onClick={() => setOff(off + 1)}>›</button>
          <button className="btn-ghost" onClick={() => setOff(0)}>This week</button>
        </div>
        <div className="ml-auto grid flex-1 grid-cols-3 gap-2 min-w-[420px] max-w-[650px]">
          {([["focus", "Weekly focus", "What matters most this week"], ["reward", "Reward", "Treat for finishing"], ["affirmation", "Affirmation", "A line to repeat"]] as const).map(([k, l, p]) => (
            <div key={k}><span className="tag">{l}</span><input className="field text-center" placeholder={p} value={meta[k]} onChange={(e) => setMeta(k, e.target.value)} /></div>
          ))}
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr]">
        <Panel title="Habit tracker">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-border">
              <th className="p-1.5 text-left">Habit</th>
              {days.map((d, i) => <th key={i} className={`w-9 text-center ${dkey(d) === tk ? "bg-muted" : ""}`}>{DN[i]}<div className="text-[9px] font-normal text-muted-foreground">{d.getDate()}</div></th>)}
              <th className="w-40">Progress</th>
            </tr></thead>
            <tbody>{s.habits.map((h) => {
              const c = days.filter((d) => isChecked(s, dkey(d), h.id)).length;
              return (<tr key={h.id} className="border-b border-border">
                <td className="p-1.5 font-semibold">{h.name}</td>
                {days.map((d, i) => <td key={i} className={`text-center py-2 ${dkey(d) === tk ? "bg-muted" : ""}`}><Check checked={isChecked(s, dkey(d), h.id)} dim={dkey(d) > tk} onChange={() => toggleCheck(dkey(d), h.id)} /></td>)}
                <td className="px-2"><div className="flex items-center gap-2"><Bar pct={c / 7} /><span className="w-8 text-right font-bold">{Math.round((c / 7) * 100)}%</span></div></td>
              </tr>);
            })}</tbody>
          </table>
          <div className="flex items-center gap-3 p-2 text-xs text-muted-foreground">
            <button className="btn-ghost" onClick={onEditHabits}>Edit habits</button>
            Tick a box to log a habit. Boxes after today are dimmed but you can plan ahead.
          </div>
        </Panel>
        <Panel title="Overall progress" className="self-start">
          <div className="flex items-center gap-2 p-2">
            <div className="flex-1"><LineChart values={days.map((d) => (dkey(d) <= tk ? dayRate(s, dkey(d)) * 100 : null))} labels={DN} highlight={days.findIndex((d) => dkey(d) === tk)} /></div>
            <div className="flex flex-col items-center gap-2 px-2"><Ring pct={total ? done / total : 0} size={72} stroke={8}><span className="font-bold">{Math.round(total ? (done / total) * 100 : 0)}%</span></Ring><span className="text-xs text-muted-foreground">{done} / {total} done</span></div>
          </div>
        </Panel>
      </div>
      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {days.map((d, i) => <DayCard key={i} s={s} d={d} name={FULL[i]!} isToday={dkey(d) === tk} />)}
      </div>
    </div>
  );
}

function DayCard({ s, d, name, isToday }: { s: State; d: Date; name: string; isToday: boolean }) {
  const k = dkey(d);
  const [text, setText] = useState("");
  const tasks = s.tasks[k] || [];
  const hd = (s.checks[k] || []).length;
  const td = tasks.filter((t) => t.done).length;
  const tot = s.habits.length + tasks.length;
  const pct = tot ? (hd + td) / tot : 0;
  const setTasks = (t: typeof tasks) => update((st) => ({ ...st, tasks: { ...st.tasks, [k]: t } }));
  const add = () => { if (!text.trim()) return; setTasks([...tasks, { id: uid(), text: text.trim(), done: false }]); setText(""); };
  return (
    <div className={`panel ${isToday ? "ring-1 ring-foreground" : ""}`}>
      <div className="panel-head leading-tight">{name}<div className="text-[10px]">{`${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`}</div></div>
      <div className="flex flex-col items-center gap-1 p-3"><Ring pct={pct} /><div className="text-[10px] text-muted-foreground">Habits {hd}/{s.habits.length} · Tasks {td}/{tasks.length}</div></div>
      <div className="space-y-1 px-2">{tasks.map((t) => (
        <div key={t.id} className="flex items-center gap-2 text-xs">
          <Check checked={t.done} onChange={() => setTasks(tasks.map((x) => x.id === t.id ? { ...x, done: !x.done } : x))} />
          <span className={`flex-1 truncate ${t.done ? "line-through text-muted-foreground" : ""}`}>{t.text}</span>
          <button className="text-muted-foreground hover:text-foreground" onClick={() => setTasks(tasks.filter((x) => x.id !== t.id))}>×</button>
        </div>))}
      </div>
      <div className="flex gap-1 p-2"><input className="field" placeholder="Add a task" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} /><button className="btn-solid" onClick={add}>Add</button></div>
      <div className="flex border-t border-border px-2 py-1 text-[10px] font-bold"><span className="flex-1">Done {hd + td}</span><span className="flex-1">Left {tot - hd - td}</span></div>
    </div>
  );
}
