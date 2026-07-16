import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migration = await readFile(
  new URL("../supabase/migrations/0008_deidentify_deleted_accounts.sql", import.meta.url),
  "utf8",
);

assert.match(migration, /drop constraint if exists playtest_reports_check/i, "Retained reports must not block profile deletion.");
assert.match(migration, /add constraint playtest_reports_identity_check[\s\S]*player_label\s*=\s*'Deleted playtester'/i, "Only deliberately de-identified reports may remain unlinked.");
assert.match(migration, /before delete on public\.profiles/i, "De-identification must run before the profile is removed.");
assert.match(migration, /account_id\s*=\s*null/i, "Retained reports must release their account link.");
assert.match(migration, /player_label\s*=\s*'Deleted playtester'/i, "Retained reports must replace the display name.");
assert.match(migration, /report\s*=\s*report\s*#-\s*'\{test,tester\}'\s*#-\s*'\{feedback,tester\}'/i, "Structured tester fields must be removed.");
assert.match(migration, /revoke all on function public\.deidentify_deleted_account_reports\(\) from public, anon, authenticated/i, "Clients must not be able to invoke the deletion trigger function.");

console.log("Account deletion policy checks passed.");
