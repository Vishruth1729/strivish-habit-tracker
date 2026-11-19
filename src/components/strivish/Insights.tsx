import { addDays, dayRate, dkey, isChecked, levelOf, startOfWeek, streaks, xp, type State } from "@/lib/store";
import { Bar, LineChart, Panel, Stat } from "./ui";

const DN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export function Insights({ s, today }: { s: State; today: Date }) {
  const X = xp(s); const lv = levelOf(X); const tk = dkey(today);
  const overall = streaks(s, today, (d) => dayRate(s, d) >= 0.7);
  const last30 = Array.from({ length: 30 }, (_, i) => dkey(addDays(today, -i)));
  const rate30 = last30.reduce((a, d) => a + dayRate(s, d), 0) / 30;
  const perfect = Object.keys(s.checks).filter((d) => dayRate(s, d) === 1).length;
  const moods = last30.map((d) => s.daily[d]?.mood).filter((v): v is number => v != null);
  const sleeps = last30.map((d) => s.daily[d]?.sleep).filter((v): v is number => v != null);
  const avg = (a: number[]) => (a.length ? (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1) : "-");
  const start = addDays(startOfWeek(today), -19 * 7);
  const wd = DN.map((_, i) => { const ds = Object.keys(s.checks).filter((d) => { const [y, m, dd] = d.split("-").map(Number); return (new Date(y!, m! - 1, dd!).getDay() + 6) % 7 === i; }); return ds.length ? (ds.reduce((a, d) => a + dayRate(s, d), 0) / ds.length) * 100 : 0; });
  const ticks = Object.values(s.checks).reduce((a, c) => a + c.length, 0);
  const tasks = Object.values(s.tasks).flat().filter((t) => t.done).length;
  const focus = s.sessions.reduce((a, x) => a + x.minutes, 0);
  const badges = [
    ["1", "First tick", "Log any habit", ticks >= 1], ["3", "Warm-up", "3-day streak", overall.best >= 3], ["7", "Full week", "7-day streak", overall.best >= 7],
    ["30", "Locked in", "30-day streak", overall.best >= 30], ["P", "Perfect day", "Tick every habit", perfect >= 1], ["100", "Century", "100 habit ticks", ticks >= 100],
    ["25", "Task machine", "25 tasks done", tasks >= 25], ["F", "Deep focus", "120 focus minutes", focus >= 120], ["G", "Goal getter", "Complete a goal", s.goals.some((g) => g.progress >= g.target)],
  ] as const;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-6">
        <Stat label="Level" value={lv.lvl} sub={`${X} XP`}><div className="mt-2"><Bar pct={lv.rest / lv.need} /></div><div className="stat-sub mt-1">{lv.need - lv.rest} XP to level {lv.lvl + 1}</div></Stat>
        <Stat label="Current streak" value={overall.cur} sub="days at 70% or more" />
        <Stat label="Best streak" value={overall.best} sub="days" />
        <Stat label="30-day rate" value={`${Math.round(rate30 * 100)}%`} sub="of habits done" />
        <Stat label="Perfect days" value={perfect} sub="every habit ticked" />
        <Stat label="Avg mood / sleep" value={`${avg(moods)} / ${avg(sleeps)}`} sub="last 30 days" />
      </div>
      <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr]">
        <Panel title="Last 20 weeks"><div className="p-2">
          <div className="grid grid-flow-col grid-rows-7 gap-1">{Array.from({ length: 140 }, (_, i) => { const d = addDays(start, i); const k = dkey(d); const r = dayRate(s, k);
            return <div key={i} title={k} className={`aspect-square rounded-sm ${k > tk ? "opacity-0" : ""} ${r === 0 ? "bg-muted" : r < 0.4 ? "bg-heat-1" : r < 0.7 ? "bg-heat-2" : r < 1 ? "bg-heat-3" : "bg-foreground"}`} />; })}</div>
          <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">Less <span className="h-2.5 w-2.5 bg-muted" /><span className="h-2.5 w-2.5 bg-heat-1" /><span className="h-2.5 w-2.5 bg-heat-2" /><span className="h-2.5 w-2.5 bg-heat-3" /><span className="h-2.5 w-2.5 bg-foreground" /> More</div>
        </div></Panel>
        <Panel title="Best weekday" className="self-start"><div className="p-2"><LineChart height={140} values={wd} labels={DN} highlight={wd.indexOf(Math.max(...wd))} />
          <p className="text-xs text-muted-foreground">{ticks ? `Your strongest day is ${DN[wd.indexOf(Math.max(...wd))]}.` : "Log a few days to see your pattern."}</p></div></Panel>
      </div>
      <Panel title="Habit streaks">
        <table className="w-full text-xs"><thead><tr className="border-b border-border text-left text-[10px] tracking-wider text-muted-foreground"><th className="p-2">HABIT</th><th>CURRENT</th><th>BEST</th><th>LAST 30 DAYS</th></tr></thead>
          <tbody>{s.habits.map((h) => { const st = streaks(s, today, (d) => isChecked(s, d, h.id)); const r = last30.filter((d) => isChecked(s, d, h.id)).length / 30;
            return <tr key={h.id} className="border-b border-border"><td className="p-2 font-semibold">{h.name}</td><td>{st.cur} d</td><td>{st.best} d</td><td className="w-1/3 pr-2"><div className="flex items-center gap-2"><Bar pct={r} /><span className="w-8 text-right font-bold">{Math.round(r * 100)}%</span></div></td></tr>; })}</tbody></table>
      </Panel>
      <Panel title="Badges"><div className="grid gap-2 p-2 sm:grid-cols-3 lg:grid-cols-6">{badges.map(([ic, n, d, on]) => (
        <div key={n} className={`flex items-center gap-2 rounded-md border border-border p-2 ${on ? "" : "opacity-50"}`}>
          <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ${on ? "bg-brand text-primary-foreground" : "bg-muted"}`}>{ic}</span>
          <div><div className="text-xs font-bold">{n}</div><div className="text-[10px] text-muted-foreground">{d}{on ? "" : " (locked)"}</div></div>
        </div>))}</div></Panel>
      <p className="text-[10px] text-brand-soft">XP: 10 per habit tick, 5 per task, 100 per completed goal, 1 per focus minute.</p>
    </div>
  );
}
