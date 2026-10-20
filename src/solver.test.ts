import test from "node:test";
import assert from "node:assert/strict";
import {
  samplePlan,
  schedule,
  repair,
  validatePlan,
  capacityProof,
  type Plan,
  type Schedule,
} from "./solver.ts";
function invariant(p: Plan, r: Schedule, cutoff?: number) {
  const pairs = new Set<string>();
  for (const s of r.slots) {
    const t = p.tasks.find((t) => t.id === s.task)!;
    assert.ok(t);
    assert.equal(s.end - s.start, t.duration);
    assert.ok(s.start >= 0 && s.end <= p.minutes);
    assert.ok(s.learner >= 0 && s.learner < p.learners.length);
    assert.ok(s.resource >= 0);
    if (cutoff === undefined || s.start >= cutoff)
      assert.ok(s.resource < t.capacity);
    const key = `${s.learner}/${s.task}`;
    assert.ok(!pairs.has(key));
    pairs.add(key);
    const ti = p.tasks.indexOf(t);
    if (ti > 0)
      assert.ok(
        r.slots.some(
          (a) =>
            a.learner === s.learner &&
            a.task === p.tasks[ti - 1].id &&
            a.end <= s.start,
        ),
      );
    for (const a of r.slots)
      if (
        a !== s &&
        (a.learner === s.learner ||
          (a.task === s.task && a.resource === s.resource))
      )
        assert.ok(a.end <= s.start || s.end <= a.start);
  }
  assert.equal(
    r.served,
    p.learners.filter((_, i) =>
      p.tasks.every((t) =>
        r.slots.some((s) => s.learner === i && s.task === t.id),
      ),
    ).length,
  );
  assert.equal(
    r.unserved.length,
    p.learners.length * p.tasks.length - r.slots.length,
  );
}
test("whole turns: 28 learners need four microscopes, never fractional people", () => {
  const r = schedule(samplePlan);
  assert.equal(r.served, 21);
  assert.equal(r.unserved.length, 7);
  assert.deepEqual(capacityProof(samplePlan), {
    required: 112,
    available: 90,
    wholeTurns: 21,
    neededResources: 4,
  });
  const p = { ...samplePlan, tasks: [{ ...samplePlan.tasks[0], capacity: 4 }] };
  const a = schedule(p);
  assert.equal(a.served, 28);
  assert.equal(Math.max(...a.slots.map((s) => s.end)), 28);
  invariant(p, a);
});
test("invalid plan, zero duration/capacity, duplicate IDs and invalid cutoff rejected", () => {
  for (const duration of [0, -1, 1.5, NaN])
    assert.ok(
      validatePlan({
        ...samplePlan,
        tasks: [{ ...samplePlan.tasks[0], duration }],
      }).length,
    );
  assert.ok(
    validatePlan({
      ...samplePlan,
      tasks: [{ ...samplePlan.tasks[0], capacity: 0 }],
    }).length,
  );
  assert.ok(
    validatePlan({
      ...samplePlan,
      tasks: [samplePlan.tasks[0], samplePlan.tasks[0]],
    }).length,
  );
  assert.throws(() => repair(samplePlan, schedule(samplePlan), -1));
});
test("deterministic dependencies and no overlaps", () => {
  const p = {
    ...samplePlan,
    tasks: [
      { id: "prep", name: "Prepare", duration: 2, capacity: 7 },
      { id: "observe", name: "Observe", duration: 4, capacity: 4 },
      { id: "draw", name: "Draw", duration: 3, capacity: 14 },
    ],
  };
  const a = schedule(p);
  invariant(p, a);
  assert.deepEqual(schedule(p), a);
});
test("loss preserves history and unaffected active turns; interrupted turn restarts fully", () => {
  const p = { ...samplePlan, tasks: [{ ...samplePlan.tasks[0], capacity: 4 }] };
  const original = schedule(p);
  for (const time of [0, 4, 5, 12, 28, 30]) {
    const r = repair(p, original, time);
    invariant(r.plan, r.schedule, time);
    for (const slot of original.slots.filter(
      (s) =>
        s.end <= time || (s.start < time && s.end > time && s.resource !== 3),
    ))
      assert.ok(
        r.schedule.slots.some(
          (s) => JSON.stringify(s) === JSON.stringify(slot),
        ),
      );
    for (const slot of r.disruption.interrupted) {
      const restarted = r.schedule.slots.find(
        (s) => s.learner === slot.learner && s.task === slot.task,
      );
      if (restarted) {
        assert.ok(restarted.start >= time);
        assert.equal(restarted.end - restarted.start, 4);
      }
      assert.ok(!r.disruption.completed.includes(slot));
    }
  }
});
test("last resource can fail; historical completed turns still count", () => {
  const p = {
    ...samplePlan,
    learners: ["One", "Two", "Three"],
    tasks: [{ ...samplePlan.tasks[0], capacity: 1 }],
  };
  const r = repair(p, schedule(p), 5);
  assert.equal(r.plan.tasks[0].capacity, 0);
  assert.equal(r.schedule.served, 1);
  assert.equal(r.disruption.interrupted.length, 1);
  invariant(r.plan, r.schedule, 5);
});
test("100 bounded random plans satisfy independent invariants and repair invariants", () => {
  let seed = 8321;
  const next = (n: number) => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed % n;
  };
  for (let i = 0; i < 100; i++) {
    const p: Plan = {
      title: "Property fixture",
      learners: Array.from({ length: next(30) + 1 }, (_, j) => `L${j}`),
      minutes: next(50) + 5,
      tasks: Array.from({ length: next(4) + 1 }, (_, j) => ({
        id: `t${j}`,
        name: `Task ${j}`,
        duration: next(10) + 1,
        capacity: next(8) + 1,
      })),
    };
    const r = schedule(p);
    invariant(p, r);
    const minute = next(p.minutes + 1);
    const repaired = repair(p, r, minute);
    invariant(repaired.plan, repaired.schedule, minute);
  }
});

test("a turn longer than the session has no finite equipment fix", () => {
  const p = {
    ...samplePlan,
    minutes: 5,
    tasks: [{ ...samplePlan.tasks[0], duration: 6 }],
  };
  assert.equal(schedule(p).served, 0);
  assert.equal(capacityProof(p).neededResources, null);
});
