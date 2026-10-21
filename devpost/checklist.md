---
doc: checklist
status: draft
implementation_authorization: delegated by user before build; human document review pending
---
# Build Checklist
Build mode: fast — explicit autonomous implementation authorization. Human hands-on review remains pending.

## Slices
- [x] **1. Inspect and repair a real individual-turn schedule**
  Becomes usable: A running microscope studio shows 21/28 and fourth-resource repair 28/28, with individually inspectable slots.
  Why now: Proves the unique kernel before peripheral features.
  PRD ref: `prd.md > Individual Opportunities`, `prd.md > Explaining the Shortfall`
  Spec ref: `spec.md > Plan Validation and Scheduler`, `spec.md > Workshop Studio`
  Build: Scaffold inside first slice; implement/test solver, room, capacity diagnosis and roster.
  Verify (mechanical): Kernel fixtures, invariant tests, typecheck and production build; local browser smoke.
  Learner check: Open localhost:5174, inspect the shortage, compare choices and apply the fourth microscope; confirm individual slots.
  Commit: `Build individual-turn scheduling studio`

- [x] **2. Edit, import and recover a workshop plan**
  Becomes usable: Manual editor, reviewable optional importer, synchronized playback, loss scenario and undo.
  Why now: Exercises the same kernel with changed assumptions and partial history.
  PRD ref: `prd.md > Confirming a Plan`, `prd.md > Resource Loss and Undo`, `prd.md > Importing Lesson Text`
  Spec ref: `spec.md > Scenario Repair`, `spec.md > Editor and Importer`
  Build: Validate fields/order, persist valid plans, bounded AI endpoint, cutoff repair and actual comparison.
  Verify (mechanical): Dependencies/overlap/disruption tests, invalid/API failure checks, browser core journey.
  Learner check: Edit duration, add/reorder task, scrub time, simulate loss and undo; inspect retained turns.
  Commit: `Add editable plans and disruption recovery`

- [x] **3. Export a usable facilitator kit and finish polish**
  Becomes usable: Print real cards/run sheet, download data, responsive accessible flow and documentation.
  Why now: Turns the inspected schedule into something a facilitator can use.
  PRD ref: `prd.md > Exporting a Run Sheet`, `prd.md > Look and Feel`
  Spec ref: `spec.md > Export`, `spec.md > Look and Feel`
  Build: Print layout, safe CSV/JSON, keyboard/mobile polish, README and app map.
  Verify (mechanical): Tests/check/build, real export content, desktop/mobile browser review and console check.
  Learner check: Print/export the repaired plan, use phone width, report unclear or broken behavior.
  Commit: `Finish facilitator exports and studio polish`

- [x] **4. Compare actual ways to preserve every full turn**
  Becomes usable: Preview equipment/time alternatives, inspect named before/after paths and apply an actual schedule, including disruption-aware recovery.
  Why now: Closes the facilitator decision after the proven shortage; a teacher may be unable to borrow equipment.
  PRD ref: `prd.md > Ways to Make Room`, `prd.md > Resource Loss and Undo`
  Spec ref: `spec.md > Choice Comparison`, `spec.md > Scenario Repair`
  Build: Add pure candidate generation and source revision checks; preserve full durations and protected history; build constraint locks, preview/application/undo and learner consequences.
  Verify (mechanical): Baseline +10 minutes/+1 place; loss at minute 8 +6 minutes with eight completed retained; mid-turn history, no-finite-option bounds, stale rejection, preview immutability, exact deltas, multi-task label honesty, tests/typecheck/build and parent browser/export verification.
  Learner check: Compare keeping equipment versus keeping the finish time; inspect a named learner, apply, simulate a loss and recover without changing completed turns.
  Commit: `Add verified ways to make room and learner consequences`

## Hands-on Checkpoints
- [ ] Early usable behavior explored — human feedback after slice 1; agent browser evidence recorded separately.
- [ ] Final kick-the-tires exploration and feedback completed

## Final Review
- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map
- [ ] Learning activity complete — human review pending
- [ ] Optional edit and transfer reflection addressed — not yet offered
- [x] `devpost/app-map.html` generated from finished code and source-checked; provided as a reference artifact with a project-grounded practice to reuse. Human walkthrough remains pending.
Activity and evidence: Implementation and agent mechanical/browser verification complete; the reference map is prepared. Human learning activity and feedback remain pending.
Route and stops: Reference-only route: `src/ChoiceWorkspace.tsx > ChoiceWorkspace` → `src/choices.ts > generateChoices / applyChoice` and `src/solver.ts > schedule` → `src/Room.tsx > Room` and `src/export.ts > toCSV`. No human guided stops claimed.
Edit outcome: Not applicable yet.
Reflection: Not established; no invented response.
Activity mode: Offline reference map prepared; human activity pending.

## Revisions
- Kernel checks passed; parent IAB verified 21→28 after adding the fourth place, then loss at minute 8→23 with 8 completed turns preserved. This is agent verification, not learner review.
- Capacity diagnosis now targets the constrained activity; turns longer than the session have no finite equipment fix. Historical room playback shows original resource capacity before the loss cutoff.

- Actual optional API calls verified one-action microscope extraction (one 4-minute task, capacity 3) and a two-action slide-preparation lesson. Strict schema plus independent validation; repeated AI actions are rejected. Import assumptions remain reviewable.

- Independent audit passed 8,400 scheduling invariant cases, 37 mocked API/schema/privacy checks, and 300 export cases comprising 19,230 parsed CSV rows. Agent tests are distinct from pending human final review.
- Imported-draft cancellation prevents stale responses reopening a closed editor. A separate pre-loss snapshot keeps scenario restoration usable after edit/undo. Interrupted work is described as needing a full restart, with actual fitting restart counts.

- Final agent browser pass at 390 × 844: document width equals viewport width (390px), readable hero/controls, editor fits and scrolls. Print-mode chronological run sheet visually verified with the export modal open. Human final review remains pending.

- Competitive review selected a constraint-aware choice workspace plus named consequences. Full turn durations remain fixed; accommodations, fairness history and shared resource expansion remain deferred. Planning updated before code under delegated implementation authorization.

- Choice revision verified: 20 committed tests, typecheck and production build. Independent audit passed 606 baseline/loss contexts and 381 full-path candidates, plus four explicit lock checks. Parent IAB verified baseline +10 minutes/+1 place, constraint locks, preview/apply/undo, named before/after paths, loss at minute eight and +6-minute recovery. Actual exported recovery JSON has 28 unique four-minute turns, all eight completed intervals identical, no overlaps or failed-resource use after cutoff.
- Mid-turn historical regression verified in IAB: lose one of four places at minute five, rewind to minute four; all four historical active turns render, including the interrupted turn. Room and roster explicitly show the before-loss view. Functional small labels and warning/missing/undo/chip text were darkened and enlarged after computed-style contrast review. Human final review remains pending.

- Public deployment verified on 2026-10-21 at [every-hand.vercel.app](https://every-hand.vercel.app). The deployed `/api/health` returned `ok: true` and `aiConfigured: true`. The deployment of `ff96645` completed without the earlier API type-definition warnings.
- Agent verification on the public deployment covered AI extraction of the fictional 28-learner/30-minute/3-place/4-minute lesson, +1-place repair to 28/28, loss at minute eight to 23/28 with eight completed turns preserved, and +6-minute recovery to 28/28 in 36 minutes. Downloaded CSV contained 28 learner rows and Zara's actual 32–36-minute turn at Place 2. No browser errors were observed. This is agent evidence; human review, authorship requirements and final submission remain pending.
