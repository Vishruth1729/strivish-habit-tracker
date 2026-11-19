import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AdminUser = { id: string; email: string; createdAt: string; lastSignIn: string | null; provider: string; confirmed: boolean; isAdmin: boolean; habits: number; ticks: number; tasks: number; goals: number; focusMin: number; lastActive: string | null };
export type AdminOverview = {
  users: AdminUser[];
  views: { path: string; referrer: string | null; created_at: string; user_id: string | null }[];
  tables: { name: string; rows: number }[];
  buckets: { name: string; public: boolean }[];
  generatedAt: string;
};

export const getAdminOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminOverview> => {
    const { data: ok } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!ok) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - 30 * 864e5).toISOString();
    const [usersRes, states, roles, views, buckets, vc, sc, rc] = await Promise.all([
      supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
      supabaseAdmin.from("user_state").select("user_id, data, updated_at"),
      supabaseAdmin.from("user_roles").select("user_id, role"),
      supabaseAdmin.from("page_views").select("path, referrer, created_at, user_id").gte("created_at", since).order("created_at", { ascending: false }).limit(5000),
      supabaseAdmin.storage.listBuckets(),
      supabaseAdmin.from("page_views").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("user_state").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("user_roles").select("*", { count: "exact", head: true }),
    ]);
    const stateBy = new Map((states.data ?? []).map((s) => [s.user_id, s]));
    const admins = new Set((roles.data ?? []).filter((r) => r.role === "admin").map((r) => r.user_id));
    const users: AdminUser[] = (usersRes.data?.users ?? []).map((u) => {
      const st = stateBy.get(u.id); const d: any = st?.data ?? {};
      return {
        id: u.id, email: u.email ?? "", createdAt: u.created_at, lastSignIn: u.last_sign_in_at ?? null,
        provider: (u.app_metadata?.provider as string) ?? "email", confirmed: !!u.email_confirmed_at, isAdmin: admins.has(u.id),
        habits: (d.habits ?? []).length,
        ticks: Object.values(d.checks ?? {}).reduce((a: number, c: any) => a + (c?.length ?? 0), 0) as number,
        tasks: Object.values(d.tasks ?? {}).flat().filter((t: any) => t?.done).length,
        goals: (d.goals ?? []).length,
        focusMin: (d.sessions ?? []).reduce((a: number, x: any) => a + (x?.minutes ?? 0), 0),
        lastActive: st?.updated_at ?? null,
      };
    });
    return {
      users, views: views.data ?? [],
      tables: [{ name: "Saved habits (one per user)", rows: sc.count ?? 0 }, { name: "Page visits", rows: vc.count ?? 0 }, { name: "Roles", rows: rc.count ?? 0 }],
      buckets: (buckets.data ?? []).map((b) => ({ name: b.name, public: b.public })),
      generatedAt: new Date().toISOString(),
    };
  });
