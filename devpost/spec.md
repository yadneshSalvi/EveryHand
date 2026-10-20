---
doc: spec
status: draft
implementation_authorization: delegated by user before build; human document review pending
---
# Every Hand — Technical Spec

## How This Works, In Plain Language
The browser holds a lesson plan. A deterministic scheduler finds a full equipment turn for each learner and checks resource limits. The same timed slots power the room, roster and printout. When a resource is lost, past completed turns are kept and the remaining work is scheduled again. An optional small local server can turn pasted text into an editable draft using OpenAI; it never decides whether the timings are valid.

## The Core Journey Through the System
Sample/manual/import draft → input validation → pure scheduler → capacity diagnostic → room and individual schedule. A pure comparison generator evaluates time-only and equipment-only full-coverage schedules, with source revision and actual learner deltas. Preview reads candidates without changing the plan; application checks the revision and commits atomically. Scrubbing reads slots without changing the plan. Loss captures the cutoff and retained work, reruns scheduling and offers undo. Export serializes the same current plan and slots. Implements `prd.md > The Core Journey`.

## Stack
- React + TypeScript: typed components and shared pure scheduling logic. https://react.dev/learn https://www.typescriptlang.org/docs/
- Vite: local frontend tooling on 5174. https://vite.dev/guide/
- Node HTTP server: optional import endpoint on 3002. https://nodejs.org/api/http.html
- Node test + tsx: runnable kernel checks without a large test framework. https://nodejs.org/api/test.html https://tsx.is/
- CSS/SVG: custom responsive studio and room, no external image dependency.
These are agent-selected implementation recommendations under delegated authority; tradeoff is a local two-process optional AI setup.

## Where It Runs and How Someone Tries It
Node 22.12+ and npm. `npm install`; `npm run dev` opens http://localhost:5174. In another terminal `npm run server` enables optional import on port 3002; place OPENAI_API_KEY in ignored .env. `npm test`, `npm run check`, `npm run build` verify. All core features work without the server/key. No deployment is planned now. Public source is available at https://github.com/yadneshSalvi/EveryHand. The human-narrated public video under three minutes and human final review remain pending.

## Look and Feel
Implements `prd.md > Look and Feel`: cream #f7f5ee, forest #293e32, coral #e7784a, sage #dfe8da. Locally bundled DM Serif Display/DM Sans, with Georgia/system fallbacks; generous desktop layout, compact stacked mobile, thin ink rules, custom SVG microscopes and learner dots. CSS reduced-motion disables path/entrance animation; semantic controls remain usable.

## Components
### Plan Validation and Scheduler
Implements `prd.md > Individual Opportunities` and `prd.md > Explaining the Shortfall`. Pure plan validator limits 1–60 learners, 5–120 minutes, 1–4 ordered tasks, 1–30-minute duration and 1–16 resource capacity. Integer time scan schedules ready learners on lowest free station, with deterministic fewest-completed-task then roster tie break. Dependencies are previous task completion. Resource pools are dedicated per task; shared equipment across tasks is not modeled and the editor explains that steps sharing equipment should be combined. No preemption. Capacity proof per task is capacity × floor(session/duration); schedule shortfall for multi-task plans is explicitly heuristic, never an optimality claim.
### Workshop Studio
Implements `prd.md > Timeline and Room`. App owns plan, preview minute, selected learner, dialog and prior snapshot. Room reads slots, roster and statuses. Playback interval advances preview; selection exposes slots. Local storage is versioned and validated.
### Choice Comparison
Implements `prd.md > Ways to Make Room`. New pure `src/choices.ts` builds context from current plan/result and any loss cutoff, retaining completed and unaffected active slots. Candidates contain proposed plan, actual schedule, source revision, exact/verified evidence and learner/turn deltas. Time-only search checks later integer horizons through 120; equipment-only search checks one-activity capacity increases through 16 and chooses the least added capacity among successful searched candidates. Single identical-activity minima are exact; after loss, next-free resource times and retained turns establish the full-turn bound. Multi-activity candidates remain verified heuristic results, not global optima. An unsuccessful bounded search is reported as a search limitation.
`applyChoice` rejects stale source revisions, changed durations/order/learners or modified protected history, and verifies the selected schedule. App snapshots undo, applies plan/result together, preserves the loss baseline and cutoff, and exports the same applied result. Comparisons are computed once per plan/scenario, not on preview ticks. The responsive keyboard-accessible choice workspace uses real finish/equipment locks and named before/after task paths.

