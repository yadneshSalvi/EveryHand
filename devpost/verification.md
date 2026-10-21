# Every Hand — Verification record

This records agent-run evidence. It does not claim a classroom pilot, human learner review, final submission readiness or educational outcomes.

## Automated checks

`npm test`, `npm run check` and `npm run build` pass on Node 22.22.3. The test command now runs 23 tests, including 100 deterministic randomized valid plans checked by an independent invariant function. Fixtures enforce 28 learners × 4 minutes with 3 microscopes in 30 minutes → 21 complete turns; with 4 → 28 and final finish 28.

The invariants check complete durations, session bounds, valid learner/resource IDs, no duplicate learner/task pairs, no learner/resource overlap, previous-activity completion and result-count parity. Repair is checked at 0, 4, 5, 12, 28 and 30 minutes, including restarting interrupted work at full duration and retaining every completed/unaffected active slot. A final-resource-loss fixture keeps historical work and schedules no new turns at zero capacity. A duration longer than the session returns no finite resource fix.

API tests exercise body length, malformed JSON, origin, empty text and invalid plan/schema values without cloud calls. CSV tests verify 29 rows for 28 learners, 21 scheduled and 7 missing turns, actual zero-minute starts, escaped comma/quote fields, guarded formula prefixes including leading whitespace, and parity after repair.

## Browser evidence

The orchestration agent used Codex's in-app browser:

- Loaded the actual local interface; baseline 21/28 became 28/28 after a fourth place.
- At minute 8, loss of one of four places produced 23/28 and preserved 8 completed turns. Rewind to minute 4 displayed all 4 historical benches.
- Edited a 5-minute session with a 6-minute activity; the interface correctly described the timing impossibility. Reload clamped the preview to 5.
- Downloaded the actual JSON and independently inspected 28 learners, 21 slots and 7 missing turns.
- Entered a different fictional lesson: 12 learners, 24 minutes, observe a stone with a loupe 3 minutes/capacity 2, then sketch 2 minutes/capacity 4. Live AI extraction returned exactly those 2 activities and anonymous labels. Applying yielded 12/12. Downloaded JSON contained 24 turns, correct durations/capacity, ordered dependencies, no learner/resource overlap and last finish 20.
- Tested the maximum 60-learner plan in the in-app browser: all 60 tokens stayed inside the room, the baseline correctly showed 21/60 complete paths, the chronological print view rendered 21 scheduled rows, and the individual-card output contained 60 cards. The final card clearly marked the missing full turn and facilitator follow-up. This was an agent visual/DOM check, not a physical print test. The fictional 28-learner example was restored afterward.
- Reviewed desktop composition and 390 × 844 mobile layout. Readability feedback led to 12–16 px mobile functional controls, a full-width lesson-title row, a scrollable detailed room and a locally scrolling readable roster.

Final mobile pass at 390 × 844 confirmed document width equals viewport width (390px), controls are readable, and the editor fits and scrolls. The chronological run sheet was visually verified in print mode with the export modal open. Human final hands-on review remains pending.

## Live service evidence

Two direct local API calls successfully extracted a single microscopy activity and a two-stage preparation/observation plan. The first early model response invented repeated rounds; the prompt was corrected to prohibit rotations/waves as activities, and independent duplicate-action validation now rejects that failure rather than silently scheduling it. AI output is always a draft requiring review.

An independent scheduling audit ran `./node_modules/.bin/tsx /tmp/everyhand-independent-audit.ts` and passed 8,400 invariant cases. A CSV audit ran `./node_modules/.bin/tsx /tmp/everyhand-export-audit.ts` and passed 300 generated baseline/repair plans and 19,230 parsed CSV rows, including comma, quote, newline, Unicode and formula-prefix fields. These temporary audit scripts are additional session evidence; the committed reproducible suite remains `npm test`.

A separate audit agent ran `./node_modules/.bin/tsx /tmp/everyhand-api-audit.mts` and passed 37 mocked API/schema/privacy checks: strict schema, `store:false`, sanitized provider failures, refusal/incomplete output, invalid shapes and rate limiting. These checks used mocked provider responses; they are distinct from the live API and browser evidence above.

## Remaining human work

