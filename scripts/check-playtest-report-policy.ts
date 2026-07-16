import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const route = readFileSync(`${root}/app/api/playtest-reports/route.ts`, "utf8");
const guard = readFileSync(`${root}/lib/playtest-report-guard.ts`, "utf8");

assert.match(route, /checkPlaytestReportSubmissionLimit\(actor\)/);
assert.match(route, /findExistingPlaytestReport\(actor, gameId\)/);
assert.match(route, /status: 429/);
assert.match(route, /"Retry-After"/);
assert.match(route, /duplicate: true/);
assert.match(route, /status: 503/);

assert.match(guard, /createHash\("sha256"\)/);
assert.match(guard, /MAX_SUBMISSIONS_PER_WINDOW = 12/);
assert.match(guard, /WINDOW_MS = 10 \* 60 \* 1000/);
assert.match(guard, /RETENTION_MS = 24 \* 60 \* 60 \* 1000/);
assert.match(guard, /\.delete\(\)[\s\S]*\.eq\("action", ACTION\)[\s\S]*\.lt\("created_at", retentionStart\)/);
assert.match(guard, /\.eq\("game_id", gameId\)/);
assert.match(guard, /\.eq\("account_id", actor\.accountId\)/);
assert.match(guard, /\.eq\("guest_session_id", actor\.guestSessionId\)/);
assert.doesNotMatch(guard, /console\.log\(.*attemptKey/);

console.log("Playtest report submission policy checks passed.");

