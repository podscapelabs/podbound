import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [header, gate, styles] = await Promise.all([
  readFile(new URL("../components/Header.tsx", import.meta.url), "utf8"),
  readFile(new URL("../components/PlaytestAgreementGate.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/arena/page.module.css", import.meta.url), "utf8"),
]);

assert.match(header, /summary aria-label="Primary navigation menu"/, "The menu name must remain accurate in both open and closed states.");
assert.doesNotMatch(header, /aria-label="Open primary navigation"/, "A static action label becomes incorrect after the menu opens.");
assert.match(gate, /dialog\.showModal\(\)/, "The agreement must use a true modal dialog that contains keyboard focus.");
assert.match(gate, /onCancel=\{\(event\) => event\.preventDefault\(\)\}/, "Escape must not bypass the required agreement.");
assert.match(gate, /<input autoFocus type="checkbox"/, "Initial modal focus must land on the agreement control.");
assert.match(styles, /\.agreementGate:not\(\[open\]\)\s*\{\s*display:none;/, "A closed agreement dialog must not remain visible.");

console.log("Accessibility contract checks passed.");
