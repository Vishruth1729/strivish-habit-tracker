import { useState } from "react";
import { uid, update, type State } from "@/lib/store";
import { Bar, Panel, Stat } from "./ui";

export function Goals({ s }: { s: State }) {
  const [f, setF] = useState({ name: "", category: "Health", target: "", unit: "", deadline: "" });
  const done = s.goals.filter((g) => g.progress >= g.target);
  const avg = s.goals.length ? s.goals.reduce((a, g) => a + Math.min(1, g.progress / g.target), 0) / s.goals.length : 0;
  const add = () => { if (!f.name.trim()) return; update((st) => ({ ...st, goals: [...st.goals, { id: uid(), name: f.name.trim(), category: f.category, target: Number(f.target) || 100, unit: f.unit, deadline: f.deadline, progress: 0 }] })); setF({ ...f, name: "", target: "", unit: "", deadline: "" }); };
  const setProg = (id: string, p: number) => update((st) => ({ ...st, goals: st.goals.map((g) => g.id === id ? { ...g, progress: Math.max(0, p) } : g) }));
  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-3">
        <Stat label="Active goals" value={s.goals.length - done.length} /><Stat label="Completed" value={done.length} /><Stat label="Average progress" value={`${Math.round(avg * 100)}%`} />
      </div>
      <Panel title="New goal">
        <div className="flex flex-wrap items-end gap-2 p-2.5 text-[10px]">
          <label className="flex-[2] min-w-40"><span className="text-brand-soft">Goal</span><input className="field" placeholder="e.g. Save for a new laptop" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
          <label className="flex-1 min-w-24"><span className="text-brand-soft">Category</span><select className="field" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{["Health", "Fitness", "Learning", "Finance", "Career", "Personal"].map((c) => <option key={c}>{c}</option>)}</select></label>
          <label className="flex-1 min-w-20"><span className="text-brand-soft">Target</span><input type="number" className="field" placeholder="100" value={f.target} onChange={(e) => setF({ ...f, target: e.target.value })} /></label>
          <label className="flex-1 min-w-20"><span className="text-brand-soft">Unit</span><input className="field" placeholder="km, books, pages" value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })} /></label>
          <label className="flex-1 min-w-28"><span className="text-brand-soft">Deadline</span><input type="date" className="field" value={f.deadline} onChange={(e) => setF({ ...f, deadline: e.target.value })} /></label>
          <button className="btn-solid" onClick={add}>Add goal</button>
        </div>
      </Panel>
      {s.goals.length === 0 ? <p className="py-6 text-center text-xs text-brand-soft">No goals yet. Add one above and log progress as you go.</p> :
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{s.goals.map((g) => (
          <div key={g.id} className="stat space-y-2">
            <div className="flex items-start justify-between"><div><div className="stat-label">{g.category}{g.deadline && ` · due ${g.deadline}`}</div><div className="font-bold">{g.name}</div></div>
              <button className="text-muted-foreground hover:text-foreground" onClick={() => update((st) => ({ ...st, goals: st.goals.filter((x) => x.id !== g.id) }))}>×</button></div>
            <Bar pct={Math.min(1, g.progress / g.target)} />
            <div className="flex items-center gap-2 text-xs"><span className="flex-1">{g.progress} / {g.target} {g.unit}</span>
              <button className="btn-ghost px-2" onClick={() => setProg(g.id, g.progress - 1)}>−</button><button className="btn-ghost px-2" onClick={() => setProg(g.id, g.progress + 1)}>+</button></div>
          </div>))}</div>}
    </div>
  );
}
