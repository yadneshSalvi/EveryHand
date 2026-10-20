# Every Hand — Verification record

This records agent-run evidence. It does not claim a classroom pilot, human learner review, final submission readiness or educational outcomes.

## Automated checks

`npm test`, `npm run check` and `npm run build` pass on Node 22.22.3. The test command runs 12 tests, including 100 deterministic randomized valid plans checked by an independent invariant function. Fixtures enforce 28 learners × 4 minutes with 3 microscopes in 30 minutes → 21 complete turns; with 4 → 28 and final finish 28.

The invariants check complete durations, session bounds, valid learner/resource IDs, no duplicate learner/task pairs, no learner/resource overlap, previous-activity completion and result-count parity. Repair is checked at 0, 4, 5, 12, 28 and 30 minutes, including restarting interrupted work at full duration and retaining every completed/unaffected active slot. A final-resource-loss fixture keeps historical work and schedules no new turns at zero capacity. A duration longer than the session returns no finite resource fix.

API tests exercise body length, malformed JSON, origin, empty text and invalid plan/schema values without cloud calls. CSV tests verify 29 rows for 28 learners, 21 scheduled and 7 missing turns, actual zero-minute starts, escaped comma/quote fields, guarded formula prefixes including leading whitespace, and parity after repair.

## Browser evidence

The orchestration agent used Codex's in-app browser:

- Loaded the actual local interface; baseline 21/28 became 28/28 after a fourth place.
- At minute 8, loss of one of four places produced 23/28 and preserved 8 completed turns. Rewind to minute 4 displayed all 4 historical benches.
- Edited a 5-minute session with a 6-minute activity; the interface correctly described the timing impossibility. Reload clamped the preview to 5.
- Downloaded the actual JSON and independently inspected 28 learners, 21 slots and 7 missing turns.
- Entered a different fictional lesson: 12 learners, 24 minutes, observe a stone with a loupe 3 minutes/capacity 2, then sketch 2 minutes/capacity 4. Live AI extraction returned exactly those 2 activities and anonymous labels. Applying yielded 12/12. Downloaded JSON contained 24 turns, correct durations/capacity, ordered dependencies, no learner/resource overlap and last finish 20.
- Reviewed desktop composition and 390 × 844 mobile layout. Readability feedback led to 12–16 px mobile functional controls, a full-width lesson-title row, a scrollable detailed room and a locally scrolling readable roster.

Final mobile pass at 390 × 844 confirmed document width equals viewport width (390px), controls are readable, and the editor fits and scrolls. The chronological run sheet was visually verified in print mode with the export modal open. Human final hands-on review remains pending.

## Live service evidence

Two direct local API calls successfully extracted a single microscopy activity and a two-stage preparation/observation plan. The first early model response invented repeated rounds; the prompt was corrected to prohibit rotations/waves as activities, and independent duplicate-action validation now rejects that failure rather than silently scheduling it. AI output is always a draft requiring review.

An independent scheduling audit ran `./node_modules/.bin/tsx /tmp/everyhand-independent-audit.ts` and passed 8, 400 invariant cases. A CSV audit ran `./node_modules/.bin/tsx /tmp/everyhand-export-audit.ts` and passed 300 generated baseline/repair plans and 19, 230 parsed CSV rows, including comma, quote, newline, Unicode and formula-prefix fields. These temporary audit scripts are additional session evidence; the committed reproducible suite remains `npm test`.

A separate audit agent ran `./node_modules/.bin/tsx /tmp/everyhand-api-audit.mts` and passed 37 mocked API/schema/privacy checks: strict schema, `store:false`, sanitized provider failures, refusal/incomplete output, invalid shapes and rate limiting. These checks used mocked provider responses; they are distinct from the live API and browser evidence above.

## Remaining human work

Review the product and planning drafts; try a real classroom timing assumption; complete the brief app-map/code learning activity if desired; record a human-narrated public demo under 3 minutes; write and submit the final Devpost entry. No deployment is included in this local build.

Two additional source findings were repaired: interrupted-turn text distinguishes a required full restart from actual restarted slots, and a separate pre-loss baseline keeps “Restore previous plan” usable even after editing and undoing into a disrupted snapshot.
