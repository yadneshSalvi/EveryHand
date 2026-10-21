# Submission video verification

Independent agent audit, 21 October 2026, against [the public website](https://every-hand.vercel.app). The audit used the final 165.8-second submission video's audio and rendered claims, then reproduced the workflow through the deployed interface. This is software verification with fictional data, not a classroom trial.

## Video claims reproduced

| Video | Website action and observed result |
| --- | --- |
| 0:13–0:30 | Reset the example: 28 learners, 3 microscopes, 30 minutes, 4 minutes per full turn. Exactly 21 learners have turns; Zara is among the 7 without one. |
| 0:31–1:02 | Compare choices: +10 minutes or +1 place. Locking equipment disables that option. Unlocking and previewing the extra place gives Zara 24–28 at Place 4 while the applied plan remains unchanged. |
| 1:03–1:35 | Apply the fourth place: 28/28. Move to minute 8 and simulate a loss: 23/28 total, 5 missing, and all 8 completed turns preserved. The 23 includes the 8 completed turns. |
| 1:36–2:11 | Compare recovery and apply +6 minutes: 28/28 by minute 36, with Zara at 32–36 in Place 2. All turns remain 4 minutes and all completed records retain their original times and places. |
| 2:12–2:29 | Open the facilitator kit. Downloaded JSON and CSV agree exactly. The actual print stylesheet generates a three-page PDF: 28 chronological run-sheet rows and 28 learner cards. Zara's row and card agree. The unrepaired baseline explicitly marks 7 missing turns. |
| 2:29–2:38 | The repository and public planning documents are available without authentication. The application plans opportunities; it does not measure attendance or learning. |

## Independent output checks

The audit parsed files downloaded through the live website, separately from the application solver. It found 28 unique scheduled learners, no overlapping resource intervals, full four-minute durations, all eight original completed slots unchanged, and no future use of the failed place. CSV rows matched JSON schedule records. Printed pages were rendered and inspected, including the last learner card.

The shown minima can also be checked without trusting the solver:

- Three places at 39 minutes fit only `3 × floor(39/4) = 27` turns; at 40 minutes they fit 30. Thus the minimum extension from 30 minutes is **10 minutes**.
- At 30 minutes, three places fit 21 turns and four places fit 28. Thus **one additional place** is enough and necessary.
- After the minute-8 failure, eight turns are preserved. Finishing at 35 minutes allows only `8 + 3 × floor((35−8)/4) = 26` total turns. At 36 minutes capacity is 29, sufficient for all 28. Thus **six additional minutes** is the minimum for this recovery scenario.

These exact minima apply to the single-activity assumptions shown. Multi-activity choices are labeled verified heuristic results.

## Additional checks and limits

The live AI lesson import produced an editable draft from a different fictional lesson; it did not change the current plan before application. Manual edits and the ordinary plan survived refresh. A turn longer than the whole session correctly made equipment-only recovery unavailable. A mid-turn failure was checked separately from the video's boundary-time failure. All **23 automated tests passed**.

Resource-loss simulations and their recovery state are session-local: refreshing restores the saved pre-disruption plan. Export the current kit/JSON/CSV before leaving if retaining that recovery matters. Native `window.print()` opened a blocking dialog in the testing browser; closing its tab released it. The same website print content and CSS were successfully verified using browser PDF generation, without claiming a physical-printer test.

No implementation defect or material mismatch with the demonstrated video behavior was found in this audit. The raw screenshots, downloaded files, PDF, and independent verifier are retained in the local ignored `plans/audit-evidence/` folder. They are distinct from the committed automated test suite.
