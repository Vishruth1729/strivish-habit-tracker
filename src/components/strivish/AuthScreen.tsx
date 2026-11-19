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
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <div className="panel w-full max-w-sm">
        <div className="panel-head flex items-center justify-center gap-2 py-3">
          <svg viewBox="0 0 16 16" className="h-4 w-4 fill-foreground"><rect x="1" y="9" width="3" height="6" /><rect x="6" y="5" width="3" height="10" /><rect x="11" y="1" width="3" height="14" /></svg>
          <span className="font-display text-sm">STRI<span className="text-brand">VISH</span> <span className="text-brand">2.0</span></span>
        </div>
        <form onSubmit={submit} className="space-y-3 p-4">
          <p className="text-center text-xs text-muted-foreground">{title}</p>
          <button type="button" className="btn-ghost flex w-full items-center justify-center gap-2 py-2" onClick={() => social("google")}>{G} Continue with Google</button>
          <button type="button" className="btn-ghost flex w-full items-center justify-center gap-2 py-2" onClick={() => social("lovable")}><LovableMark /> Continue with Lovable</button>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
          <input className="field py-2" type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="field py-2" type="password" required minLength={6} placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} />
          <button disabled={busy} className="btn-solid w-full py-2">{mode === "in" ? "Sign in" : "Create account"}</button>
          {msg && <p className="text-center text-xs text-brand-soft">{msg}</p>}
          <p className="text-center text-xs text-muted-foreground">{mode === "in" ? "New here? " : "Have an account? "}
            <button type="button" className="font-bold text-foreground underline" onClick={() => setMode(mode === "in" ? "up" : "in")}>{mode === "in" ? "Create an account" : "Sign in"}</button></p>
        </form>
      </div>
    </div>
  );
}
