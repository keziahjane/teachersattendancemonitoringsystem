import { describe, expect, test } from "bun:test";
import { isDeletionConfirmed, registeredAdminAccounts, type AdminAccount } from "./admin-accounts";

const account: AdminAccount = { id: "admin", full_name: "Registered Admin", email: "admin@example.com", is_active: true, approval_status: "approved", photo_path: null };

describe("registered Admin directory", () => {
  test("includes only actual approved Admin accounts", () => {
    const rows = [account, { ...account, id: "sa" }, { ...account, id: "pending", approval_status: "pending" }, { ...account, id: "rejected", approval_status: "rejected" }, { ...account, id: "unnamed", full_name: " " }, { ...account, id: "no-email", email: "" }];
    expect(registeredAdminAccounts(rows, ["admin", "pending", "rejected", "unnamed", "no-email"]).map((row) => row.id)).toEqual(["admin"]);
  });
  test("does not generate accounts for an empty registry", () => {
    expect(registeredAdminAccounts([], [])).toEqual([]);
  });
  test("keeps registered deactivated Admin accounts visible with their status", () => {
    expect(registeredAdminAccounts([{ ...account, is_active: false }], ["admin"])[0]?.is_active).toBe(false);
  });
});

test("own-account deletion requires exact explicit confirmation", () => {
  expect(isDeletionConfirmed("DELETE")).toBe(true);
  for (const value of ["", "delete", "DELET", " DELETE "]) expect(isDeletionConfirmed(value)).toBe(false);
});