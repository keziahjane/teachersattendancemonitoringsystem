import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { registeredAdminAccounts } from "@/lib/admin-accounts";
import { AppHeader } from "@/components/AppHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const adminAccountsOptions = queryOptions({
  queryKey: ["admin-accounts"],
  staleTime: 0,
  queryFn: async () => {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) throw new Error("Sign in to view registered Admin accounts.");
    const { data: allowed, error: roleError } = await supabase.rpc("has_role", { _user_id: authData.user.id, _role: "hr" });
    if (roleError || !allowed) throw new Error("Only Admin accounts can view this list.");
    const { data: roleRows, error: rolesError } = await supabase.from("user_roles").select("user_id").eq("role", "hr");
    if (rolesError) throw rolesError;
    const ids = (roleRows ?? []).map((row) => row.user_id);
    if (ids.length === 0) return [];
    const { data, error } = await supabase.from("profiles").select("id, full_name, email, is_active, approval_status, photo_path").in("id", ids).eq("approval_status", "approved").order("full_name");
    if (error) throw error;
    return registeredAdminAccounts(data ?? [], ids);
  },
});

export const Route = createFileRoute("/_authenticated/admin-accounts")({
  head: () => ({ meta: [
    { title: "Registered Admin Accounts — TAMS" },
    { name: "description", content: "View the approved, registered administrator accounts for Teachers Attendance Monitoring System." },
    { property: "og:title", content: "TAMS Registered Admin Accounts" },
    { property: "og:description", content: "Registered administrator directory for Teachers Attendance Monitoring System." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(adminAccountsOptions),
  component: AdminAccountsPage,
});

function AdminPhoto({ name, photoPath }: { name: string; photoPath: string | null }) {
  const { data: url } = useQuery({ queryKey: ["admin-photo", photoPath], enabled: !!photoPath, staleTime: 5 * 60 * 1000, queryFn: async () => {
    if (!photoPath) return undefined;
    const { data, error } = await supabase.storage.from("profile-photos").createSignedUrl(photoPath, 3600);
    if (error) throw error;
    return data.signedUrl;
  } });
  return <Avatar className="h-10 w-10"><AvatarImage src={url} alt={`${name} profile`} className="object-cover" /><AvatarFallback className="font-bold">{name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</AvatarFallback></Avatar>;
}

function AdminAccountsPage() {
  const { user, fullName } = useSession();
  const { data: accounts } = useSuspenseQuery(adminAccountsOptions);
  return <div className="min-h-screen bg-background"><AppHeader name={fullName || "Admin"} role="Admin" userId={user?.id} /><main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
    <div><h1 className="text-2xl font-bold">Registered Admin Accounts</h1><p className="mt-2 text-sm font-semibold text-muted-foreground">{accounts.length} registered Admin account{accounts.length === 1 ? "" : "s"}</p></div>
    {accounts.length === 0 ? <p className="text-muted-foreground">No registered Admin accounts found.</p> : <div className="overflow-x-auto rounded-md border border-border"><Table><TableHeader><TableRow><TableHead>Photo</TableHead><TableHead>Full Name</TableHead><TableHead>Email</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{accounts.map((account) => <TableRow key={account.id}><TableCell><AdminPhoto name={account.full_name} photoPath={account.photo_path} /></TableCell><TableCell className="min-w-40 font-bold">{account.full_name}{account.id === user?.id && <span className="ml-2 text-xs text-muted-foreground">(You)</span>}</TableCell><TableCell className="break-all">{account.email}</TableCell><TableCell><Badge variant={account.is_active ? "default" : "destructive"}>{account.is_active ? "Active" : "Deactivated"}</Badge></TableCell></TableRow>)}</TableBody></Table></div>}
  </main></div>;
}