import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin, useSession } from "@/hooks/use-session";
import { AuthScreen } from "@/components/strivish/AuthScreen";
import { BarChart, Panel, Stat } from "@/components/strivish/ui";
import { getAdminOverview, type AdminOverview } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — STRIVISH 2.0" },
      { name: "description", content: "Owner dashboard for STRIVISH 2.0." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Admin — STRIVISH 2.0" },
      { property: "og:description", content: "Owner dashboard for STRIVISH 2.0." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

const PROJECT = "https://lovable.dev/projects/b71c63d9-0e3f-4ffa-9dae-733a30cb2869";
const SECTIONS = ["Analytics", "Database", "Users", "Storage", "AI", "Payments", "Emails", "Domains", "Connectors", "Security", "SEO and AI search", "Usage", "Settings"] as const;
type Section = (typeof SECTIONS)[number];

function AdminPage() {
  const { session, ready } = useSession();
  const isAdmin = useIsAdmin(session?.user.id);
  if (!ready) return <div className="min-h-screen bg-background" />;
  if (!session) return <AuthScreen title="Admin sign-in" />;
  if (isAdmin === null) return <Centered>Checking access…</Centered>;
  if (!isAdmin) return <Centered>This page is only for the site owner. <Link to="/" className="underline">Back to tracker</Link></Centered>;
  return <Dashboard email={session.user.email ?? ""} />;
}
function Centered({ children }: { children: ReactNode }) {
  return <div className="flex min-h-screen items-center justify-center gap-1 bg-background text-xs text-muted-foreground">{children}</div>;
}

function Dashboard({ email }: { email: string }) {
  const [sec, setSec] = useState<Section>("Analytics");
  const fetchOverview = useServerFn(getAdminOverview);
  const q = useQuery({ queryKey: ["admin-overview"], queryFn: () => fetchOverview(), refetchInterval: 60_000 });
  return (
    <div className="min-h-screen bg-background px-3 py-2.5 text-foreground">
      <div className="mx-auto max-w-[1100px] space-y-3">
        <header className="flex flex-wrap items-center gap-3 rounded-md bg-card px-3 py-2">
          <svg viewBox="0 0 16 16" className="h-4 w-4 fill-foreground"><rect x="1" y="9" width="3" height="6" /><rect x="6" y="5" width="3" height="10" /><rect x="11" y="1" width="3" height="14" /></svg>
          <h1 className="font-display text-sm font-bold">STRI<span className="text-brand">VISH</span> <span className="text-brand">2.0</span> <span className="text-muted-foreground">Admin</span></h1>
          <div className="ml-auto flex items-center gap-2 text-[10px]">
            <span className="text-muted-foreground">{q.data ? `Updated ${new Date(q.data.generatedAt).toLocaleTimeString()}` : q.isFetching ? "Loading…" : ""}</span>
            <button className="btn-ghost" onClick={() => q.refetch()}>Refresh</button>
            <Link to="/" className="btn-ghost">Tracker</Link>
          </div>
        </header>
        <div className="grid gap-3 md:grid-cols-[170px_1fr]">
          <nav className="flex gap-1 overflow-x-auto md:flex-col">
            {SECTIONS.map((s) => <button key={s} onClick={() => setSec(s)} className={`whitespace-nowrap rounded px-2.5 py-1.5 text-left text-xs ${sec === s ? "bg-muted font-bold" : "text-muted-foreground hover:text-foreground"}`}>{s}</button>)}
          </nav>
          <main className="min-w-0 space-y-3">
            <h2 className="font-display text-lg font-bold">{sec}</h2>
            {q.error ? <p className="text-xs text-destructive">Couldn't load data: {String((q.error as Error).message)}</p>
              : !q.data ? <p className="text-xs text-muted-foreground">Loading…</p>
              : <SectionView sec={sec} d={q.data} email={email} />}
          </main>
        </div>
      </div>
    </div>
  );
}

const day = (iso: string) => iso.slice(0, 10);
function countBy<T>(xs: T[], f: (x: T) => string) { const m = new Map<string, number>(); xs.forEach((x) => m.set(f(x), (m.get(f(x)) ?? 0) + 1)); return [...m.entries()].sort((a, b) => b[1] - a[1]); }
function List({ rows, empty }: { rows: [string, ReactNode][]; empty: string }) {
  if (!rows.length) return <p className="p-3 text-xs text-muted-foreground">{empty}</p>;
  return <div>{rows.map(([k, v], i) => <div key={i} className="flex justify-between border-b border-border px-3 py-1.5 text-xs last:border-0"><span>{k}</span><span className="font-bold">{v}</span></div>)}</div>;
}
function LinkCard({ text, path, label }: { text: string; path: string; label: string }) {
  return (
    <div className="stat space-y-2">
      <p className="text-xs text-muted-foreground">{text}</p>
      <a href={`${PROJECT}${path}`} target="_blank" rel="noreferrer" className="btn-solid inline-block">{label} ↗</a>
    </div>
  );
}

function SectionView({ sec, d, email }: { sec: Section; d: AdminOverview; email: string }) {
  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => day(new Date(Date.now() - (13 - i) * 864e5).toISOString())), []);
  const today = days[13]!;
  const active7 = d.users.filter((u) => u.lastActive && Date.now() - +new Date(u.lastActive) < 7 * 864e5).length;
  switch (sec) {
    case "Analytics": {
      const perDay = days.map((k) => d.views.filter((v) => day(v.created_at) === k).length);
      return (<>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <Stat label="Visits today" value={perDay[13]} /><Stat label="Visits, 30 days" value={d.views.length} />
          <Stat label="Signed-in visits" value={d.views.filter((v) => v.user_id).length} sub="last 30 days" /><Stat label="Active users" value={active7} sub="saved data in last 7 days" />
        </div>
        <Panel title="Visits, last 14 days"><div className="p-2"><BarChart width={700} height={220} max={Math.max(4, ...perDay)} ticks={[]} values={perDay} labels={days.map((k) => k.slice(8))} highlight={13} /></div></Panel>
        <div className="grid gap-3 lg:grid-cols-2">
          <Panel title="Top pages"><List rows={countBy(d.views, (v) => v.path).slice(0, 8)} empty="No visits yet." /></Panel>
          <Panel title="Where visitors came from"><List rows={countBy(d.views, (v) => v.referrer ?? "Direct").slice(0, 8)} empty="No visits yet." /></Panel>
        </div>
        <p className="text-[10px] text-muted-foreground">Counted by your site itself. Lovable's own analytics (countries, devices, page speed) stay in Lovable.</p>
        <LinkCard text="Full visitor analytics with countries, devices and speed." path="?view=analytics" label="Open Lovable analytics" />
      </>);
    }
    case "Database":
      return (<>
        <Panel title="Tables"><List rows={d.tables.map((t) => [t.name, `${t.rows} rows`])} empty="" /></Panel>
        <LinkCard text="Browse and edit every row." path="?view=cloud&subview=database" label="Open database" />
      </>);
    case "Users":
      return (<>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <Stat label="Total users" value={d.users.length} /><Stat label="New today" value={d.users.filter((u) => day(u.createdAt) === today).length} />
          <Stat label="Active, 7 days" value={active7} /><Stat label="Unconfirmed" value={d.users.filter((u) => !u.confirmed).length} />
        </div>
        <Panel title="All users"><div className="overflow-x-auto"><table className="w-full text-xs">
          <thead><tr className="border-b border-border text-left text-[10px] uppercase tracking-wider text-muted-foreground">
            {["", "Email", "Joined", "Last sign-in", "Method", "Habits", "Ticks", "Tasks done", "Goals", "Focus"].map((h) => <th key={h} className="p-2">{h}</th>)}</tr></thead>
          <tbody>{d.users.map((u) => <UserRow key={u.id} u={u} day={day} />)}</tbody></table></div></Panel>
      </>);
    case "Storage":
      return (<>
        <Panel title="File buckets"><List rows={d.buckets.map((b) => [b.name, b.public ? "Public" : "Private"])} empty="No file storage set up yet. Your site doesn't store uploaded files." /></Panel>
        <LinkCard text="See and manage stored files." path="?view=cloud&subview=storage" label="Open storage" />
      </>);
    case "AI": return <Info status="Not used yet" text="Your site has no AI features. If you add some (for example an AI habit coach), usage will show here." path="?view=cloud&subview=ai" />;
    case "Payments": return <Info status="Not set up" text="Your site doesn't take payments. Once you add Stripe or Paddle, sales and subscribers will show here." path="?view=payments" />;
    case "Emails": return <Info status="Sign-in emails only" text="Your site sends sign-up confirmation and password emails. Templates, sender address and delivery logs are in Lovable." path="?view=cloud&subview=emails" />;
    case "Domains": return (<>
      <div className="grid gap-2 sm:grid-cols-2"><Stat label="Live address" value={<a className="underline" href="https://strivish2.lovable.app" target="_blank" rel="noreferrer">strivish2.lovable.app</a>} /><Stat label="Custom domain" value="None" /></div>
      <LinkCard text="Connect or buy your own web address." path="?view=settings&subview=domains" label="Open domains" />
    </>);
    case "Connectors": return <Info status="Built in: accounts, database" text="No outside services are connected. Add Slack, Google Sheets and others from Lovable." path="?view=connectors" />;
    case "Security": return (<>
      <Panel title="What's protected"><List empty="" rows={[["Admin page", "Owner only"], ["Each user's habits", "Only that user (and you)"], ["Visit records", "Only you can read"], ["Sign-in methods", "Email, Google, Lovable"]]} /></Panel>
      <LinkCard text="Run a full security scan of the site." path="?view=security" label="Open security" />
    </>);
    case "SEO and AI search": return (<>
      <Panel title="Pages"><List empty="" rows={[["/ — STRIVISH 2.0 — Strive daily for what you wish", "Indexed"], ["/admin", "Hidden from search"]]} /></Panel>
      <LinkCard text="Check how search engines and AI assistants see your site." path="?view=seo" label="Open SEO" />
    </>);
    case "Usage": return (<>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Stat label="Habit ticks, all users" value={d.users.reduce((a, u) => a + u.ticks, 0)} /><Stat label="Tasks done" value={d.users.reduce((a, u) => a + u.tasks, 0)} />
        <Stat label="Goals created" value={d.users.reduce((a, u) => a + u.goals, 0)} /><Stat label="Focus minutes" value={d.users.reduce((a, u) => a + u.focusMin, 0)} />
      </div>
      <LinkCard text="Credits and backend costs for your plan." path="?view=usage" label="Open usage" />
    </>);
    case "Settings": return (<>
      <Panel title="Your account"><List empty="" rows={[["Signed in as", email], ["Role", "Admin"]]} /></Panel>
      <div className="flex flex-wrap gap-2">
        <button className="btn-ghost" onClick={() => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(d.users, null, 2)], { type: "application/json" })); a.download = "strivish-users.json"; a.click(); }}>Export users</button>
        <button className="btn-ghost" onClick={async () => { await supabase.auth.signOut(); location.href = "/"; }}>Sign out</button>
      </div>
      <LinkCard text="Sign-in methods, site visibility and other project settings." path="?view=settings" label="Open settings" />
    </>);
  }
}
function Info({ status, text, path }: { status: string; text: string; path: string }) {
  return (<><Stat label="Status" value={status} /><LinkCard text={text} path={path} label="Open in Lovable" /></>);
}

