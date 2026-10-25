import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isDeletionConfirmed } from "@/lib/admin-accounts";

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { confirmation: string }) => {
    if (!data || !isDeletionConfirmed(data.confirmation)) throw new Error("Type DELETE to confirm account deletion.");
    return data;
  })
  .handler(async ({ context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "hr" });
    if (roleError || !isAdmin) throw new Error("Only Admin accounts can delete their own account here.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Admin deletes a deactivated SA account. Attendance records keep the submitter's name/ID; their link is set to null.
export const deleteDeactivatedSa = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => {
    if (!d || typeof d.id !== "string" || !/^[0-9a-f-]{36}$/i.test(d.id)) throw new Error("Invalid id");
    return d;
  })
  .handler(async ({ context, data }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "hr" });
    if (!isAdmin) throw new Error("Only Admin accounts can delete accounts.");
    const { data: target } = await context.supabase.from("profiles").select("id, is_active").eq("id", data.id).maybeSingle();
    if (!target) throw new Error("Account not found.");
    if (target.is_active) throw new Error("Deactivate the account before deleting it.");
    const { data: saRole } = await context.supabase.from("user_roles").select("role").eq("user_id", data.id).eq("role", "student_assistant").maybeSingle();
    if (!saRole) throw new Error("Only Student Assistant accounts can be deleted here.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
