import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { LovableMark } from "@lovable.dev/cloud-auth-js/react";

const G = <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>;

export function AuthScreen({ title = "Sign in to keep your progress" }: { title?: string }) {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState(""); const [pw, setPw] = useState("");
  const [msg, setMsg] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    const r = mode === "in"
      ? await supabase.auth.signInWithPassword({ email, password: pw })
      : await supabase.auth.signUp({ email, password: pw, options: { emailRedirectTo: window.location.href } });
    setBusy(false);
    if (r.error) return setMsg(r.error.message);
    if (mode === "up" && !r.data.session) setMsg("Check your inbox to confirm your email, then sign in.");
  };
  const social = async (p: "google" | "lovable") => {
    const r = await lovable.auth.signInWithOAuth(p, { redirect_uri: window.location.origin + window.location.pathname });
    if (r.error) setMsg(r.error.message);
  };
  const Logo = <svg viewBox="0 0 16 16" className="h-5 w-5 fill-brand"><rect x="1" y="9" width="3" height="6" /><rect x="6" y="5" width="3" height="10" /><rect x="11" y="1" width="3" height="14" /></svg>;
  return (
    <div className="auth-bg relative flex min-h-screen items-center justify-center overflow-hidden p-4 text-foreground">
      <div className="pointer-events-none absolute inset-0 auth-grid" />
      <div className="relative grid w-full max-w-4xl overflow-hidden rounded-2xl border border-border bg-card/80 shadow-2xl backdrop-blur md:grid-cols-2">
        <aside className="relative hidden flex-col justify-between bg-brand/10 p-8 md:flex">
          <div className="flex items-center gap-2">{Logo}<span className="font-display text-lg font-bold">STRI<span className="text-brand">VISH</span> <span className="text-brand">2.0</span></span></div>
          <div>
            <h2 className="font-display text-3xl font-bold leading-tight">Strive daily<br />for what you <span className="text-brand">wish.</span></h2>
            <p className="mt-3 text-sm text-muted-foreground">Habits, goals, streaks and focus — all in one calm dashboard that follows you across devices.</p>
          </div>
          <div className="flex h-24 items-end gap-1.5">
            {[35, 55, 40, 70, 60, 85, 100].map((h, i) => <div key={i} className="auth-bar flex-1 rounded-t bg-brand" style={{ height: `${h}%`, animationDelay: `${i * 90}ms`, opacity: 0.35 + i * 0.09 }} />)}
          </div>
          <ul className="mt-4 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
            <li>✦ Weekly habit grid</li><li>✦ Goals and progress</li><li>✦ Streaks, XP and badges</li><li>✦ Focus timer</li>
          </ul>
        </aside>
        <form onSubmit={submit} className="space-y-3 p-6 sm:p-8">
          <div className="flex items-center gap-2 md:hidden">{Logo}<span className="font-display text-base font-bold">STRI<span className="text-brand">VISH</span> <span className="text-brand">2.0</span></span></div>
          <div className="flex rounded-full border border-border p-1 text-xs">
            {(["in", "up"] as const).map((m) => <button key={m} type="button" onClick={() => { setMode(m); setMsg(null); }} className={`flex-1 rounded-full py-1.5 font-semibold transition ${mode === m ? "bg-brand text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>{m === "in" ? "Sign in" : "Sign up"}</button>)}
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">{mode === "in" ? "Welcome back" : "Start your streak"}</h1>
            <p className="mt-1 text-xs text-muted-foreground">{mode === "in" ? title : "Create a free account — your progress saves automatically."}</p>
          </div>
          <button type="button" className="btn-ghost flex w-full items-center justify-center gap-2 py-2.5" onClick={() => social("google")}>{G} Continue with Google</button>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground"><span className="h-px flex-1 bg-border" />or with email<span className="h-px flex-1 bg-border" /></div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Email
            <input className="field mt-1 py-2.5 text-sm normal-case" type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Password
            <input className="field mt-1 py-2.5 text-sm normal-case" type="password" required minLength={6} placeholder="At least 6 characters" value={pw} onChange={(e) => setPw(e.target.value)} /></label>
          <button disabled={busy} className="btn-solid w-full py-2.5 text-sm">{busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}</button>
          {msg && <p className="rounded border border-border bg-muted/40 p-2 text-center text-xs text-brand-soft">{msg}</p>}
        </form>
      </div>
    </div>
  );
}
