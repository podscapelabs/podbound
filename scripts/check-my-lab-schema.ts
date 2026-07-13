import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sql = readFileSync(new URL("../supabase/migrations/0006_my_lab_foundation.sql", import.meta.url), "utf8");

for (const table of [
  "podling_catalog",
  "account_progression",
  "account_podlings",
  "account_exp_history",
  "account_reward_history",
]) {
  assert.match(sql, new RegExp(`create table public\\.${table}\\b`), `${table} must exist`);
  assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`), `${table} must use RLS`);
}

assert.match(sql, /permanent_discount_bps between 0 and 1000/, "permanent discount must be capped at 10 percent");
assert.match(sql, /foreign key \(active_podling_id, account_id\)/, "active Podling must be tied to its owning account");
assert.match(sql, /Podlings never hold separate EXP/, "shared account EXP rule must remain documented");
assert.match(sql, /revoke all on function public\.record_account_exp[\s\S]+from public, anon, authenticated/, "EXP writer must not be client callable");
assert.doesNotMatch(sql, /grant (insert|update|delete)[\s\S]+to authenticated/i, "clients must not receive progression mutation grants");

const backfillPosition = sql.lastIndexOf("insert into public.account_progression (account_id)");
const progressionRlsPosition = sql.indexOf("alter table public.account_progression enable row level security");
assert.ok(backfillPosition > progressionRlsPosition, "progression backfill must follow table alterations to avoid pending deferred-trigger events");

console.log("My Lab schema checks passed.");
