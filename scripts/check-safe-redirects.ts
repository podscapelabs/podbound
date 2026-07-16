import assert from "node:assert/strict";
import { safeInternalPath } from "../lib/safe-redirect.ts";

const fallback = "/account";

assert.equal(safeInternalPath("/arena", fallback), "/arena");
assert.equal(safeInternalPath("/arena?notice=ready#entry", fallback), "/arena?notice=ready#entry");
assert.equal(safeInternalPath("https://example.com", fallback), fallback);
assert.equal(safeInternalPath("//example.com", fallback), fallback);
assert.equal(safeInternalPath("/\\example.com", fallback), fallback);
assert.equal(safeInternalPath("account", fallback), fallback);
assert.equal(safeInternalPath("", fallback), fallback);
assert.equal(safeInternalPath(null, fallback), fallback);

console.log("Safe redirect checks passed.");