### Scenario Repair
Implements `prd.md > Resource Loss and Undo`. Retain all slots ending at/before cutoff. Retain active surviving-resource slots; discard interrupted and future slots. Schedule incomplete task/learner pairs from cutoff respecting retained dependencies. Historical lost-resource slots remain valid. Disruption stores pre-loss capacity separately so historical replay stays correct when a chosen option restores current capacity. Post-cutoff capacity is reduced. Undo restores previous slots/plan exactly.
### Editor and Importer
Implements `prd.md > Confirming a Plan` and `prd.md > Importing Lesson Text`. Editor is bounded and validates before apply. POST /api/import accepts {text} (maximum 10,000 characters), calls OpenAI Responses with strict schema and returns a reviewable Plan plus assumptions. Twenty-five-second timeout, bounded request body, no input/key logging, no raw upstream error leakage. Model is configurable server-side; cloud errors retain manual workflow.
### Export
Implements `prd.md > Exporting a Run Sheet`. Current slots generate CSV and JSON downloads plus printable cards/run sheet using print CSS. CSV quotes/escapes fields and guards formula prefixes. Unsatisfied opportunities appear explicitly.

## Data Model
Plan {title, learners:string[], minutes:number, tasks:{id,name,duration,capacity}[]}; task order defines prerequisite. ChoiceContext {plan,result,cutoff,protectedSlots,revision}; ChoiceCandidate {plan,result,baseRevision,evidence,delta,change}; candidates remain transient and are discarded on source changes. Slot {learner,task,resource,start,end}; Schedule {slots,unserved}. Disruption {minute,task,resource,completed,interrupted,before,capacityBefore}; previous snapshot supports undo; a separate pre-loss baseline keeps scenario restoration available after editing and undoing into a disrupted snapshot. Plan lives in validated versioned localStorage; simulation state resets on reload and is never represented as actual attendance. Import text remains in dialog memory and is not persisted or logged.

## File Structure
```
EveryHand/
├── src/
│   ├── Modal.tsx            # shared keyboard/focus-managed dialog
│   ├── choices.ts          # actual alternatives, source revisions and application
│   ├── choices.test.ts     # bounds, protected history and stale-apply checks
│   ├── ChoiceWorkspace.tsx # constraint comparison and named before/after paths
│   ├── App.tsx             # studio, dialogs and journey
│   ├── Room.tsx            # vector room driven by real slots
│   ├── solver.ts           # validator, deterministic scheduler, repair
│   ├── solver.test.ts      # independent invariants and fixtures
│   ├── export.ts           # CSV/JSON/print data
│   ├── main.tsx            # browser entry
│   └── styles.css          # studio, responsive and print styling
├── server/index.ts        # optional bounded AI importer
├── devpost/               # public planning and reference map
├── plans/                 # ignored private numbered plans
├── .env.example           # empty optional key names only
├── package.json
└── README.md
```

## External Services and Dependencies
Optional POST https://api.openai.com/v1/responses with Bearer server-side OPENAI_API_KEY, model config, store:false, text.format json_schema strict, system extraction instruction and user pasted text. Expected output is strict title/learner count/minutes/tasks/assumptions; validate independently. https://developers.openai.com/api/docs/guides/structured-outputs . Costs and rate limits depend on the user's account/model; no price promise. An explicit UI action discloses transmission. No other runtime services.

## Important Failure Modes
- Invalid/corrupt plan → field error or safe fictional sample; never crash or silently repair user intent.
- No feasible full turn → explicit missing slots and capacity explanation; no fractional learners.
- AI refusal/timeout/missing key → retained text, plain error, manual plan editor.

## What Was Simplified and Why
Ordered dependencies instead of arbitrary graphs keep the proof inspectable. One browser instead of accounts keeps local setup small. Whole-minute duration including reset avoids unmodeled transition promises. List scheduling instead of an exact optimizer supports deterministic fast interaction; only rigorous capacity bounds are called proofs.

## Decisions and Open Issues
The user delegated product and implementation choices and requested local verification/pushes. No learner uncertainty or human approval was invented. The technical uncertainty is whether heuristic multi-task order produces satisfactory schedules; invariant/property fixtures and honest output labels bound this risk. Human final review, actual classroom timing and narrated demo remain open.
