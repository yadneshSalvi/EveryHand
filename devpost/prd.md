---
doc: prd
status: draft
implementation_authorization: delegated by user before build; human document review pending
---
# Every Hand — Product Requirements
An individual opportunity planner for teachers and facilitators. Source: `scope.md > The Unique Kernel`.

## The Core Journey
1. Arrive at a working, explicitly fictional microscope example with a visible 21/28 result.
2. Inspect 28 learners, a 30-minute session, four-minute turns including reset, and three microscopes.
3. Add the recommended fourth microscope or edit the plan. Replan and see 28 complete opportunities.
4. Scrub or play the timeline; select a learner to inspect their exact turn.
5. Simulate a microscope loss at the selected minute; preserve completed turns, keep unaffected active turns, and rebuild the remainder. Undo is available.
6. Export printable individual turn cards and a facilitator run sheet, or download schedule data.

## Screens and Layout
One main studio with a compact top bar, editorial introduction and editable lesson summary. Main content pairs a large vector workshop/timeline with a resource diagnosis. A per-learner schedule follows. Accessible dialogs hold the editor, importer, learner detail and export preview.

## Look and Feel
Cream paper, forest ink, orange/coral, sage and subtle warm grey. Serif display headings with system sans controls. Deliberate whitespace, thin borders, restrained corners and bespoke microscope/learner vectors. Responsive desktop/mobile; visible keyboard focus; reduced-motion support.

## Features and Behavior
### Confirming a Plan
Manual editor handles title, anonymous learner names/count, duration, parallel resources and ordered tasks. Numeric bounds show field-specific errors. Reordering changes prerequisite order. Saving validates before changing the current schedule. Fictional example reset is explicit and undoable.
### Individual Opportunities
A learner counts as fully served only when every required task has a complete valid slot inside the horizon. Show scheduled, active, completed-at-preview and unserved separately. Each slot gives task, resource, start and end. A learner never occupies two tasks simultaneously. Source: `scope.md > The Unique Kernel`.
### Explaining the Shortfall
For the example, display 112 required microscope-minutes versus 90 available and the stronger whole-turn bound 3 × floor(30/4) = 21. Never display fractional learners. Capacity proofs are identified as such; multi-task heuristic shortfalls do not claim global impossibility. Resource and duration edits recalculate the schedule.
### Timeline and Room
Play/pause, restart and a labeled range scrubber drive the same slot state used by the roster. Selected learners are highlighted. Simulation is clearly distinct from actual attendance. Every visible station represents actual resource capacity, with a compact aggregate view if capacity is large.
### Resource Loss and Undo
Remove one first-task resource at current preview time. Completed turns stay complete. In-progress turns on surviving resources finish. A turn interrupted on the removed resource restarts at full duration. Future slots are recomputed; show before/after counts and the exact cutoff. One loss per scenario, undo restores prior schedule.
### Importing Lesson Text
Paste bounded plain text. Explicit import action discloses transmission to OpenAI and encourages anonymous labels. Loading, timeout and service-unavailable states retain text. Structured draft displays assumptions for human correction before applying. Core manual/example flow requires no key.
### Exporting a Run Sheet
Print real cards and chronological facilitator sheet derived from current slots; identify unmet turns and simulation assumptions. Download CSV/JSON with actual data. No fabricated PDF download or fake export success.

## States and Boundaries
- First use: fictional microscope example, with seed label and assumptions.
- Invalid input: prevent apply and name the invalid field.
- Unserved: show missing learners/tasks and a concrete capacity explanation where provable.
- Saved locally: browser plan persists; incompatible/corrupt state falls back safely to sample.
- Cloud unavailable: actionable error and manual editing remain usable.
- Resource loss: visible cutoff, preserved-turn count and undo.
- No opportunities fit: explicit empty schedule and editable assumptions.

## Product Decisions
The user named Every Hand and delegated planning and implementation. Warm studio styling, bounded ordered tasks, local storage, optional import and the specific fixture are agent recommendations within that authorization; no personal review is claimed.

## What We're Building
The full core journey above with validated inputs, deterministic slot invariants, responsive accessible interactions, explicit assumptions and real export.

## Deferred From the POC
Accounts, collaboration, arbitrary dependency graphs, attendance hardware and live classroom tracking require separate product validation.

## Possible Later Enhancements
Availability windows and teacher-observed timing could make planning closer to classroom practice after field testing.

## Non-Goals
Predicting child behavior, promising educational outcomes or certifying actual participation. A planned opportunity is a schedule, not an observed outcome.

## Open Questions
Human final design review, classroom validation and narrated demo remain pending; none blocks the explicitly authorized local implementation.
