import {
  schedule,
  validatePlan,
  type Plan,
  type Schedule,
  type Slot,
  type Disruption,
} from "./solver";

export interface ChoiceLocks {
  finishTime: boolean;
  equipment: boolean;
}
export interface ChoiceContext {
  plan: Plan;
  result: Schedule;
  disruption: Disruption | null;
  cutoff: number;
  protectedSlots: Slot[];
}
export interface LearnerChange {
  learner: number;
  before: Slot[];
  after: Slot[];
}
export interface ChoiceDelta {
  gained: number[];
  lost: number[];
  changed: LearnerChange[];
  addedTurns: number;
  movedTurns: number;
  preservedCompleted: number;
  preservedActive: number;
}
export interface ChoiceCandidate {
  id: string;
  kind: "time" | "equipment";
  baseRevision: string;
  plan: Plan;
  result: Schedule;
  extraMinutes: number;
  extraPlaces: number;
  changedTask: string | null;
  evidence: { kind: "exact" | "verified"; summary: string };
  delta: ChoiceDelta;
}
export interface ChoiceSearch {
  baseRevision: string;
  candidates: ChoiceCandidate[];
  unavailable: { kind: "time" | "equipment"; reason: string }[];
}
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const key = (slot: Slot) => `${slot.learner}|${slot.task}`;
const same = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);
export function createChoiceContext(
  plan: Plan,
  result: Schedule,
  disruption: Disruption | null = null,
): ChoiceContext {
  const errors = validatePlan(plan, !!disruption);
  if (errors.length) throw new Error(errors.join(" "));
  const cutoff = disruption?.minute ?? 0;
  return copy({
    plan,
    result,
    disruption,
    cutoff,
    protectedSlots: disruption
      ? result.slots.filter(
          (s) => s.end <= cutoff || (s.start < cutoff && s.end > cutoff),
        )
      : [],
  });
}
export function choiceRevision(context: ChoiceContext): string {
  return JSON.stringify(context);
}
function candidateSchedule(context: ChoiceContext, plan: Plan): Schedule {
  return schedule(plan, {
    from: context.cutoff,
    retained: context.protectedSlots,
    allowZeroCapacity: !!context.disruption,
  });
}
function servedLearners(plan: Plan, result: Schedule): number[] {
  return plan.learners
    .map((_, i) => i)
    .filter((i) =>
      plan.tasks.every((t) =>
        result.slots.some((s) => s.learner === i && s.task === t.id),
      ),
    );
}
export function choiceDelta(
  context: ChoiceContext,
  result: Schedule,
): ChoiceDelta {
  const before = servedLearners(context.plan, context.result),
    after = servedLearners(context.plan, result);
  const previous = new Map(context.result.slots.map((s) => [key(s), s]));
  return {
    gained: after.filter((i) => !before.includes(i)),
    lost: before.filter((i) => !after.includes(i)),
    changed: context.plan.learners
      .map((_, learner) => ({
        learner,
        before: context.result.slots.filter((s) => s.learner === learner),
        after: result.slots.filter((s) => s.learner === learner),
      }))
      .filter((c) => !same(c.before, c.after)),
    addedTurns: result.slots.filter((s) => !previous.has(key(s))).length,
    movedTurns: result.slots.filter(
      (s) => previous.has(key(s)) && !same(previous.get(key(s)), s),
    ).length,
    preservedCompleted: context.protectedSlots.filter(
      (s) => s.end <= context.cutoff,
    ).length,
    preservedActive: context.protectedSlots.filter(
      (s) => s.end > context.cutoff,
    ).length,
  };
}
/** Exact for one identical activity: locked turns plus each place's next-free-time capacity. */
export function singleActivityCapacity(
  context: ChoiceContext,
  plan: Plan,
): number {
  if (plan.tasks.length !== 1)
    throw new Error("This exact bound requires one activity.");
  const task = plan.tasks[0];
  let turns = context.protectedSlots.length;
  for (let resource = 0; resource < task.capacity; resource++) {
    const nextFree = Math.max(
      context.cutoff,
      ...context.protectedSlots
        .filter(
          (s) =>
            s.task === task.id &&
            s.resource === resource &&
            s.end > context.cutoff,
        )
        .map((s) => s.end),
    );
    turns += Math.max(0, Math.floor((plan.minutes - nextFree) / task.duration));
  }
  return Math.min(plan.learners.length, turns);
}
function makeCandidate(
  context: ChoiceContext,
  plan: Plan,
  result: Schedule,
  kind: ChoiceCandidate["kind"],
): ChoiceCandidate {
  const changed = plan.tasks.find(
    (t, i) => t.capacity !== context.plan.tasks[i].capacity,
  );
  const extraPlaces = plan.tasks.reduce(
    (n, t, i) => n + t.capacity - context.plan.tasks[i].capacity,
    0,
  );
  let summary =
    "Verified full paths. Another ordering may use fewer resources or finish sooner.";
  if (plan.tasks.length === 1) {
    const previous =
      kind === "time"
        ? { ...plan, minutes: plan.minutes - 1 }
        : {
            ...plan,
            tasks: [{ ...plan.tasks[0], capacity: plan.tasks[0].capacity - 1 }],
          };
    const previousCapacity = singleActivityCapacity(context, previous);
    summary =
      kind === "time"
        ? `${plan.minutes - 1} minutes fit at most ${previousCapacity} full paths; ${plan.minutes} minutes fit all ${plan.learners.length}.`
        : `${plan.tasks[0].capacity - 1} places fit at most ${previousCapacity} full paths by minute ${plan.minutes}; ${plan.tasks[0].capacity} places fit all ${plan.learners.length}.`;
  }
  return {
    id:
      kind === "time"
        ? `time-${plan.minutes}`
        : `equipment-${changed?.id}-${changed?.capacity}`,
    kind,
    baseRevision: choiceRevision(context),
    plan: copy(plan),
    result: copy(result),
    extraMinutes: plan.minutes - context.plan.minutes,
    extraPlaces,
    changedTask: changed?.id ?? null,
    evidence: { kind: plan.tasks.length === 1 ? "exact" : "verified", summary },
    delta: choiceDelta(context, result),
  };
}
export function generateChoices(context: ChoiceContext): ChoiceSearch {
  const baseRevision = choiceRevision(context);
  const candidates: ChoiceCandidate[] = [];
  const unavailable: ChoiceSearch["unavailable"] = [];
  if (context.result.served === context.plan.learners.length)
    return {
      baseRevision,
      candidates,
      unavailable: [
        {
          kind: "time",
          reason: "Everyone already has a complete path in this plan.",
        },
        {
          kind: "equipment",
          reason: "Everyone already has a complete path in this plan.",
        },
      ],
    };
  for (let minutes = context.plan.minutes + 1; minutes <= 120; minutes++) {
    const plan = { ...context.plan, minutes };
    const result = candidateSchedule(context, plan);
    if (result.served === plan.learners.length) {
      candidates.push(makeCandidate(context, plan, result, "time"));
      break;
    }
  }
  if (!candidates.some((c) => c.kind === "time"))
    unavailable.push({
      kind: "time",
      reason:
        context.plan.tasks.length === 1 && context.plan.tasks[0].capacity === 0
          ? "Extra time alone cannot help while no working place remains."
          : "No complete time-only plan was found within the 120-minute session limit.",
    });
  // Bounded one-activity equipment changes; combined multi-activity additions are not searched.
  for (let added = 1; added <= 16; added++) {
    const successes: ChoiceCandidate[] = [];
    for (let ti = 0; ti < context.plan.tasks.length; ti++) {
      if (context.plan.tasks[ti].capacity + added > 16) continue;
      const plan = {
        ...context.plan,
        tasks: context.plan.tasks.map((t, i) =>
          i === ti ? { ...t, capacity: t.capacity + added } : t,
        ),
      };
      const result = candidateSchedule(context, plan);
      if (result.served === plan.learners.length)
        successes.push(makeCandidate(context, plan, result, "equipment"));
    }
    if (successes.length) {
      successes.sort(
        (a, b) =>
          Math.max(...a.result.slots.map((s) => s.end)) -
          Math.max(...b.result.slots.map((s) => s.end)),
      );
      candidates.push(successes[0]);
      break;
    }
  }
  if (!candidates.some((c) => c.kind === "equipment"))
    unavailable.push({
      kind: "equipment",
      reason:
        context.plan.tasks.length === 1 &&
        context.plan.tasks[0].duration > context.plan.minutes
          ? "No number of places can fit a full turn longer than the session."
          : "No complete plan was found by increasing one activity to at most 16 places. Combined equipment changes are outside this search.",
    });
  return { baseRevision, candidates, unavailable };
}
/** Rechecks source, changed constraints and actual schedule; callers commit plan/result together. */
export function applyChoice(
  context: ChoiceContext,
  candidate: ChoiceCandidate,
  locks: ChoiceLocks = { finishTime: false, equipment: false },
): { plan: Plan; result: Schedule; delta: ChoiceDelta } {
  if (
    (candidate.kind === "time" && locks.finishTime) ||
    (candidate.kind === "equipment" && locks.equipment)
  )
    throw new Error("This choice changes a locked constraint.");
  if (candidate.baseRevision !== choiceRevision(context))
    throw new Error(
      "This comparison is out of date. Reopen it for your current plan.",
    );
  const plan = candidate.plan;
  const errors = validatePlan(plan, !!context.disruption);
  if (errors.length) throw new Error("This proposed plan is invalid.");
  if (
    plan.title !== context.plan.title ||
    plan.origin !== context.plan.origin ||
    !same(plan.learners, context.plan.learners) ||
    plan.tasks.length !== context.plan.tasks.length ||
    plan.tasks.some(
      (t, i) =>
        t.id !== context.plan.tasks[i].id ||
        t.name !== context.plan.tasks[i].name ||
        t.duration !== context.plan.tasks[i].duration,
    )
  )
    throw new Error(
      "A choice must preserve learners, activity order and every full turn.",
    );
  const changed = plan.tasks.filter(
    (t, i) => t.capacity !== context.plan.tasks[i].capacity,
  );
  if (
    candidate.kind === "time"
      ? plan.minutes <= context.plan.minutes || changed.length !== 0
      : candidate.kind !== "equipment" ||
        plan.minutes !== context.plan.minutes ||
        changed.length !== 1 ||
        changed[0].capacity <=
          context.plan.tasks.find((t) => t.id === changed[0].id)!.capacity
  )
    throw new Error("This choice changes a fixed constraint.");
  const result = candidateSchedule(context, plan);
  if (
    result.served !== plan.learners.length ||
    !same(result, candidate.result) ||
    context.protectedSlots.some((s) => !result.slots.some((a) => same(a, s)))
  )
    throw new Error(
      "The proposed schedule no longer matches the protected turns.",
    );
  const canonical = makeCandidate(context, plan, result, candidate.kind);
  if (
    !same(canonical.delta, candidate.delta) ||
    !same(canonical.evidence, candidate.evidence) ||
    canonical.id !== candidate.id ||
    canonical.extraMinutes !== candidate.extraMinutes ||
    canonical.extraPlaces !== candidate.extraPlaces ||
    canonical.changedTask !== candidate.changedTask
  )
    throw new Error("The comparison evidence does not match its schedule.");
  return { plan: copy(plan), result, delta: canonical.delta };
}
