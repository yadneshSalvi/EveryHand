export interface Task {
  id: string;
  name: string;
  duration: number;
  capacity: number;
}
export interface Plan {
  title: string;
  learners: string[];
  minutes: number;
  tasks: Task[];
  origin?: "example" | "custom";
}
export interface Slot {
  learner: number;
  task: string;
  resource: number;
  start: number;
  end: number;
}
export interface Missing {
  learner: number;
  task: string;
}
export interface Schedule {
  slots: Slot[];
  unserved: Missing[];
  served: number;
}
export interface Disruption {
  minute: number;
  task: string;
  resource: number;
  completed: Slot[];
  interrupted: Slot[];
  before: number;
}
export const sampleNames = [
  "Aarav",
  "Ada",
  "Amara",
  "Arjun",
  "Ava",
  "Ben",
  "Chloe",
  "Dev",
  "Ella",
  "Ethan",
  "Fatima",
  "Finn",
  "Grace",
  "Hana",
  "Ishaan",
  "Ivy",
  "Jai",
  "Leo",
  "Luna",
  "Maya",
  "Mia",
  "Noah",
  "Oliver",
  "Priya",
  "Riya",
  "Sam",
  "Sofia",
  "Zara",
];
export const samplePlan: Plan = {
  origin: "example",
  title: "A closer look at the little things",
  learners: sampleNames,
  minutes: 30,
  tasks: [
    { id: "observe", name: "Observe a specimen", duration: 4, capacity: 3 },
  ],
};
export function validatePlan(
  value: unknown,
  allowZeroCapacity = false,
): string[] {
  if (!value || typeof value !== "object")
    return ["A lesson plan is required."];
  const p = value as Plan,
    errors: string[] = [];
  if (typeof p.title !== "string" || !p.title.trim() || p.title.length > 120)
    errors.push("Give your lesson a title of 1–120 characters.");
  if (
    !Array.isArray(p.learners) ||
    p.learners.length < 1 ||
    p.learners.length > 60 ||
    p.learners.some((n) => typeof n !== "string" || !n.trim() || n.length > 40)
  )
    errors.push("Use 1–60 learner labels, each 1–40 characters.");
  if (!Number.isInteger(p.minutes) || p.minutes < 5 || p.minutes > 120)
    errors.push("Session length must be a whole number from 5 to 120 minutes.");
  if (!Array.isArray(p.tasks) || p.tasks.length < 1 || p.tasks.length > 4)
    errors.push("Add 1–4 ordered activities.");
  else {
    if (new Set(p.tasks.map((t) => t?.id)).size !== p.tasks.length)
      errors.push("Activities need unique identifiers.");
    p.tasks.forEach((t, i) => {
      if (
        !t ||
        typeof t.id !== "string" ||
        !t.id.trim() ||
        t.id.length > 80 ||
        typeof t.name !== "string" ||
        !t.name.trim() ||
        t.name.length > 80
      )
        errors.push(`Activity ${i + 1} needs a name and identifier.`);
      if (!Number.isInteger(t?.duration) || t.duration < 1 || t.duration > 30)
        errors.push(`Activity ${i + 1}: use 1–30 whole minutes per learner.`);
      if (
        !Number.isInteger(t?.capacity) ||
        t.capacity < (allowZeroCapacity ? 0 : 1) ||
        t.capacity > 16
      )
        errors.push(`Activity ${i + 1}: use 1–16 simultaneous places.`);
    });
  }
  return errors;
}
const pair = (learner: number, task: string) => `${learner}|${task}`;
/** Deterministic list scheduling; capacity bounds are proofs, heuristic shortfalls aren't. */
export function schedule(
  plan: Plan,
  options: {
    from?: number;
    retained?: Slot[];
    allowZeroCapacity?: boolean;
  } = {},
): Schedule {
  const errors = validatePlan(plan, options.allowZeroCapacity);
  if (errors.length) throw new Error(errors.join(" "));
  const from = options.from ?? 0;
  if (!Number.isInteger(from) || from < 0 || from > plan.minutes)
    throw new Error("Invalid resume minute.");
  const slots: Slot[] = (options.retained ?? []).map((s) => ({ ...s }));
  const assigned = new Set(slots.map((s) => pair(s.learner, s.task)));
  for (let time = from; time < plan.minutes; time++) {
    // Downstream work first avoids keeping a scarce predecessor occupied needlessly.
    for (let ti = plan.tasks.length - 1; ti >= 0; ti--) {
      const task = plan.tasks[ti];
      if (time + task.duration > plan.minutes) continue;
      const ready = plan.learners
        .map((_, i) => i)
        .filter((learner) => {
          if (assigned.has(pair(learner, task.id))) return false;
          if (
            slots.some(
              (s) => s.learner === learner && s.start <= time && s.end > time,
            )
          )
            return false;
          return (
            ti === 0 ||
            slots.some(
              (s) =>
                s.learner === learner &&
                s.task === plan.tasks[ti - 1].id &&
                s.end <= time,
            )
          );
        })
        .sort(
          (a, b) =>
            slots.filter((s) => s.learner === a && s.end <= time).length -
              slots.filter((s) => s.learner === b && s.end <= time).length ||
            a - b,
        );
      for (
        let resource = 0;
        resource < task.capacity && ready.length;
        resource++
      ) {
        if (
          slots.some(
            (s) =>
              s.task === task.id &&
              s.resource === resource &&
              s.start <= time &&
              s.end > time,
          )
        )
          continue;
        const learner = ready.shift()!;
        slots.push({
          learner,
          task: task.id,
          resource,
          start: time,
          end: time + task.duration,
        });
        assigned.add(pair(learner, task.id));
      }
    }
  }
  slots.sort(
    (a, b) =>
      a.start - b.start ||
      plan.tasks.findIndex((t) => t.id === a.task) -
        plan.tasks.findIndex((t) => t.id === b.task) ||
      a.learner - b.learner,
  );
  const unserved = plan.learners.flatMap((_, learner) =>
    plan.tasks
      .filter((t) => !assigned.has(pair(learner, t.id)))
      .map((t) => ({ learner, task: t.id })),
  );
  return {
    slots,
    unserved,
    served: plan.learners.filter((_, i) =>
      plan.tasks.every((t) => assigned.has(pair(i, t.id))),
    ).length,
  };
}
export function repair(
  plan: Plan,
  original: Schedule,
  minute: number,
  taskId = plan.tasks[0].id,
): { plan: Plan; schedule: Schedule; disruption: Disruption } {
  if (!Number.isInteger(minute) || minute < 0 || minute > plan.minutes)
    throw new Error("Choose a valid loss minute.");
  const task = plan.tasks.find((t) => t.id === taskId);
  if (!task || task.capacity < 1)
    throw new Error("No resource is available to remove.");
  const resource = task.capacity - 1;
  const completed = original.slots.filter((s) => s.end <= minute);
  const interrupted = original.slots.filter(
    (s) =>
      s.task === taskId &&
      s.resource === resource &&
      s.start < minute &&
      s.end > minute,
  );
  const retained = original.slots.filter(
    (s) =>
      s.end <= minute ||
      (s.start < minute &&
        s.end > minute &&
        !(s.task === taskId && s.resource === resource)),
  );
  const nextPlan = {
    ...plan,
    tasks: plan.tasks.map((t) =>
      t.id === taskId ? { ...t, capacity: t.capacity - 1 } : { ...t },
    ),
  };
  return {
    plan: nextPlan,
    schedule: schedule(nextPlan, {
      from: minute,
      retained,
      allowZeroCapacity: true,
    }),
    disruption: {
      minute,
      task: taskId,
      resource,
      completed,
      interrupted,
      before: original.served,
    },
  };
}
export function capacityProof(plan: Plan, task = plan.tasks[0]) {
  return {
    required: plan.learners.length * task.duration,
    available: task.capacity * plan.minutes,
    wholeTurns: task.capacity * Math.floor(plan.minutes / task.duration),
    neededResources:
      task.duration > plan.minutes
        ? null
        : Math.ceil(
            plan.learners.length / Math.floor(plan.minutes / task.duration),
          ),
  };
}
export function learnerState(
  index: number,
  plan: Plan,
  result: Schedule,
  minute: number,
): "complete" | "active" | "waiting" | "unserved" {
  const mine = result.slots.filter((s) => s.learner === index);
  if (
    plan.tasks.every((t) =>
      mine.some((s) => s.task === t.id && s.end <= minute),
    )
  )
    return "complete";
  if (mine.some((s) => s.start <= minute && s.end > minute)) return "active";
  if (result.unserved.some((s) => s.learner === index)) return "unserved";
  return "waiting";
}
