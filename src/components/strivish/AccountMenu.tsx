import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { signOutLocal } from "@/lib/store";

export function AccountMenu({ user, isAdmin, onSettings }: { user: User; isAdmin: boolean | null; onSettings: () => void }) {
  const [open, setOpen] = useState(false);
  const [share, setShare] = useState(user.user_metadata?.["share_profile"] === true);
  const [name, setName] = useState<string>(user.user_metadata?.["full_name"] ?? user.user_metadata?.["name"] ?? "");
  const [saved, setSaved] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);
  const avatar = user.user_metadata?.["avatar_url"] as string | undefined;
  const initial = (name || user.email || "?").charAt(0).toUpperCase();
  const update = async (data: Record<string, unknown>) => { await supabase.auth.updateUser({ data }); setSaved(true); setTimeout(() => setSaved(false), 1500); };
  return (
    <div ref={ref} className="relative">
      <button aria-label="Account" onClick={() => setOpen(!open)} className="flex items-center gap-1.5 rounded-full border border-border py-0.5 pl-0.5 pr-2 hover:border-brand">
        {avatar ? <img src={avatar} alt="" className="h-6 w-6 rounded-full" /> : <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-primary-foreground">{initial}</span>}
        <span className="hidden max-w-[110px] truncate font-semibold sm:inline">{name || user.email?.split("@")[0]}</span>
        <span className="text-muted-foreground">▾</span>
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-72 rounded-lg border border-border bg-card p-3 text-xs shadow-2xl">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            {avatar ? <img src={avatar} alt="" className="h-10 w-10 rounded-full" /> : <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-base font-bold text-primary-foreground">{initial}</span>}
            <div className="min-w-0"><div className="truncate font-bold">{name || "Your account"}</div><div className="truncate text-[10px] text-muted-foreground">{user.email}</div></div>
          </div>
          <label className="mt-3 block text-[10px] uppercase tracking-wider text-muted-foreground">Display name</label>
          <div className="mt-1 flex gap-1">
            <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            <button className="btn-ghost" onClick={() => update({ full_name: name })}>Save</button>
          </div>
          <label className="mt-3 flex cursor-pointer items-start gap-2">
            <input type="checkbox" className="mt-0.5 accent-[var(--brand)]" checked={share} onChange={(e) => { setShare(e.target.checked); update({ share_profile: e.target.checked }); }} />
            <span><span className="font-semibold">Share my profile with the site owner</span><br /><span className="text-[10px] text-muted-foreground">Lets the owner see your name, habits and goals. Turn off anytime.</span></span>
          </label>
          {saved && <p className="mt-1 text-[10px] text-brand">Saved</p>}
          <div className="mt-3 space-y-1 border-t border-border pt-2">
            <button className="block w-full rounded px-2 py-1.5 text-left hover:bg-muted" onClick={() => { setOpen(false); onSettings(); }}>Data and settings</button>
            {isAdmin && <Link to="/admin" className="block rounded px-2 py-1.5 hover:bg-muted">Admin dashboard</Link>}
            <button className="block w-full rounded px-2 py-1.5 text-left text-brand-soft hover:bg-muted" onClick={async () => { await supabase.auth.signOut(); signOutLocal(); }}>Sign out</button>
          </div>
        </div>
      )}
    </div>
  );
}
