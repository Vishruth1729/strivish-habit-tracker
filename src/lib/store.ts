import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Habit = { id: string; name: string };
export type Task = { id: string; text: string; done: boolean };
export type Goal = { id: string; name: string; category: string; target: number; unit: string; deadline: string; progress: number };
export type Session = { date: string; minutes: number; label: string };
export type State = {
  habits: Habit[];
  checks: Record<string, string[]>;
  tasks: Record<string, Task[]>;
  weekMeta: Record<string, { focus: string; reward: string; affirmation: string }>;
  daily: Record<string, { mood?: number; sleep?: number }>;
  goals: Goal[];
  sessions: Session[];
  lengths: { focus: number; short: number; long: number };
};

const KEY = "strivish2-state";
export const uid = () => Math.random().toString(36).slice(2, 10);
const defaults = (): State => ({
  habits: ["Wake up at 6:30", "Drink 2 L of water", "Workout", "Read 10 pages", "Study 2 hours", "Meditate 10 min", "No junk food", "Plan tomorrow"].map((name) => ({ id: uid(), name })),
  checks: {}, tasks: {}, weekMeta: {}, daily: {}, goals: [], sessions: [],
  lengths: { focus: 25, short: 5, long: 15 },
});

let state: State | null = null;
const listeners = new Set<() => void>();
function load(): State {
  if (state) return state;
  try { const raw = localStorage.getItem(KEY); state = raw ? { ...defaults(), ...JSON.parse(raw) } : defaults(); } catch { state = defaults(); }
  return state!;
}
let cloudUser: string | null = null;
let saveTimer: ReturnType<typeof setTimeout> | null = null;
function pushCloud() {
  if (!cloudUser || !state) return;
  const uid = cloudUser, data = state;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    supabase.from("user_state").upsert({ user_id: uid, data: data as never, updated_at: new Date().toISOString() }).then(({ error }) => error && console.error(error));
  }, 600);
}
/** Load this account's saved data from the cloud (or seed it from this browser on first sign-in). */
export async function connectCloud(userId: string | null) {
  cloudUser = userId;
  if (!userId) return;
  const { data } = await supabase.from("user_state").select("data").eq("user_id", userId).maybeSingle();
  if (data?.data && Object.keys(data.data as object).length) {
    state = { ...defaults(), ...(data.data as Partial<State>) };
    localStorage.setItem(KEY, JSON.stringify(state));
    listeners.forEach((l) => l());
  } else { load(); pushCloud(); }
}
export function signOutLocal() { cloudUser = null; state = defaults(); localStorage.removeItem(KEY); listeners.forEach((l) => l()); }
export function update(fn: (s: State) => State) {
  state = fn(load());
  localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
  pushCloud();
}
export function resetAll() { update(() => defaults()); }
export function useStore(): State | null {
  const [s, setS] = useState<State | null>(null);
  useEffect(() => { setS(load()); const l = () => setS({ ...load() }); listeners.add(l); return () => { listeners.delete(l); }; }, []);
  return s;
}
export const useNow = () => { const [d, setD] = useState<Date | null>(null); useEffect(() => setD(new Date()), []); return d; };

export const dkey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const startOfWeek = (d: Date) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); const w = (x.getDay() + 6) % 7; return addDays(x, -w); };
export const isChecked = (s: State, date: string, hid: string) => (s.checks[date] || []).includes(hid);
export const canEditHabitDay = (date: string, now = new Date()) => date === dkey(now);
export function toggleCheck(date: string, hid: string) {
  if (!canEditHabitDay(date)) return;
  update((s) => { const cur = s.checks[date] || []; return { ...s, checks: { ...s.checks, [date]: cur.includes(hid) ? cur.filter((x) => x !== hid) : [...cur, hid] } }; });
}
export const dayRate = (s: State, date: string) => s.habits.length ? (s.checks[date] || []).filter((h) => s.habits.some((x) => x.id === h)).length / s.habits.length : 0;

export function xp(s: State) {
  const ticks = Object.values(s.checks).reduce((a, c) => a + c.length, 0);
  const tasks = Object.values(s.tasks).flat().filter((t) => t.done).length;
  const goals = s.goals.filter((g) => g.progress >= g.target).length;
  const focus = s.sessions.reduce((a, x) => a + x.minutes, 0);
  return ticks * 10 + tasks * 5 + goals * 100 + focus;
}
export const levelOf = (x: number) => { let lvl = 1, need = 60, rest = x; while (rest >= need) { rest -= need; lvl++; need = 60 * lvl; } return { lvl, rest, need }; };
export function streaks(s: State, today: Date, pred: (d: string) => boolean) {
  let cur = 0; let d = today; if (!pred(dkey(d))) d = addDays(d, -1);
  while (pred(dkey(d))) { cur++; d = addDays(d, -1); }
  const keys = Object.keys(s.checks).sort(); let best = 0;
  if (keys.length) { let run = 0; const [y, m, dd] = keys[0]!.split("-").map(Number); let x = new Date(y!, m! - 1, dd!);
    while (x <= today) { if (pred(dkey(x))) { run++; best = Math.max(best, run); } else run = 0; x = addDays(x, 1); } }
  return { cur, best: Math.max(best, cur) };
}
export const useCb = useCallback;