function UserRow({ u, day }: { u: AdminOverview["users"][number]; day: (s: string) => string }) {
  const [open, setOpen] = useState(false);
  return (<>
    <tr className="cursor-pointer border-b border-border hover:bg-muted/40" onClick={() => setOpen(!open)}>
      <td className="p-2 text-muted-foreground">{open ? "▾" : "▸"}</td>
      <td className="p-2 font-semibold">{u.email}{u.isAdmin && <span className="ml-1 rounded bg-brand px-1 text-[9px] text-primary-foreground">admin</span>}{!u.confirmed && <span className="ml-1 text-[9px] text-muted-foreground">unconfirmed</span>}</td>
      <td className="p-2">{day(u.createdAt)}</td><td className="p-2">{u.lastSignIn ? day(u.lastSignIn) : "—"}</td><td className="p-2">{u.provider}</td>
      <td className="p-2">{u.habits}</td><td className="p-2">{u.ticks}</td><td className="p-2">{u.tasks}</td><td className="p-2">{u.goals}</td><td className="p-2">{u.focusMin} min</td>
    </tr>
    {open && <tr className="border-b border-border bg-muted/20"><td colSpan={10} className="p-3">
      {u.profile ? (
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-3">
            {u.avatar ? <img src={u.avatar} alt="" className="h-10 w-10 rounded-full" /> : <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand font-bold text-primary-foreground">{(u.name ?? u.email)[0]?.toUpperCase()}</div>}
            <div><div className="font-bold">{u.name ?? "No name set"}</div><div className="text-[10px] text-muted-foreground">{u.email} · shared their profile with you</div></div>
          </div>
          <div><div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Habits</div>{u.profile.habits.length ? u.profile.habits.map((h, i) => <div key={i}>• {h}</div>) : <div className="text-muted-foreground">None yet</div>}</div>
          <div><div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Goals</div>{u.profile.goals.length ? u.profile.goals.map((g, i) => <div key={i}>• {g.name} — {g.progress}/{g.target} {g.unit}</div>) : <div className="text-muted-foreground">None yet</div>}</div>
        </div>
      ) : <p className="text-muted-foreground">🔒 This user hasn't given permission to view their profile. They can allow it from their account menu (top right).</p>}
    </td></tr>}
  </>);
}