Review the product and planning drafts; try a real classroom timing assumption; complete the brief app-map/code learning activity if desired; record a human-narrated public demo under 3 minutes; write and submit the final Devpost entry. The public deployment is recorded below; human review and final submission remain pending.

Two additional source findings were repaired: interrupted-turn text distinguishes a required full restart from actual restarted slots, and a separate pre-loss baseline keeps “Restore previous plan” usable even after editing and undoing into a disrupted snapshot.

## Choice-workspace revision

The public plan was updated before implementation. The new pure comparison tests cover the exact +10-minute/+1-place baseline alternatives, +6-minute loss recovery, cutoff-inside-turn history, zero remaining resources, a turn longer than the session, bounded no-option results, named gains, immutable preview, current constraint locks and stale/tampered candidate rejection.

An additional independent audit ran `./node_modules/.bin/tsx /tmp/everyhand-choices-audit.ts`: 606 baseline/loss contexts and 381 actual full-path candidates passed slot duration, unique-pair, overlap, dependency, horizon, protected-history, stale/tamper and exact preceding-bound checks.

The orchestration agent's in-app browser verified both baseline choices, both locks disabling Apply, named learner gains, equipment-option application, undo restoring 21/28, loss at minute eight producing 23/28, and the +6-minute recovery preview restoring 28 with eight completed turns preserved. Mobile comparison layout passed. Functional status/metadata contrast and type size were strengthened following computed-style browser review.

The actual JSON exported after applying the 36-minute recovery was independently inspected: 28 unique four-minute turns, all eight completed intervals unchanged, no learner/resource overlap and no use of the failed place after minute eight. A separate mid-turn browser check lost one of four places at minute five and rewound to minute four: all four original active turns, including the interrupted turn, appeared with explicit historical labels. Preview uses the original pre-loss schedule; choices and exports retain the actual current recovery schedule. The independent audit also passed four current-lock application checks.

## First-use presentation revision

Two independent agents reviewed the products against the official criteria. Their focused presentation feedback led to a compact named-learner proof beside the two desktop options. The name, added activity, full duration, time and place come from the selected candidate's actual schedule delta. This is agent review, not facilitator validation.

The parent verified the initial comparison at 1280 × 720 without scrolling: both +10-minute/+1-place choices, the unchanged four-minute duration, Zara's missing-to-scheduled turn, Preview only and Apply were visible together. Switching options changed Zara from 36:00–40:00 at Place 1 to 24:00–28:00 at Place 4 while the current plan remained 21/28. Applying yielded 28/28. Losing a place at minute eight yielded 23/28 with eight completed turns preserved; the +6-minute comparison showed Zara's actual 32:00–36:00 turn at Place 2, and application/undo preserved that history. Locking both limits hid the candidate proof and disabled Apply. At 390 × 844 the document had no horizontal overflow, the comparison content scrolled, and Apply remained available in the footer. An independent reviewer accepted the updated desktop screenshot; the public comparison image shows the actual first-screen state.

## Public deployment verification — 2026-10-21

The studio is deployed at [every-hand.vercel.app](https://every-hand.vercel.app). The public `/api/health` endpoint returned `ok: true` and `aiConfigured: true`. Deployment of commit `ff96645` succeeded without the API type-definition warnings seen in the first deployment. The source build, typecheck and all 23 committed tests passed locally on Node 22.22.3.

The orchestration agent tested the public interface in the browser:

- AI import extracted the fictional 28-learner, 30-minute lesson with one four-minute activity and three places correctly, retaining the reviewable draft workflow.
- Adding one place produced 28/28 complete turns. Losing a place at minute eight produced 23/28 while retaining all eight completed turns.
- Applying six extra minutes restored 28/28 at a 36-minute horizon.
- The downloaded CSV contained 28 learner data rows; Zara's turn was 32–36 minutes at Place 2.
- No browser errors were observed during this flow.

Production tests also cover missing/foreign origins, HTTPS same-origin acceptance, malformed/oversized bodies, content type and best-effort per-instance burst limits, plus the actual Vercel Web handler export. No classroom use, real-user feedback, human-authored submission or final submission readiness is claimed by this deployment evidence.
