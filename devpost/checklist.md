---
doc: checklist
status: draft
implementation_authorization: delegated by user before build; human document review pending
---
# Build Checklist
Build mode: fast — explicit autonomous implementation authorization. Human hands-on review remains pending.

## Slices
- [x] **1. Inspect and repair a real individual-turn schedule**
  Becomes usable: A running microscope studio shows21/28 and fourth-resource repair28/28, with individually inspectable slots.
  Why now: Proves the unique kernel before peripheral features.
  PRD ref: `prd.md > Individual Opportunities`, `prd.md > Explaining the Shortfall`
  Spec ref: `spec.md > Plan Validation and Scheduler`, `spec.md > Workshop Studio`
  Build: Scaffold inside first slice; implement/test solver, room, capacity diagnosis and roster.
  Verify (mechanical): Kernel fixtures, invariant tests, typecheck and production build; local browser smoke.
  Learner check: Open5174, inspect shortage and add the fourth microscope; confirm individual slots.
  Commit: `Build individual-turn scheduling studio`

- [ ] **2. Edit, import and recover a workshop plan**
  Becomes usable: Manual editor, reviewable optional importer, synchronized playback, loss scenario and undo.
  Why now: Exercises the same kernel with changed assumptions and partial history.
  PRD ref: `prd.md > Confirming a Plan`, `prd.md > Resource Loss and Undo`, `prd.md > Importing Lesson Text`
  Spec ref: `spec.md > Scenario Repair`, `spec.md > Editor and Importer`
  Build: Validate fields/order, persist valid plans, bounded AI endpoint, cutoff repair and actual comparison.
  Verify (mechanical): Dependencies/overlap/disruption tests, invalid/API failure checks, browser core journey.
  Learner check: Edit duration, add/reorder task, scrub time, simulate loss and undo; inspect retained turns.
  Commit: `Add editable plans and disruption recovery`

- [ ] **3. Export a usable facilitator kit and finish polish**
  Becomes usable: Print real cards/run sheet, download data, responsive accessible flow and documentation.
  Why now: Turns the inspected schedule into something a facilitator can use.
  PRD ref: `prd.md > Exporting a Run Sheet`, `prd.md > Look and Feel`
  Spec ref: `spec.md > Export`, `spec.md > Look and Feel`
  Build: Print layout, safe CSV/JSON, keyboard/mobile polish, README and app map.
  Verify (mechanical): Tests/check/build, real export content, desktop/mobile browser review and console check.
  Learner check: Print/export the repaired plan, use phone width, report unclear or broken behavior.
  Commit: `Finish facilitator exports and studio polish`

## Hands-on Checkpoints
- [ ] Early usable behavior explored — human feedback after slice1; agent browser evidence recorded separately.
- [ ] Final kick-the-tires exploration and feedback completed

## Final Review
- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map
- [ ] Learning activity complete — human review pending
- [ ] Optional edit and transfer reflection addressed — not yet offered
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse
Activity and evidence: Pending implementation; agent verification does not imply learner practice.
Route and stops: Will point to actual post-build symbols.
Edit outcome: Not applicable yet.
Reflection: Not established; no invented response.
Activity mode: Reference route will be prepared; human activity pending.

## Revisions
- Kernel checks passed; parent IAB verified21→28 after adding the fourth place, then loss at minute8→23 with8 completed turns preserved. This is agent verification, not learner review.
- Capacity diagnosis now targets the constrained activity; turns longer than the session have no finite equipment fix. Historical room playback shows original resource capacity before the loss cutoff.
