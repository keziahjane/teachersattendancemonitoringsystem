import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteMyAccount } from "@/lib/account.functions";
import { isDeletionConfirmed } from "@/lib/admin-accounts";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function DeleteOwnAccountDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const deleteAccount = useServerFn(deleteMyAccount);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !isDeletionConfirmed(confirmation)) return;
    setBusy(true);
    try {
      await deleteAccount({ data: { confirmation } });
      await queryClient.cancelQueries();
      queryClient.clear();
      await supabase.auth.signOut({ scope: "local" });
      onOpenChange(false);
      toast.success("Your account has been deleted. Attendance records are preserved.");
      void navigate({ to: "/", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete your account. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return <Dialog open={open} onOpenChange={(next) => { if (busy) return; setConfirmation(""); onOpenChange(next); }}>
    <DialogContent>
      <DialogHeader><DialogTitle>Delete My Admin Account</DialogTitle><DialogDescription>This permanently deletes your own account and removes your access to TAMS. All existing attendance records and submissions will remain unchanged. This cannot be undone.</DialogDescription></DialogHeader>
      <form onSubmit={(event) => void submit(event)} className="space-y-5">
        <div className="space-y-2"><Label htmlFor="delete-own-confirmation">Type DELETE to confirm</Label><Input id="delete-own-confirmation" autoComplete="off" value={confirmation} disabled={busy} onChange={(event) => setConfirmation(event.target.value)} /></div>
        <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={() => { setConfirmation(""); onOpenChange(false); }}>Cancel</Button><Button type="submit" variant="destructive" disabled={busy || !isDeletionConfirmed(confirmation)}>{busy ? "Deleting…" : "Permanently Delete My Account"}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}