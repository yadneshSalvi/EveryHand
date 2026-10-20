import test from "node:test";
import assert from "node:assert/strict";
import { toCSV } from "./export.ts";
import { samplePlan, schedule, repair } from "./solver.ts";
test("CSV contains every learner, actual zero start, and seven explicitly missing turns", () => {
  const csv = toCSV(samplePlan, schedule(samplePlan));
  assert.equal(csv.split("\r\n").length, 29);
  assert.equal((csv.match(/"No full turn"/g) || []).length, 7);
  assert.match(csv, /"Aarav","Observe a specimen","1","0","4","Scheduled"/);
});
test("CSV quotes commas/quotes and guards spreadsheet formulas", () => {
  const p = {
    ...samplePlan,
    learners: ['=HYPERLINK("x")', "  +123", "A, B"],
    tasks: [{ ...samplePlan.tasks[0], name: "@unsafe" }],
  };
  const csv = toCSV(p, schedule(p));
  assert.ok(csv.includes('"\'=HYPERLINK(""x"")"'));
  assert.ok(csv.includes('"\'  +123"'));
  assert.ok(csv.includes('"\'@unsafe"'));
  assert.ok(csv.includes('"A, B"'));
});
test("repaired CSV includes immutable historic turns and actual remaining gaps", () => {
  const p = { ...samplePlan, tasks: [{ ...samplePlan.tasks[0], capacity: 4 }] };
  const r = repair(p, schedule(p), 8);
  const csv = toCSV(r.plan, r.schedule);
  assert.equal(
    (csv.match(/"Scheduled"/g) || []).length,
    r.schedule.slots.length,
  );
  assert.equal(
    (csv.match(/"No full turn"/g) || []).length,
    r.schedule.unserved.length,
  );
  assert.match(csv, /"Ben","Observe a specimen","2","4","8","Scheduled"/);
});
