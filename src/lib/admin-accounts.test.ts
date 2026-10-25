import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { isDeletionConfirmed, registeredAdminAccounts, type AdminAccount } from "./admin-accounts";

const account: AdminAccount = { id: "admin", full_name: "Registered Admin", email: "admin@example.com", is_active: true, approval_status: "approved", photo_path: null };

describe("registered Admin directory", () => {
  test("includes only actual approved Admin accounts", () => {
    const rows = [account, { ...account, id: "sa" }, { ...account, id: "pending", approval_status: "pending" }, { ...account, id: "rejected", approval_status: "rejected" }, { ...account, id: "unnamed", full_name: " " }, { ...account, id: "no-email", email: "" }];
    assert.deepEqual(registeredAdminAccounts(rows, ["admin", "pending", "rejected", "unnamed", "no-email"]).map((row) => row.id), ["admin"]);
  });
  test("does not generate accounts for an empty registry", () => {
    assert.deepEqual(registeredAdminAccounts([], []), []);
  });
  test("keeps registered deactivated Admin accounts visible with their status", () => {
    assert.equal(registeredAdminAccounts([{ ...account, is_active: false }], ["admin"])[0]?.is_active, false);
  });
});

test("own-account deletion requires exact explicit confirmation", () => {
  assert.equal(isDeletionConfirmed("DELETE"), true);
  for (const value of ["", "delete", "DELET", " DELETE "]) assert.equal(isDeletionConfirmed(value), false);
});