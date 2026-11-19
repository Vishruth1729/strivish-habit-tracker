import { useState, type ReactNode } from "react";
import { resetAll, uid, update, type State } from "@/lib/store";

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4" onClick={onClose}>
      <div className="panel w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="panel-head flex items-center"><span className="flex-1">{title}</span><button onClick={onClose}>×</button></div>
        <div className="space-y-2 p-3">{children}</div>
      </div>
    </div>
  );
}
export function EditHabits({ s, onClose }: { s: State; onClose: () => void }) {
  const [name, setName] = useState("");
  const add = () => { if (!name.trim()) return; update((st) => ({ ...st, habits: [...st.habits, { id: uid(), name: name.trim() }] })); setName(""); };
  return (
    <Modal title="Edit habits" onClose={onClose}>
      {s.habits.map((h) => (
        <div key={h.id} className="flex gap-1">
          <input className="field" value={h.name} onChange={(e) => update((st) => ({ ...st, habits: st.habits.map((x) => x.id === h.id ? { ...x, name: e.target.value } : x) }))} />
          <button className="btn-ghost" onClick={() => update((st) => ({ ...st, habits: st.habits.filter((x) => x.id !== h.id) }))}>Remove</button>
        </div>
      ))}
      <div className="flex gap-1 pt-2"><input className="field" placeholder="New habit" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} /><button className="btn-solid" onClick={add}>Add</button></div>
    </Modal>
  );
}
export function Settings({ s, onClose }: { s: State; onClose: () => void }) {
  const exp = () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(s, null, 2)], { type: "application/json" })); a.download = "strivish-backup.json"; a.click(); };
  const imp = (f?: File) => f && f.text().then((t) => { try { const d = JSON.parse(t); update(() => d); onClose(); } catch { alert("That file could not be read."); } });
  return (
    <Modal title="Data and settings" onClose={onClose}>
      <p className="text-xs text-muted-foreground">Your data is saved to your account and syncs across devices. You can also export a backup file.</p>
      <div className="flex flex-wrap gap-2">
        <button className="btn-solid" onClick={exp}>Export backup</button>
        <label className="btn-ghost cursor-pointer">Import backup<input type="file" accept="application/json" className="hidden" onChange={(e) => imp(e.target.files?.[0])} /></label>
        <button className="btn-ghost" onClick={() => { if (confirm("Erase all data?")) { resetAll(); onClose(); } }}>Reset everything</button>
      </div>
    </Modal>
  );
}
