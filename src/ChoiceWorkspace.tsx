import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Info,
  LockKeyhole,
  Plus,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import Modal from "./Modal";
import {
  generateChoices,
  type ChoiceContext,
  type ChoiceCandidate,
  type ChoiceLocks,
  type ChoiceSearch,
} from "./choices";
import type { Slot } from "./solver";
export default function ChoiceWorkspace({
  context,
  onClose,
  onApply,
  onEdit,
}: {
  context: ChoiceContext;
  onClose: () => void;
  onApply: (candidate: ChoiceCandidate, locks: ChoiceLocks) => void;
  onEdit: () => void;
}) {
  const [search, setSearch] = useState<ChoiceSearch | null>(null),
    [error, setError] = useState("");
  const [locks, setLocks] = useState<ChoiceLocks>({
    finishTime: false,
    equipment: false,
  });
  const [selectedKind, setSelectedKind] = useState<"time" | "equipment">(
    "time",
  );
  const [learner, setLearner] = useState(0);
  useEffect(() => {
    let active = true;
    setSearch(null);
    setError("");
    const timer = setTimeout(() => {
      try {
        const next = generateChoices(context);
        if (active) {
          setSearch(next);
          setSelectedKind(next.candidates[0]?.kind ?? "time");
          const gains = next.candidates[0]?.delta.gained ?? [];
          setLearner(gains[gains.length - 1] ?? 0);
        }
      } catch {
        if (active)
          setError(
            "The comparison could not be prepared. Your current plan is unchanged.",
          );
      }
    }, 30);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [context]);
  const allowed = (c: ChoiceCandidate) =>
    !(c.kind === "time" ? locks.finishTime : locks.equipment);
  const options = search?.candidates ?? [];
  const selected =
    options.find((c) => c.kind === selectedKind && allowed(c)) ??
    options.find(allowed);
  useEffect(() => {
    if (!selected) return;
    const gains = selected.delta.gained;
    setLearner((v) => (gains.includes(v) ? v : (gains[gains.length - 1] ?? 0)));
  }, [selected?.id]);
  const fullDurations = context.plan.tasks
    .map((t) => `${t.duration} min`)
    .join(" → ");
  const changedLearners = useMemo(
    () => new Set(selected?.delta.changed.map((c) => c.learner) ?? []),
    [selected],
  );
  const gainedLearner = selected?.delta.gained.at(-1);
  const gainedChange = selected?.delta.changed.find(
    (change) => change.learner === gainedLearner,
  );
  const gainedTurn = gainedChange?.after.find(
    (slot) => !gainedChange.before.some((before) => before.task === slot.task),
  );
  const gainedTask = selected?.plan.tasks.find(
    (task) => task.id === gainedTurn?.task,
  );
  function apply() {
    if (!selected) return;
    try {
      onApply(selected, locks);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "This comparison needs to be reopened.",
      );
    }
  }
  return (
    <Modal
      title="Keep the turn. Find the room."
      subtitle={`${context.plan.learners.length - context.result.served} ${context.plan.learners.length - context.result.served === 1 ? "learner still needs" : "learners still need"} a full path.`}
      onClose={onClose}
      wide
      className="choice-workspace"
    >
      <div className="choice-body">
        <div className="choice-scroll">
          <div className="promise-line">
            <span>
              <LockKeyhole size={15} />
              <b>Full turn lengths stay fixed</b>
            </span>
            <strong>{fullDurations}</strong>
          </div>
          {context.disruption && (
            <div className="history-lock">
              <ShieldCheck size={17} />
              <div>
                <b>Work already done stays done.</b>
                <span>
                  {
                    context.protectedSlots.filter(
                      (s) => s.end <= context.cutoff,
                    ).length
                  }{" "}
                  completed and{" "}
                  {
                    context.protectedSlots.filter((s) => s.end > context.cutoff)
                      .length
                  }{" "}
                  active turns are locked at minute {context.cutoff}. New places
                  are available from that cutoff.
                </span>
              </div>
            </div>
          )}
          <div className="choice-question">
            <h3>What has to stay fixed?</h3>
          </div>
          <div className="constraint-locks">
            <label className={locks.equipment ? "locked" : ""}>
              <input
                type="checkbox"
                checked={locks.equipment}
                onChange={(e) =>
                  setLocks({ ...locks, equipment: e.target.checked })
                }
              />
              <span>
                <b>I can’t find extra places</b>
              </span>
              <LockKeyhole size={15} />
            </label>
            <label className={locks.finishTime ? "locked" : ""}>
              <input
                type="checkbox"
                checked={locks.finishTime}
                onChange={(e) =>
                  setLocks({ ...locks, finishTime: e.target.checked })
                }
              />
              <span>
                <b>We must finish at {context.plan.minutes}:00</b>
              </span>
              <LockKeyhole size={15} />
            </label>
          </div>
          {!search && !error && (
            <div className="choice-loading" role="status">
              <Sparkles size={22} />
              <h3>Making space, one full turn at a time.</h3>
              <p>Checking real schedules. Your workshop hasn’t changed.</p>
            </div>
          )}
          {search && (
            <>
              <div
                className={`choice-overview ${gainedTurn && gainedTask ? "has-preview" : ""}`}
              >
                <div
                  className="choice-options"
                  role="group"
                  aria-label="Preview a proposed plan"
                >
                  {(["time", "equipment"] as const).map((kind) => {
                    const c = options.find((c) => c.kind === kind),
                      disabled = !!c && !allowed(c);
                    return (
                      <button
                        key={kind}
                        className={`choice-option ${selected?.kind === kind ? "selected" : ""} ${disabled ? "locked-option" : ""}`}
                        disabled={!c || disabled}
                        aria-pressed={selected?.kind === kind}
                        onClick={() => {
                          setSelectedKind(kind);
                          setError("");
                        }}
                      >
                        <div className="option-top">
                          <span>
                            {kind === "time" ? (
                              <Clock3 size={17} />
                            ) : (
                              <Plus size={18} />
                            )}{" "}
                            {kind === "time"
                              ? "KEEP THE EQUIPMENT"
                              : "KEEP THE FINISH TIME"}
                          </span>
                          {selected?.kind === kind ? (
                            <CheckCircle2 size={18} />
                          ) : (
                            <i />
                          )}
                        </div>
                        {c ? (
                          <>
                            <h3>
                              +
                              {kind === "time" ? c.extraMinutes : c.extraPlaces}{" "}
                              <em>
                                {kind === "time"
                                  ? "minutes"
                                  : c.extraPlaces === 1
                                    ? "place"
                                    : "places"}
                              </em>
                            </h3>
                            <p>
                              {kind === "time"
                                ? `${context.plan.minutes} → ${c.plan.minutes} minutes. The same equipment.`
                                : `${context.plan.tasks.find((t) => t.id === c.changedTask)?.capacity} → ${c.plan.tasks.find((t) => t.id === c.changedTask)?.capacity} places for ${c.plan.tasks.find((t) => t.id === c.changedTask)?.name}.`}
                            </p>
                            <div className="option-result">
                              <span>
                                <UsersRound size={14} />
                                <b>
                                  {c.result.served}/{c.plan.learners.length}
                                </b>{" "}
                                full paths
                              </span>
                              <small>
                                {disabled
                                  ? "Changes a locked limit"
                                  : c.evidence.kind === "exact"
                                    ? "Exact minimum"
                                    : "Verified option"}
                              </small>
                            </div>
                          </>
                        ) : (
                          <>
                            <h3 className="unavailable-title">
                              No full plan
                              <br />
                              <em>in this search.</em>
                            </h3>
                            <p>
                              {
                                search.unavailable.find((u) => u.kind === kind)
                                  ?.reason
                              }
                            </p>
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
                {selected &&
                  gainedLearner !== undefined &&
                  gainedTurn &&
                  gainedTask && (
                    <section
                      className="choice-snapshot"
                      aria-label="Named learner proof for selected option"
                      aria-live="polite"
                      aria-atomic="true"
                    >
                      <div className="snapshot-heading">
                        <span className="eyebrow">A LEARNER’S PATH</span>
                        <span className="preview-only">Preview only</span>
                      </div>
                      <h3>
                        {context.plan.learners[gainedLearner]}{" "}
                        <em>gains a full path.</em>
                      </h3>
                      <p className="snapshot-task">
                        {gainedTask.name}
                        <span>{gainedTask.duration} full minutes</span>
                      </p>
                      <div className="snapshot-change">
                        <div className="snapshot-before">
                          <span>Current plan</span>
                          <strong>No full turn</strong>
                        </div>
                        <ArrowRight size={17} aria-hidden="true" />
                        <div className="snapshot-after">
                          <span>With this choice</span>
                          <strong>
                            {gainedTurn.start}:00 – {gainedTurn.end}:00
                          </strong>
                          <small>Place {gainedTurn.resource + 1}</small>
                        </div>
                      </div>
                      <p className="snapshot-gain">
                        <Check size={14} aria-hidden="true" />
                        {selected.delta.gained.length}{" "}
                        {selected.delta.gained.length === 1
                          ? "more learner gets a full path"
                          : "more learners get full paths"}
                      </p>
                    </section>
                  )}
              </div>
              {!selected && (
                <div className="locked-explanation" role="status">
                  <LockKeyhole size={18} />
                  <p>
                    {locks.equipment && locks.finishTime
                      ? `The current schedule leaves ${context.plan.learners.length - context.result.served} learners without a full path. Unlock time or equipment to compare these changes.`
                      : "No complete alternative was found within these search limits. Review the activity assumptions or edit the plan."}
                  </p>
                </div>
              )}
              {selected && (
                <section
                  className="consequence-panel"
                  aria-label="Actual learner consequences of preview"
                >
                  <div className="consequence-heading">
                    <div>
                      <span className="eyebrow">
                        THE PEOPLE THIS MAKES ROOM FOR
                      </span>
                      <h3>
                        {selected.delta.gained.length} more learners.
                        <br className="mobile-choice-break" />{" "}
                        <em>A complete path for each.</em>
                      </h3>
                    </div>
                    <span className="preview-only">Preview only</span>
                  </div>
                  <div
                    className="gained-learners"
                    aria-label="Choose a learner whose full path is gained"
                  >
                    {selected.delta.gained.map((i) => (
                      <button
                        key={i}
                        aria-pressed={learner === i}
                        className={learner === i ? "selected" : ""}
                        onClick={() => setLearner(i)}
                      >
                        <span>{String(i + 1).padStart(2, "0")}</span>
                        {context.plan.learners[i]}
                        {learner === i && <Check size={12} />}
                      </button>
                    ))}
                  </div>
                  <div className="learner-proof">
                    <div className="proof-person">
                      <b>
                        {context.plan.learners[learner]}’s full turn
                        {context.plan.tasks.length > 1 ? "s" : ""}
                      </b>
                      <label>
                        Inspect another learner
                        <select
                          aria-label="Inspect another learner in the comparison"
                          value={learner}
                          onChange={(e) => setLearner(+e.target.value)}
                        >
                          {context.plan.learners.map((name, i) => (
                            <option key={i} value={i}>
                              {name}
                              {selected.delta.gained.includes(i)
                                ? " · gains a full path"
                                : changedLearners.has(i)
                                  ? " · times change"
                                  : " · unchanged"}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <TurnPath
                      label="Current plan"
                      plan={context.plan}
                      slots={context.result.slots.filter(
                        (s) => s.learner === learner,
                      )}
                      variant="before"
                    />
                    <TurnPath
                      label="With this choice"
                      plan={selected.plan}
                      slots={selected.result.slots.filter(
                        (s) => s.learner === learner,
                      )}
                      variant="after"
                    />
                  </div>
                  <div className="change-account">
                    <span>
                      <Check size={13} />
                      {selected.delta.addedTurns} full turns added
                    </span>
                    <span>{selected.delta.movedTurns} existing turns move</span>
                    <span>No learner loses a full path</span>
                  </div>
                  <details className="choice-evidence">
                    <summary>
                      <Info size={14} />
                      {selected.evidence.kind === "exact"
                        ? "Why this is the smallest change"
                        : "What this verified option means"}
                    </summary>
                    <p>{selected.evidence.summary}</p>
                    {selected.evidence.kind === "verified" && (
                      <p>
                        We search later session lengths and increases to one
                        activity’s places. Other activity orders or combined
                        equipment changes may do better. Search limits: 120
                        minutes and 16 places per activity.
                      </p>
                    )}
                    <p>
                      {context.disruption
                        ? "Completed and unaffected active intervals remain exactly as they were."
                        : "Every turn keeps the original full duration and activity order."}
                    </p>
                  </details>
                </section>
              )}
            </>
          )}
          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}
        </div>
        <div className="choice-actions">
          <button className="text-button" onClick={onEdit}>
            Edit the assumptions instead <ArrowRight size={14} />
          </button>
          <div>
            <span>Your current plan stays put until you apply.</span>
            <button
              className="button dark"
              onClick={apply}
              disabled={!selected || !search}
            >
              Apply this plan <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
function TurnPath({
  label,
  plan,
  slots,
  variant,
}: {
  label: string;
  plan: ChoiceContext["plan"];
  slots: Slot[];
  variant: "before" | "after";
}) {
  return (
    <div className={`turn-path ${variant}`}>
      <div className="path-label">
        <span>{label}</span>
        <small>Ends at {plan.minutes}:00</small>
      </div>
      <ol>
        {plan.tasks.map((t, i) => {
          const s = slots.find((s) => s.task === t.id);
          return (
            <li key={t.id} className={s ? "has-turn" : "missing-turn"}>
              <span className="path-step">{i + 1}</span>
              <div>
                <b>{t.name}</b>
                <strong>
                  {s ? `${s.start}:00 – ${s.end}:00` : "No full turn"}
                </strong>
                <small>
                  {s
                    ? `${t.duration} full minutes · Place ${s.resource + 1}`
                    : "Needs another opportunity"}
                </small>
              </div>
              {s ? <Check size={15} /> : <span className="path-gap">—</span>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
