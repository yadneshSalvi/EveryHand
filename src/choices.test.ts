import test from "node:test";
import assert from "node:assert/strict";
import {
  samplePlan,
  schedule,
  repair,
  type Plan,
  type Schedule,
} from "./solver.ts";
import {
  createChoiceContext,
  generateChoices,
  applyChoice,
  choiceRevision,
  type ChoiceContext,
} from "./choices.ts";
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
function valid(p: Plan, r: Schedule, context: ChoiceContext) {
  for (const s of r.slots) {
    const t = p.tasks.find((t) => t.id === s.task)!;
    assert.equal(s.end - s.start, t.duration);
    assert.ok(s.start >= 0 && s.end <= p.minutes);
    for (const a of r.slots)
      if (
        a !== s &&
        (a.learner === s.learner ||
          (a.task === s.task && a.resource === s.resource))
      )
        assert.ok(a.end <= s.start || s.end <= a.start);
    const ti = p.tasks.indexOf(t);
    if (ti)
      assert.ok(
        r.slots.some(
          (a) =>
            a.learner === s.learner &&
            a.task === p.tasks[ti - 1].id &&
            a.end <= s.start,
        ),
      );
  }
  for (const s of context.protectedSlots)
    assert.ok(r.slots.some((a) => JSON.stringify(a) === JSON.stringify(s)));
  assert.equal(r.served, p.learners.length);
}
test("baseline choices preserve full turns: +10 minutes or +1 place, with exact named gains", () => {
  const context = createChoiceContext(samplePlan, schedule(samplePlan));
  const unchanged = JSON.stringify(context);
  const choices = generateChoices(context);
  const time = choices.candidates.find((c) => c.kind === "time")!,
    equipment = choices.candidates.find((c) => c.kind === "equipment")!;
  assert.equal(time.plan.minutes, 40);
  assert.equal(time.extraMinutes, 10);
  assert.equal(time.delta.movedTurns, 0);
  assert.equal(time.delta.addedTurns, 7);
  assert.equal(equipment.plan.minutes, 30);
  assert.equal(equipment.plan.tasks[0].capacity, 4);
  assert.equal(Math.max(...equipment.result.slots.map((s) => s.end)), 28);
  for (const c of choices.candidates) {
    assert.equal(c.evidence.kind, "exact");
    assert.deepEqual(c.delta.gained, [21, 22, 23, 24, 25, 26, 27]);
    assert.deepEqual(c.delta.lost, []);
    valid(c.plan, c.result, context);
    assert.deepEqual(applyChoice(context, c).result, c.result);
  }
  assert.equal(JSON.stringify(context), unchanged);
});
test("loss-specific time minimum is 36; history and surviving active turns stay identical", () => {
  const four = {
    ...samplePlan,
    tasks: [{ ...samplePlan.tasks[0], capacity: 4 }],
  };
  for (const minute of [5, 8]) {
    const loss = repair(four, schedule(four), minute);
    const context = createChoiceContext(
      loss.plan,
      loss.schedule,
      loss.disruption,
    );
    const choices = generateChoices(context);
    const time = choices.candidates.find((c) => c.kind === "time")!,
      equipment = choices.candidates.find((c) => c.kind === "equipment")!;
    assert.equal(time.plan.minutes, 36);
    assert.equal(time.extraMinutes, 6);
    assert.equal(equipment.plan.tasks[0].capacity, 4);
    assert.equal(
      Math.max(...equipment.result.slots.map((s) => s.end)),
      minute === 5 ? 29 : 28,
    );
    assert.equal(time.delta.preservedCompleted, minute === 5 ? 4 : 8);
    assert.equal(time.delta.preservedActive, minute === 5 ? 3 : 0);
    for (const c of choices.candidates) {
      valid(c.plan, c.result, context);
      assert.deepEqual(applyChoice(context, c).result, c.result);
      assert.equal(c.evidence.kind, "exact");
    }
  }
});
test("zero remaining places has no time-only fix; replacement starts at the cutoff", () => {
  const p = {
    ...samplePlan,
    learners: ["One", "Two", "Three"],
    tasks: [{ ...samplePlan.tasks[0], capacity: 1 }],
  };
  const loss = repair(p, schedule(p), 5);
  const context = createChoiceContext(
    loss.plan,
    loss.schedule,
    loss.disruption,
  );
  const r = generateChoices(context);
  assert.ok(!r.candidates.some((c) => c.kind === "time"));
  const equipment = r.candidates.find((c) => c.kind === "equipment")!;
  assert.equal(equipment.plan.tasks[0].capacity, 1);
  assert.equal(equipment.delta.preservedCompleted, 1);
  assert.ok(
    equipment.result.slots
      .filter((s) => s.learner !== 0)
      .every((s) => s.start >= 5),
  );
  valid(equipment.plan, equipment.result, context);
});
test("turn longer than the horizon has no equipment-only fix", () => {
  const p = {
    ...samplePlan,
    minutes: 5,
    tasks: [{ ...samplePlan.tasks[0], duration: 6 }],
  };
  const context = createChoiceContext(p, schedule(p));
  const r = generateChoices(context);
  assert.ok(!r.candidates.some((c) => c.kind === "equipment"));
  assert.equal(r.candidates.find((c) => c.kind === "time")!.plan.minutes, 60);
  assert.match(
    r.unavailable.find((c) => c.kind === "equipment")!.reason,
    /longer than the session/,
  );
});
test("stale, shortened, falsified schedule and falsified consequence candidates are rejected", () => {
  const context = createChoiceContext(samplePlan, schedule(samplePlan));
  const c = generateChoices(context).candidates[0];
  const stale = createChoiceContext(
    { ...samplePlan, title: "Changed" },
    schedule(samplePlan),
  );
  assert.throws(() => applyChoice(stale, c), /out of date/);
  const altered = clone(c);
  altered.plan.tasks[0].duration = 3;
  assert.throws(() => applyChoice(context, altered), /full turn/);
  const bad = clone(c);
  bad.result.slots[0].end++;
  assert.throws(() => applyChoice(context, bad), /protected turns/);
  const falseGain = clone(c);
  falseGain.delta.gained = [];
  assert.throws(() => applyChoice(context, falseGain), /evidence/);
  const mutated = clone(context);
  mutated.plan.learners[0] = "Someone else";
  assert.notEqual(choiceRevision(context), choiceRevision(mutated));
  assert.throws(() => applyChoice(mutated, c), /out of date/);
});
test("multi-activity candidates are verified heuristic results and no-option search is bounded", () => {
  const p = {
    ...samplePlan,
    learners: samplePlan.learners.slice(0, 12),
    minutes: 10,
    tasks: [
      { id: "prep", name: "Prepare", duration: 2, capacity: 6 },
      { id: "observe", name: "Observe", duration: 5, capacity: 3 },
    ],
  };
  const context = createChoiceContext(p, schedule(p));
  const r = generateChoices(context);
  assert.ok(r.candidates.length);
  for (const c of r.candidates) {
    assert.equal(c.evidence.kind, "verified");
    assert.match(c.evidence.summary, /Another ordering/);
    valid(c.plan, c.result, context);
  }
  const blocked = {
    title: "Bounded fixture",
    learners: Array.from({ length: 60 }, (_, i) => `L${i}`),
    minutes: 120,
    tasks: Array.from({ length: 4 }, (_, i) => ({
      id: `t${i}`,
      name: `Task ${i}`,
      duration: 30,
      capacity: 16,
    })),
  };
  const result = generateChoices(
    createChoiceContext(blocked, schedule(blocked)),
  );
  assert.equal(result.candidates.length, 0);
  assert.match(
    result.unavailable.find((c) => c.kind === "time")!.reason,
    /120-minute/,
  );
  assert.match(
    result.unavailable.find((c) => c.kind === "equipment")!.reason,
    /Combined equipment changes/,
  );
});
test("30 varied baseline/loss contexts keep independent slot and delta invariants", () => {
  for (let i = 0; i < 30; i++) {
    const p: Plan = {
      title: "Choice property fixture",
      learners: Array.from({ length: 4 + (i % 15) }, (_, j) => `L${j}`),
      minutes: 5 + (i % 13),
      tasks: [
        {
          id: "turn",
          name: "Turn",
          duration: 2 + (i % 5),
          capacity: 1 + (i % 4),
        },
      ],
    };
    const initial = schedule(p);
    const loss = i % 2 ? repair(p, initial, Math.min(3, p.minutes)) : null;
    const context = createChoiceContext(
      loss?.plan ?? p,
      loss?.schedule ?? initial,
      loss?.disruption ?? null,
    );
    const before = JSON.stringify(context);
    for (const c of generateChoices(context).candidates) {
      valid(c.plan, c.result, context);
      assert.equal(
        c.delta.gained.length,
        context.plan.learners.length - context.result.served,
      );
      assert.equal(c.delta.lost.length, 0);
      assert.ok(
        c.result.slots.every((s) => s.end - s.start === p.tasks[0].duration),
      );
      applyChoice(context, c);
    }
    assert.equal(JSON.stringify(context), before);
  }
});

test("applying a candidate enforces the current time/equipment locks", () => {
  const context = createChoiceContext(samplePlan, schedule(samplePlan));
  const r = generateChoices(context);
  const time = r.candidates.find((c) => c.kind === "time")!,
    equipment = r.candidates.find((c) => c.kind === "equipment")!;
  assert.throws(
    () => applyChoice(context, time, { finishTime: true, equipment: false }),
    /locked/,
  );
  assert.throws(
    () =>
      applyChoice(context, equipment, { finishTime: false, equipment: true }),
    /locked/,
  );
  assert.equal(
    applyChoice(context, time, { finishTime: false, equipment: true }).result
      .served,
    28,
  );
});
