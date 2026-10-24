export type AdminAccount = {
  id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  approval_status: string;
  photo_path: string | null;
};

export function registeredAdminAccounts(accounts: AdminAccount[], adminIds: string[]) {
  const ids = new Set(adminIds);
  return accounts.filter((account) => ids.has(account.id) && account.approval_status === "approved" && account.full_name.trim() !== "" && account.email.trim() !== "");
}

export function isDeletionConfirmed(value: string) {
  return value === "DELETE";
}