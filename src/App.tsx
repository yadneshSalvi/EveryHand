import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  ChevronDown,
  Clock3,
  Copy,
  FileText,
  Hand,
  Info,
  Leaf,
  ListFilter,
  Minus,
  Plus,
  RotateCcw,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  UsersRound,
  X,
  Zap,
} from "lucide-react";
import Room, { Microscope } from "./Room";
import {
  capacityProof,
  learnerState,
  repair,
  samplePlan,
  schedule,
  validatePlan,
  type Plan,
  type Schedule,
  type Disruption,
} from "./solver";
type Dialog = "edit" | "import" | "export" | "about" | null;
interface Snapshot {
  plan: Plan;
  result: Schedule;
  disruption: Disruption | null;
}
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
function loadPlan(): Plan {
  try {
    const v = JSON.parse(localStorage.getItem("everyhand.plan.v1") || "null");
    if (v?.version === 1 && !validatePlan(v.plan).length) return v.plan;
  } catch {}
  return clone(samplePlan);
}
function Modal({
  title,
  subtitle,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const dialog = ref.current;
    const first = dialog?.querySelector<HTMLElement>(
      "button,input,textarea,select",
    );
    first?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key === "Tab" && dialog) {
        const all = Array.from(
          dialog.querySelectorAll<HTMLElement>(
            "button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled),a[href]",
          ),
        );
        const first = all[0],
          last = all[all.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = old;
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        className={`modal ${wide ? "wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <div className="modal-header">
          <div>
            <span className="eyebrow">EVERY HAND / THE STUDIO</span>
            <h2 id="dialog-title">{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button
            className="icon-button close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
export default function App() {
  const [plan, setPlan] = useState<Plan>(loadPlan);
  const [result, setResult] = useState<Schedule>(() => schedule(plan));
  const [minute, setMinute] = useState(() => Math.min(8, plan.minutes));
  const [playing, setPlaying] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [disruption, setDisruption] = useState<Disruption | null>(null);
  const [undo, setUndo] = useState<Snapshot | null>(null);
  const [toast, setToast] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const first = plan.tasks[0];
  const diagnosticTask =
    plan.tasks.find((t) => t.duration > plan.minutes) ||
    plan.tasks.find(
      (t) => capacityProof(plan, t).wholeTurns < plan.learners.length,
    ) ||
    first;
  const proof = capacityProof(plan, diagnosticTask);
  const finiteFix = proof.neededResources !== null;
  const provenShortfall = proof.wholeTurns < plan.learners.length;
  const missing = plan.learners.length - result.served;
  const servedPercent = Math.round(
    (result.served / plan.learners.length) * 100,
  );
  const [draft, setDraft] = useState(clone(plan));
  const [errors, setErrors] = useState<string[]>([]);
  const [importText, setImportText] = useState("");
  const [importBusy, setImportBusy] = useState(false);
  const [importError, setImportError] = useState("");
  const [assumptions, setAssumptions] = useState<string[]>([]);
  const closeDialog = useRef(() => setDialog(null)).current;
  useEffect(() => {
    if (!disruption)
      try {
        localStorage.setItem(
          "everyhand.plan.v1",
          JSON.stringify({ version: 1, plan }),
        );
      } catch {
        setToast(
          "Browser storage is unavailable. Your plan still works in this tab.",
        );
      }
  }, [plan, disruption]);
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(
      () =>
        setMinute((v) => {
          if (v >= plan.minutes) {
            setPlaying(false);
            return v;
          }
          return v + 1;
        }),
      1000,
    );
    return () => clearInterval(id);
  }, [playing, plan.minutes]);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(id);
  }, [toast]);
  const snapshot = () => setUndo(clone({ plan, result, disruption }));
  function apply(next: Plan) {
    const problems = validatePlan(next);
    if (problems.length) {
      setErrors(problems);
      return;
    }
    snapshot();
    setPlan(clone(next));
    setResult(schedule(next));
    setDisruption(null);
    setPlaying(false);
    setMinute(Math.min(minute, next.minutes));
    setDialog(null);
    setSelected(null);
    setToast("Plan updated. Every individual turn has been recalculated.");
  }
  function edit() {
    setDraft(
      clone({
        ...plan,
        tasks: plan.tasks.map((t) => ({
          ...t,
          capacity: Math.max(1, t.capacity),
        })),
      }),
    );
    setErrors([]);
    setAssumptions([]);
    setDialog("edit");
  }
  function addResource() {
    apply({
      ...plan,
      tasks: plan.tasks.map((t) =>
        t.id === diagnosticTask.id ? { ...t, capacity: t.capacity + 1 } : t,
      ),
    });
  }
  function simulate() {
    snapshot();
    const next = repair(plan, result, minute);
    setPlan(next.plan);
    setResult(next.schedule);
    setDisruption(next.disruption);
    setPlaying(false);
    setToast(
      `Resource loss simulated at ${minute}:00. Completed turns are preserved.`,
    );
  }
  function restore() {
    if (!undo) return;
    setPlan(undo.plan);
    setResult(undo.result);
    setDisruption(undo.disruption);
    setMinute((m) => Math.min(m, undo.plan.minutes));
    setUndo(null);
    setPlaying(false);
    setToast("Previous plan restored.");
  }
  async function importLesson() {
    if (!importText.trim()) return;
    setImportBusy(true);
    setImportError("");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: importText }),
        signal: controller.signal,
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.error || "The importer is unavailable. Try the manual editor.",
        );
      if (validatePlan(data.plan).length)
        throw new Error(
          "The draft needs another try. You can also enter it manually.",
        );
      setDraft({ ...data.plan, origin: "custom" });
      setAssumptions(data.assumptions || []);
      setErrors([]);
      setDialog("edit");
    } catch (e) {
      setImportError(
        e instanceof Error && e.name === "AbortError"
          ? "The request timed out. Your text is still here; try again or edit manually."
          : e instanceof Error
            ? e.message
            : "Import failed. Your text is still here.",
      );
    } finally {
      clearTimeout(timeout);
      setImportBusy(false);
    }
  }
  const visible = useMemo(
    () =>
      plan.learners
        .map((name, i) => ({
          name,
          i,
          state: learnerState(i, plan, result, minute),
        }))
        .filter(
          (l) =>
            (filter === "all" ||
              (filter === "unserved"
                ? result.unserved.some((s) => s.learner === l.i)
                : l.state === filter)) &&
            `${l.name} ${l.i + 1}`.toLowerCase().includes(search.toLowerCase()),
        ),
    [plan, result, minute, filter, search],
  );
  return (
    <>
      <a className="skip-link" href="#studio">
        Skip to workshop
      </a>
      <header className="site-header">
        <a href="#" className="brand" aria-label="Every Hand home">
          <span className="brand-mark">
            <Hand size={24} strokeWidth={1.7} />
          </span>
          <span>
            every hand<span className="brand-dot">.</span>
          </span>
        </a>
        <div className="header-note">
          <span className="tiny-flower">✳</span> Good learning makes room.
        </div>
        <nav>
          <button
            className="text-button how-link"
            onClick={() => setDialog("about")}
          >
            How it works <Info size={14} />
          </button>
          <button
            className="button dark compact"
            onClick={() => setDialog("export")}
          >
            <ArrowDownToLine size={16} />
            Facilitator kit
          </button>
        </nav>
      </header>
      <main>
        <section className="intro">
          <div>
            <p className="eyebrow">
              <span className="small-line" /> THE PARTICIPATION PLANNING STUDIO
            </p>
            <h1>
              Make room for
              <br />
              <em>every hand.</em>
              <span className="headline-star" aria-hidden="true">
                ✳
              </span>
            </h1>
          </div>
          <div className="intro-note">
            <p>
              Being in the group is one thing.
              <br />
              Getting a real turn is another.
            </p>
            <span>
              Plan the moments that let everyone
              <br className="desktop-br" /> get their hands on the learning.
            </span>
            <a href="#studio" className="jump-link">
              Let's make it work <ArrowDown size={16} />
            </a>
          </div>
        </section>
        <section className="lesson-bar" aria-label="Current lesson">
          <div className="lesson-icon">
            <svg viewBox="-35 -35 70 70" aria-hidden="true">
              <Microscope scale={0.8} />
            </svg>
          </div>
          <div className="lesson-name">
            <div className="lesson-kicker">
              YOUR WORKSHOP{" "}
              <span>
                {plan.origin === "example"
                  ? "Fictional example"
                  : "Custom plan"}
              </span>
            </div>
            <h2>{plan.title}</h2>
          </div>
          <div className="lesson-facts">
            <span>
              <UsersRound size={16} />
              <b>{plan.learners.length}</b> learners
            </span>
            <i />
            <span>
              <Clock3 size={16} />
              <b>{plan.minutes}</b> minutes
            </span>
            <i />
            <span>
              <LayersIcon />
              <b>{plan.tasks.length}</b>{" "}
              {plan.tasks.length === 1 ? "activity" : "activities"}
            </span>
          </div>
          <button className="button outline compact" onClick={edit}>
            <Settings2 size={15} />
            Edit plan
          </button>
          <button
            className="icon-button import-shortcut"
            aria-label="Import a lesson plan"
            title="Import a lesson plan"
            onClick={() => setDialog("import")}
          >
            <FileText size={19} />
          </button>
        </section>
        <div className="studio-grid" id="studio">
          <Room
            plan={plan}
            result={result}
            minute={minute}
            setMinute={setMinute}
            playing={playing}
            setPlaying={setPlaying}
            onSelect={setSelected}
            selected={selected}
            disruption={disruption}
          />
          <aside
            className={`diagnosis ${missing === 0 ? "all-set" : ""}`}
            aria-label="Schedule result"
          >
            <div className="diagnosis-heading">
              <span className="eyebrow">THE REAL PICTURE</span>
              <span className={`status-chip ${missing ? "warning" : ""}`}>
                {missing ? (
                  <>
                    <span />
                    Room to improve
                  </>
                ) : (
                  <>
                    <Check size={12} />
                    Everyone has a turn
                  </>
                )}
              </span>
            </div>
            <div className="score">
              <span>{result.served}</span>
              <small>/ {plan.learners.length}</small>
              <span className="score-flower" aria-hidden="true">
                {missing ? "↗" : "✳"}
              </span>
            </div>
            <h2>
              {missing ? (
                <>
                  A full turn for {result.served}.<br />
                  <em>{missing} still need a place.</em>
                </>
              ) : (
                <>
                  A little change.
                  <br />
                  <em>Room for everyone.</em>
                </>
              )}
            </h2>
            <p className="diagnosis-copy">
              {disruption
                ? `After the simulated loss at ${disruption.minute}:00, ${result.served} learners have a complete path through the session.`
                : missing
                  ? !finiteFix
                    ? `A ${diagnosticTask.duration}-minute turn cannot fit a ${plan.minutes}-minute session. Shorten this turn or extend the session.`
                    : provenShortfall
                      ? `${diagnosticTask.name}: ${diagnosticTask.capacity} ${diagnosticTask.capacity === 1 ? "place gives" : "places give"} at most ${proof.wholeTurns} full turns. A group rotation can hide who misses out.`
                      : "The activity order and available time leave gaps in this schedule. Review the activity timings; a better schedule may exist."
                  : `Every learner has a complete, individual opportunity within your ${plan.minutes}-minute session.`}
            </p>
            <div className="participation-meter">
              <div style={{ width: `${servedPercent}%` }} />
            </div>
            <div className="meter-caption">
              <span>{servedPercent}% with a complete path</span>
              <span>{missing ? `${missing} unserved` : "All included"}</span>
            </div>
            {disruption ? (
              <div className="math-note repair-note">
                <ShieldCheck size={19} />
                <div>
                  <b>{disruption.completed.length} completed turns preserved</b>
                  <span>
                    {disruption.interrupted.length
                      ? `${disruption.interrupted.length} interrupted turn restarts in full.`
                      : "Unaffected active turns finish as planned."}
                  </span>
                  <small>
                    Before {disruption.before}/{plan.learners.length} → now{" "}
                    {result.served}/{plan.learners.length}
                  </small>
                </div>
              </div>
            ) : (
              <div className="math-note">
                <span className="math-icon">÷</span>
                <div>
                  <b>The time has to add up.</b>
                  <span className="math-task-name">{diagnosticTask.name}</span>
                  <span>
                    {plan.learners.length} × {diagnosticTask.duration} min ={" "}
                    <strong>{proof.required} place-minutes needed</strong>
                  </span>
                  <span>
                    {diagnosticTask.capacity} × {plan.minutes} min ={" "}
                    <strong>{proof.available} available</strong>
                  </span>
                  <small>
                    {diagnosticTask.capacity} × ⌊{plan.minutes} ÷{" "}
                    {diagnosticTask.duration}⌋ = {proof.wholeTurns} whole turns
                  </small>
                </div>
              </div>
            )}
            {missing > 0 &&
            !disruption &&
            finiteFix &&
            provenShortfall &&
            diagnosticTask.capacity < 16 ? (
              <button
                className="button dark full fix-button"
                onClick={addResource}
              >
                <Plus size={17} />
                Add one more place{" "}
                <span>
                  {diagnosticTask.capacity} → {diagnosticTask.capacity + 1}
                </span>
              </button>
            ) : missing > 0 && !disruption ? (
              <button className="button dark full fix-button" onClick={edit}>
                <Settings2 size={17} />
                {finiteFix
                  ? "Review activity timing"
                  : "Adjust time to fit a full turn"}
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                className="button dark full fix-button"
                onClick={() => setDialog("export")}
              >
                <ArrowDownToLine size={17} />
                Take your plan into the room <ArrowRight size={16} />
              </button>
            )}
            {undo && (
              <button className="text-button undo-button" onClick={restore}>
                <RotateCcw size={13} />
                Undo last change
              </button>
            )}
            <details className="assumptions">
              <summary>
                What this plan assumes <ChevronDown size={14} />
              </summary>
              <p>
                Each learner needs every activity in order. Durations include
                reset and movement. Turns use whole minutes and one learner per
                place.{" "}
                {plan.tasks.length > 1
                  ? "The scheduler uses a deterministic heuristic; an unserved learner does not alone prove no better schedule exists."
                  : "The single-activity whole-turn bound is exact."}{" "}
                This plans opportunities; actual participation and learning
                still need your observation.
              </p>
            </details>
          </aside>
        </div>
        <section className="below-studio">
          <div className="reality-strip">
            <span className="reality-icon">
              <Zap size={20} />
            </span>
            <div>
              <h3>Real rooms have plot twists.</h3>
              <p>
                {disruption
                  ? `One place was lost at ${disruption.minute}:00. Completed work stays on the page.`
                  : `A place for “${first.name}” stops working. Replan without erasing completed turns.`}
              </p>
            </div>
            {disruption ? (
              <button className="button outline compact" onClick={restore}>
                <RotateCcw size={15} />
                Restore previous plan
              </button>
            ) : (
              <button
                className="button outline compact"
                onClick={simulate}
                disabled={first.capacity < 1 || minute >= plan.minutes}
              >
                <Minus size={15} />
                Lose a place at {minute}:00
              </button>
            )}
          </div>
          <div className="roster-header">
            <div>
              <p className="eyebrow">FROM THE GROUP TO THE INDIVIDUAL</p>
              <h2>
                Every learner. <em>A real turn.</em>
              </h2>
            </div>
            <button className="text-button" onClick={() => setDialog("export")}>
              See the run sheet <ArrowRight size={15} />
            </button>
          </div>
          <div className="roster-toolbar">
            <div
              className="filter-tabs"
              role="group"
              aria-label="Filter learners"
            >
              <button
                className={filter === "all" ? "active" : ""}
                onClick={() => setFilter("all")}
              >
                Everyone <span>{plan.learners.length}</span>
              </button>
              <button
                className={filter === "unserved" ? "active" : ""}
                onClick={() => setFilter("unserved")}
              >
                Needs a turn <span>{missing}</span>
              </button>
              <button
                className={filter === "complete" ? "active" : ""}
                onClick={() => setFilter("complete")}
              >
                Complete now
              </button>
            </div>
            <label className="search-box">
              <Search size={16} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Find a learner"
                aria-label="Find a learner"
              />
            </label>
          </div>
          <div className="roster-table-wrap">
            <table className="roster-table">
              <thead>
                <tr>
                  <th>Learner</th>
                  <th>Individual opportunity</th>
                  <th>At {minute}:00</th>
                  <th>
                    <span className="sr-only">Inspect learner</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map(({ name, i, state }) => (
                  <tr key={i} onClick={() => setSelected(i)}>
                    <td>
                      <button
                        className="learner-name"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(i);
                        }}
                      >
                        <span className={`avatar ${state}`}>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <b>{name}</b>
                      </button>
                    </td>
                    <td>
                      <div className="slot-list">
                        {plan.tasks.map((t) => {
                          const s = result.slots.find(
                            (s) => s.learner === i && s.task === t.id,
                          );
                          return (
                            <span
                              key={t.id}
                              className={`slot-pill ${s ? "" : "no-slot"}`}
                              title={t.name}
                            >
                              {s ? (
                                <>
                                  <span className="slot-dot" />
                                  {s.start}:00 – {s.end}:00{" "}
                                  <small>
                                    Place {s.resource + 1}
                                    {plan.tasks.length > 1
                                      ? ` · ${t.name}`
                                      : ""}
                                  </small>
                                </>
                              ) : (
                                <>
                                  <span className="missing-symbol">—</span>No
                                  full turn{" "}
                                  <small>
                                    {plan.tasks.length > 1 ? t.name : ""}
                                  </small>
                                </>
                              )}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td>
                      <span className={`state-label ${state}`}>
                        <i />
                        {state === "complete"
                          ? "Complete"
                          : state === "active"
                            ? "Taking a turn"
                            : state === "unserved"
                              ? "Needs a turn"
                              : "Coming up"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="icon-button"
                        aria-label={`View ${name}'s turns`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(i);
                        }}
                      >
                        <ArrowRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {visible.length === 0 && (
              <div className="empty-state">
                <Search size={24} />
                <h3>No learners in this view.</h3>
                <p>Try another name or filter.</p>
                <button
                  className="text-button"
                  onClick={() => {
                    setFilter("all");
                    setSearch("");
                  }}
                >
                  Show everyone <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
          <div className="bottom-note">
            <Leaf size={16} />
            <span>More thoughtful plans. More hands on the learning.</span>
            <button className="text-button" onClick={() => setDialog("import")}>
              <Sparkles size={14} />
              Start from your own lesson
            </button>
          </div>
        </section>
      </main>
      <footer>
        <a href="#" className="footer-brand">
          every hand.
        </a>
        <p>
          A planned opportunity is a beginning. The learning happens in your
          room.
        </p>
        <button
          className="text-button"
          onClick={() => {
            snapshot();
            setPlan(clone(samplePlan));
            setResult(schedule(samplePlan));
            setDisruption(null);
            setMinute(8);
            setPlaying(false);
            setSelected(null);
            setToast("Fictional example restored.");
          }}
        >
          Reset example <RotateCcw size={13} />
        </button>
      </footer>
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          {toast}
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={14} />
          </button>
        </div>
      )}
      {dialog === "edit" && (
        <Modal
          title={
            assumptions.length
              ? "Make the draft yours."
              : "A little planning. More possibility."
          }
          subtitle="Give each learner enough time and a place to try."
          onClose={closeDialog}
          wide
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              apply({ ...draft, origin: "custom" });
            }}
            className="editor-form"
          >
            {assumptions.length > 0 && (
              <div className="import-review">
                <Sparkles size={18} />
                <div>
                  <b>AI draft · review every assumption</b>
                  {assumptions.map((a, i) => (
                    <p key={i}>{a}</p>
                  ))}
                </div>
              </div>
            )}
            <label className="field">
              Workshop title
              <input
                value={draft.title}
                maxLength={120}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                required
              />
            </label>
            <div className="two-fields">
              <label className="field">
                Session length <span>minutes</span>
                <input
                  type="number"
                  min="5"
                  max="120"
                  step="1"
                  value={Number.isNaN(draft.minutes) ? "" : draft.minutes}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      minutes: e.target.value === "" ? NaN : +e.target.value,
                    })
                  }
                  required
                />
              </label>
              <label className="field">
                Number of learners <span>1–60</span>
                <input
                  type="number"
                  min="1"
                  max="60"
                  step="1"
                  value={draft.learners.length}
                  onChange={(e) => {
                    const count = +e.target.value;
                    if (Number.isInteger(count) && count >= 1 && count <= 60)
                      setDraft({
                        ...draft,
                        learners: Array.from(
                          { length: count },
                          (_, i) =>
                            draft.learners[i] ||
                            `Learner ${String(i + 1).padStart(2, "0")}`,
                        ),
                      });
                  }}
                  required
                />
              </label>
            </div>
            <details className="name-details">
              <summary>
                Personalize learner labels <ChevronDown size={14} />
              </summary>
              <label className="field">
                One label per line{" "}
                <span>Use anonymous labels if preferred</span>
                <textarea
                  rows={5}
                  value={draft.learners.join("\n")}
                  onChange={(e) =>
                    setDraft({ ...draft, learners: e.target.value.split("\n") })
                  }
                />
              </label>
            </details>
            <div className="activity-header">
              <div>
                <h3>The hands-on activities</h3>
                <p>
                  In order. Each learner finishes one before starting the next.
                </p>
              </div>
              <span>{draft.tasks.length}/4</span>
            </div>
            {draft.tasks.map((task, i) => (
              <div className="task-editor" key={task.id}>
                <div className="task-number">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="task-fields">
                  <label className="field">
                    Activity name
                    <input
                      value={task.name}
                      maxLength={80}
                      required
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          tasks: draft.tasks.map((t, j) =>
                            i === j ? { ...t, name: e.target.value } : t,
                          ),
                        })
                      }
                    />
                  </label>
                  <div className="two-fields">
                    <label className="field">
                      Time per learner <span>min, including reset</span>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={Number.isNaN(task.duration) ? "" : task.duration}
                        required
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            tasks: draft.tasks.map((t, j) =>
                              i === j
                                ? {
                                    ...t,
                                    duration:
                                      e.target.value === ""
                                        ? NaN
                                        : +e.target.value,
                                  }
                                : t,
                            ),
                          })
                        }
                      />
                    </label>
                    <label className="field">
                      Simultaneous places <span>one learner per place</span>
                      <input
                        type="number"
                        min="1"
                        max="16"
                        value={Number.isNaN(task.capacity) ? "" : task.capacity}
                        required
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            tasks: draft.tasks.map((t, j) =>
                              i === j
                                ? {
                                    ...t,
                                    capacity:
                                      e.target.value === ""
                                        ? NaN
                                        : +e.target.value,
                                  }
                                : t,
                            ),
                          })
                        }
                      />
                    </label>
                  </div>
                </div>
                <div className="task-actions">
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={`Move ${task.name} earlier`}
                    disabled={i === 0}
                    onClick={() => {
                      const tasks = [...draft.tasks];
                      [tasks[i], tasks[i - 1]] = [tasks[i - 1], tasks[i]];
                      setDraft({ ...draft, tasks });
                    }}
                  >
                    <ArrowUp size={15} />
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={`Move ${task.name} later`}
                    disabled={i === draft.tasks.length - 1}
                    onClick={() => {
                      const tasks = [...draft.tasks];
                      [tasks[i], tasks[i + 1]] = [tasks[i + 1], tasks[i]];
                      setDraft({ ...draft, tasks });
                    }}
                  >
                    <ArrowDown size={15} />
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={`Remove ${task.name}`}
                    disabled={draft.tasks.length === 1}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        tasks: draft.tasks.filter((_, j) => j !== i),
                      })
                    }
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
            ))}
            {draft.tasks.length < 4 && (
              <button
                type="button"
                className="button dashed full"
                onClick={() =>
                  setDraft({
                    ...draft,
                    tasks: [
                      ...draft.tasks,
                      {
                        id: `task-${Date.now()}`,
                        name: "Record findings",
                        duration: 3,
                        capacity: 7,
                      },
                    ],
                  })
                }
              >
                <Plus size={16} />
                Add an activity
              </button>
            )}
            {errors.length > 0 && (
              <div className="error-message" role="alert">
                {errors.map((e) => (
                  <p key={e}>{e}</p>
                ))}
              </div>
            )}
            <div className="modal-actions">
              <button
                type="button"
                className="text-button"
                onClick={() => setDialog("import")}
              >
                <FileText size={15} />
                Paste a lesson instead
              </button>
              <button type="submit" className="button dark">
                Build my turn plan <ArrowRight size={16} />
              </button>
            </div>
          </form>
        </Modal>
      )}
      {dialog === "import" && (
        <Modal
          title="Bring your own little lesson."
          subtitle="Turn a few notes into a plan you can inspect and adjust."
          onClose={closeDialog}
        >
          <div className="import-body">
            <label className="field">
              Your lesson notes
              <textarea
                rows={7}
                maxLength={10000}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="28 learners, a 30-minute biology session, 3 microscopes. Everyone needs 4 minutes to observe a specimen, including reset…"
              />
            </label>
            <p className="privacy-note">
              <ShieldCheck size={17} />
              <span>
                When you choose “Create a draft,” these notes are sent to
                OpenAI. Use anonymous learner labels. You'll review the draft
                before it changes your plan.
              </span>
            </p>
            {importError && (
              <div className="error-message" role="alert">
                {importError}
              </div>
            )}
            <div className="modal-actions">
              <button className="text-button" onClick={edit}>
                Enter it myself <ArrowRight size={14} />
              </button>
              <button
                className="button dark"
                disabled={!importText.trim() || importBusy}
                onClick={importLesson}
              >
                <Sparkles size={16} />
                {importBusy ? "Making a draft…" : "Create a draft"}
              </button>
            </div>
          </div>
        </Modal>
      )}
      {dialog === "about" && (
        <Modal
          title="A turn changes everything."
          subtitle="Start with the individual. Then make the room work."
          onClose={closeDialog}
        >
          <div className="about-body">
            {[
              [
                "01",
                "Put the real needs on the page.",
                "Count learners, set a full turn duration including reset, and tell us how many places are available.",
              ],
              [
                "02",
                "See who gets a complete opportunity.",
                "Every Hand schedules each learner individually. A capacity check reveals when the equipment and minutes cannot cover everyone.",
              ],
              [
                "03",
                "Make one thoughtful change.",
                "Add a place, change the timing or order, then test a resource loss. Take the resulting turns into the room as printable cards.",
              ],
            ].map(([n, t, d]) => (
              <div className="about-step" key={n}>
                <span>{n}</span>
                <div>
                  <h3>{t}</h3>
                  <p>{d}</p>
                </div>
              </div>
            ))}
            <div className="about-honesty">
              <Info size={17} />
              <p>
                This is a planning tool. The example is fictional, playback is
                simulated, and a scheduled turn doesn't prove participation or
                predict learning. Multi-activity scheduling uses a deterministic
                heuristic, not an optimality guarantee.
              </p>
            </div>
            <button className="button dark full" onClick={closeDialog}>
              Back to the workshop <ArrowRight size={16} />
            </button>
          </div>
        </Modal>
      )}
      {selected !== null && (
        <Modal
          title={`${plan.learners[selected]}'s moment.`}
          subtitle={`Learner ${String(selected + 1).padStart(2, "0")} · An individual path through the workshop`}
          onClose={() => setSelected(null)}
        >
          <div className="learner-detail">
            {plan.tasks.map((t, i) => {
              const s = result.slots.find(
                (s) => s.learner === selected && s.task === t.id,
              );
              return (
                <div
                  className={`detail-turn ${s ? "" : "unserved"}`}
                  key={t.id}
                >
                  <span className="task-number">{i + 1}</span>
                  <div>
                    <h3>{t.name}</h3>
                    {s ? (
                      <>
                        <strong>
                          {s.start}:00 – {s.end}:00{" "}
                          <small>Place {s.resource + 1}</small>
                        </strong>
                        <p>{t.duration} full minutes, including reset</p>
                      </>
                    ) : (
                      <>
                        <strong>No complete turn in this plan</strong>
                        <p>Adjust time or capacity to make room.</p>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            <button
              className="button dark full"
              onClick={() => {
                const s = result.slots.find((s) => s.learner === selected);
                if (s) setMinute(s.start);
                setSelected(null);
                setPlaying(false);
              }}
              disabled={!result.slots.some((s) => s.learner === selected)}
            >
              Find this moment in the room <ArrowRight size={16} />
            </button>
          </div>
        </Modal>
      )}
      {dialog === "export" && (
        <ExportModal
          plan={plan}
          result={result}
          disruption={disruption}
          onClose={closeDialog}
          notify={setToast}
        />
      )}
    </>
  );
}
function LayersIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <path d="m12 3 9 5-9 5-9-5zM3 12l9 5 9-5M3 16l9 5 9-5" />
    </svg>
  );
}
function ExportModal({
  plan,
  result,
  disruption,
  onClose,
  notify,
}: {
  plan: Plan;
  result: Schedule;
  disruption: Disruption | null;
  onClose: () => void;
  notify: (s: string) => void;
}) {
  return (
    <Modal
      title="From the plan to the room."
      subtitle="Your real schedule, ready to put into practice."
      onClose={onClose}
    >
      <div className="export-body">
        <div className="export-preview">
          <FileText size={34} />
          <div>
            <span className="eyebrow">FACILITATOR KIT</span>
            <h3>{plan.title}</h3>
            <p>
              {result.served}/{plan.learners.length} complete paths ·{" "}
              {result.slots.length} individual turns
            </p>
          </div>
        </div>
        <p className="export-placeholder">
          Your kit includes a chronological run sheet, a turn card for every
          learner, and clearly marked gaps.
        </p>
        <button
          className="button dark full"
          onClick={() => {
            window.print();
            notify("Print preview opened. Choose a printer or Save as PDF.");
          }}
        >
          <ArrowDownToLine size={17} />
          Print run sheet & turn cards
        </button>
        <div className="two-fields export-downloads">
          <button
            className="button outline"
            onClick={() =>
              download(
                JSON.stringify(
                  {
                    plan,
                    schedule: result,
                    disruption,
                    notice:
                      "Planned opportunities, not observed participation.",
                  },
                  null,
                  2,
                ),
                "every-hand-plan.json",
                "application/json",
              )
            }
          >
            Download JSON <ArrowDownToLine size={15} />
          </button>
          <button
            className="button outline"
            onClick={() =>
              download(
                toCSV(plan, result),
                "every-hand-turns.csv",
                "text/csv;charset=utf-8",
              )
            }
          >
            Download CSV <ArrowDownToLine size={15} />
          </button>
        </div>
        <p className="export-note">
          Times start at session minute 0. Full turn durations include reset.{" "}
          {disruption
            ? `Simulated resource loss at ${disruption.minute}:00.`
            : "No actual attendance is recorded."}
        </p>
      </div>
      <PrintKit plan={plan} result={result} disruption={disruption} />
    </Modal>
  );
}
function download(text: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function toCSV(plan: Plan, result: Schedule) {
  const field = (v: unknown) => {
    let s = String(v ?? "");
    if (/^[=+@\-\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replaceAll('"', '""')}"`;
  };
  return [
    ["Learner", "Activity", "Place", "Start minute", "End minute", "Status"],
    ...plan.learners.flatMap((name, i) =>
      plan.tasks.map((t) => {
        const s = result.slots.find((s) => s.learner === i && s.task === t.id);
        return [
          name,
          t.name,
          s ? s.resource + 1 : "",
          s?.start ?? "",
          s?.end ?? "",
          s ? "Scheduled" : "No full turn",
        ];
      }),
    ),
  ]
    .map((row) => row.map(field).join(","))
    .join("\r\n");
}
function PrintKit({
  plan,
  result,
  disruption,
}: {
  plan: Plan;
  result: Schedule;
  disruption: Disruption | null;
}) {
  return (
    <div className="print-kit">
      <h1>Every Hand / Facilitator run sheet</h1>
      <h2>{plan.title}</h2>
      <p>
        {plan.learners.length} learners · {plan.minutes} minutes ·{" "}
        {result.served} complete paths · times relative to session start
      </p>
      <p>
        Durations include reset. Planned opportunities, not observed
        participation.{" "}
        {disruption
          ? `Simulated loss at minute ${disruption.minute}; historical turns preserved.`
          : ""}
      </p>
      <table>
        <thead>
          <tr>
            <th>Start–end</th>
            <th>Learner</th>
            <th>Activity</th>
            <th>Place</th>
          </tr>
        </thead>
        <tbody>
          {result.slots.map((s, i) => (
            <tr key={i}>
              <td>
                {s.start}:00–{s.end}:00
              </td>
              <td>{plan.learners[s.learner]}</td>
              <td>{plan.tasks.find((t) => t.id === s.task)?.name}</td>
              <td>{s.resource + 1}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {result.unserved.length > 0 && (
        <div>
          <h2>Needs another opportunity</h2>
          {result.unserved.map((s, i) => (
            <p key={i}>
              {plan.learners[s.learner]} —{" "}
              {plan.tasks.find((t) => t.id === s.task)?.name}
            </p>
          ))}
        </div>
      )}
      <h1 className="card-page-title">Individual turn cards</h1>
      <div className="print-cards">
        {plan.learners.map((name, i) => (
          <article key={i}>
            <span>EVERY HAND · LEARNER {String(i + 1).padStart(2, "0")}</span>
            <h2>{name}</h2>
            {plan.tasks.map((t) => {
              const s = result.slots.find(
                (s) => s.learner === i && s.task === t.id,
              );
              return (
                <p key={t.id}>
                  <b>{t.name}</b>
                  <br />
                  {s
                    ? `${s.start}:00–${s.end}:00 · Place ${s.resource + 1}`
                    : "No full turn — facilitator follow-up needed"}
                </p>
              );
            })}
          </article>
        ))}
      </div>
    </div>
  );
}
