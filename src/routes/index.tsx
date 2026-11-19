import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin, useSession } from "@/hooks/use-session";
import { AuthScreen } from "@/components/strivish/AuthScreen";
import { connectCloud, levelOf, signOutLocal, useNow, useStore, xp } from "@/lib/store";
import { Week } from "@/components/strivish/Week";
import { Month } from "@/components/strivish/Month";
import { Goals } from "@/components/strivish/Goals";
import { Insights } from "@/components/strivish/Insights";
import { Focus } from "@/components/strivish/Focus";
import { EditHabits, Settings } from "@/components/strivish/Dialogs";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "STRIVISH 2.0 — Strive daily for what you wish" },
      { name: "description", content: "Track habits, daily tasks, goals, streaks and focus sessions in one dark, minimal dashboard." },
      { property: "og:title", content: "STRIVISH 2.0" },
      { property: "og:description", content: "Habit tracker, goals, insights and focus timer in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const TABS = ["Week", "Month", "Goals", "Insights", "Focus"] as const;

function Index() {
  const { session, ready } = useSession();
  const [synced, setSynced] = useState<string | null>(null);
  const uid = session?.user.id;
  useEffect(() => { if (uid) connectCloud(uid).then(() => setSynced(uid)); }, [uid]);
  if (!ready) return <div className="min-h-screen bg-background" />;
  if (!session) return <AuthScreen />;
  if (synced !== uid) return <div className="flex min-h-screen items-center justify-center bg-background text-xs text-muted-foreground">Loading your tracker…</div>;
  return <Tracker userId={uid!} />;
}

function Tracker({ userId }: { userId: string }) {
  const isAdmin = useIsAdmin(userId);
  const s = useStore();
  const now = useNow();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Week");
  const [dlg, setDlg] = useState<"habits" | "settings" | null>(null);
  if (!s || !now) return <div className="min-h-screen bg-background" />;
  const X = xp(s);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const edit = () => setDlg("habits");
  return (
    <div className="min-h-screen bg-background px-3 py-2.5 text-foreground">
      <div className="mx-auto max-w-[1000px] space-y-3">
        <header className="flex flex-wrap items-center gap-3 rounded-md bg-card px-3 py-2">
          <svg viewBox="0 0 16 16" className="h-4 w-4 fill-foreground"><rect x="1" y="9" width="3" height="6" /><rect x="6" y="5" width="3" height="10" /><rect x="11" y="1" width="3" height="14" /></svg>
          <h1 className="font-display text-sm font-bold tracking-tight">STRI<span className="text-brand">VISH</span> <span className="text-brand">2.0</span></h1>
          <span className="hidden text-[10px] font-semibold text-muted-foreground sm:inline">Strive daily for what you wish</span>
          <div className="ml-auto flex items-center gap-2 text-[10px]">
            <span className="rounded-full border border-border px-2 py-0.5 font-semibold">Level {levelOf(X).lvl} · {X} XP</span>
            <span className="font-semibold">{now.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }).replace(",", "")}</span>
            <span className="text-muted-foreground">Saved</span>
            <button className="btn-ghost" onClick={() => setDlg("settings")}>Data and settings</button>
            {isAdmin && <Link to="/admin" className="btn-ghost">Admin</Link>}
            <button className="btn-ghost" onClick={async () => { await supabase.auth.signOut(); signOutLocal(); }}>Sign out</button>
          </div>
        </header>
        <nav className="flex gap-1 border-b border-border text-xs">
          {TABS.map((t) => <button key={t} onClick={() => setTab(t)} className={`px-2.5 py-1.5 ${tab === t ? "border-b-2 border-foreground font-bold" : "text-muted-foreground hover:text-foreground"}`}>{t}</button>)}
        </nav>
        {tab === "Week" && <Week s={s} today={today} onEditHabits={edit} />}
        {tab === "Month" && <Month s={s} today={today} onEditHabits={edit} />}
        {tab === "Goals" && <Goals s={s} />}
        {tab === "Insights" && <Insights s={s} today={today} />}
        {tab === "Focus" && <Focus s={s} today={today} />}
      </div>
      {dlg === "habits" && <EditHabits s={s} onClose={() => setDlg(null)} />}
      {dlg === "settings" && <Settings s={s} onClose={() => setDlg(null)} />}
    </div>
  );
}
