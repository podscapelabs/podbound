import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migration = await readFile(
  new URL("../supabase/migrations/0007_restrict_public_site_settings.sql", import.meta.url),
  "utf8",
);

assert.match(
  migration,
  /revoke select on public\.site_settings from anon, authenticated;/i,
  "The broad public SELECT grant must be revoked.",
);

const publicGrant = migration.match(
  /grant select\s*\(([^)]+)\)\s*on public\.site_settings to anon, authenticated;/i,
);
assert.ok(publicGrant, "A column-scoped public SELECT grant is required.");

const publicColumns = publicGrant[1]
  .split(",")
  .map((column) => column.trim().toLowerCase());

assert.deepEqual(publicColumns.sort(), ["id", "maintenance_enabled"]);
assert.ok(!publicColumns.includes("updated_by"), "Administrator identifiers must remain private.");
assert.ok(!publicColumns.includes("updated_at"), "Administrative timestamps must remain private.");

console.log("Public data policy checks passed.");
