# Every Hand

**Make room for every learner's hands-on turn.**

Every Hand is a workshop planning studio for teachers and facilitators. It schedules complete **individual** opportunities, reveals equipment and time shortfalls, and rebuilds the remaining plan after a simulated resource loss.

The fictional microscope example makes the difference visible:

| Plan | Complete individual turns | Learners still missing a turn |
| --- | ---: | ---: |
| 28 learners · 30 minutes · 4 minutes each · 3 microscopes | 21 | 7 |
| The same lesson with a fourth microscope | 28 | 0 |

Three microscopes provide 90 microscope-minutes against 112 needed. The stronger whole-turn limit is `3 × floor(30 / 4) = 21`. Four microscopes fit seven waves and finish all 28 turns at minute 28.

## Try it locally

Requires Node.js **22.12 or later** and npm.

```sh
npm install
npm run dev
```

Open [localhost:5174](http://localhost:5174). The sample, manual editor, solver, timeline, simulated loss and exports all work without an API key or backend.

For optional AI lesson import, create an ignored `.env` using `.env.example` as a reference, add your own `OPENAI_API_KEY`, and run in a second terminal:

```sh
npm run server
```

The local API listens on `127.0.0.1:3002`; Vite proxies `/api` to it. The default import model is `gpt-5.4-mini`; `OPENAI_IMPORT_MODEL` can override it with a model that supports structured outputs. The app sends lesson text to OpenAI only after the explicit **Create a draft** action. Draft fields remain editable and require applying before the current plan changes. API usage may incur charges under your account.

## Walk through the proof

1. Start with the labeled fictional example. Inspect **21 / 28** and the seven learners needing a turn.
2. Choose **Add one more place**. The schedule becomes **28 / 28**.
3. Play or scrub the room. Select a learner to inspect their exact time and place.
4. At minute 8, choose **Lose a place**. The four-place example becomes **23 / 28**; eight completed turns stay preserved. Undo restores the prior plan.
5. Open **Facilitator kit**. Print the chronological run sheet and individual cards, or download the actual JSON/CSV schedule.
6. Edit or paste a different lesson. Up to four activities run in the specified prerequisite order; each learner needs a complete turn in each activity.

## How scheduling works

The pure TypeScript scheduler assigns non-preemptive, whole-minute slots while enforcing one learner per place, no learner/resource overlap and ordered prerequisites. It chooses eligible learners deterministically, with downstream activities scheduled first at a time step and roster order as a stable tie break.

The single-activity whole-turn bound is exact. A per-activity capacity shortfall is a necessary impossibility bound. **Multi-activity scheduling is a heuristic:** failure to serve everyone does not prove that no better ordering exists. The interface distinguishes a proven equipment bound from a schedule that needs timing review. If an activity exceeds the session length, no resource count fixes it; the interface asks for a timing change.

At simulated resource loss, slots completed by the cutoff remain immutable. Active turns on surviving places finish. An interrupted turn on the lost place restarts at its full duration if time remains. Future turns are rebuilt from the remaining capacity. Rewinding the preview before the cutoff shows the historical resource count.

## Verification

```sh
npm test
npm run check
npm run build
```

The tests cover the canonical 21/28 and 28/28 fixtures, 100 deterministic randomized plans, independent overlap/dependency invariants, disruption boundaries and mid-turn restart, invalid inputs, import HTTP boundaries, CSV data parity and spreadsheet formula escaping. See [the verification record](devpost/verification.md) for browser and live API evidence.

## Project map

| File | Responsibility |
| --- | --- |
| `src/solver.ts` | Plan validation, deterministic scheduling, capacity proofs and disruption repair |
| `src/solver.test.ts` | Scheduling fixtures and independent invariants |
| `src/App.tsx` | Editing, timeline state, import review, learner detail and printable kit |
| `src/Room.tsx` | SVG room driven by actual slots |
| `src/export.ts` | CSV escaping and file downloads |
| `server/index.ts` | Optional bounded, validated OpenAI importer |
| `src/styles.css` | Editorial studio, responsive layout, reduced motion and print styling |
| `devpost/` | Scope, PRD, technical spec, build checklist and offline app map |

[Open the offline app map](devpost/app-map.html) for a short reference route through one real interaction.

## Boundaries and data

- 1–60 learners, a 5–120-minute session, 1–4 ordered activities, whole-minute turns and 1–16 simultaneous places. A simulated loss can reduce a task to zero places.
- Each activity has its own dedicated equipment pool. Shared equipment across separate activities is not modeled; combine those steps into a single activity with a full combined duration.
- Durations include reset and movement; no additional physical travel time or learner availability model is inferred.
- The room is a schedule preview. **A planned opportunity is not observed participation or evidence of learning.**
- The current baseline plan is saved in this browser using versioned, validated local storage. The simulated loss, playback position and pasted import text are not persisted. Refresh returns to the baseline plan.
- No accounts, collaboration, analytics, database or attendance hardware. The optional server binds only to localhost and does not log pasted text, API keys or raw provider errors.
- Local storage can be cleared through browser settings. Use anonymous labels when entering or importing classroom notes.
- No deployment, classroom pilot, endorsement or educational-effectiveness claim is made. Human final review and the required narrated demo/submission remain pending.

## Planning and attribution

This new project uses the **Devpost Learn Build With AI: Basics** skill pack, installed before application code. The public [scope](devpost/scope.md), [PRD](devpost/prd.md), [spec](devpost/spec.md) and [checklist](devpost/checklist.md) record the plan and implementation. Documents remain marked draft because the user delegated implementation and has not personally reviewed each document; no interview or sign-off was invented. `skills-lock.json` records installation provenance.

Application code and workshop vectors were created for this project with AI coding assistance. React, Vite, TypeScript, Lucide and tsx are third-party dependencies recorded in the lockfile. DM Sans and DM Serif Display are bundled locally under their included SIL Open Font Licenses in `public/fonts/`; the app does not fetch fonts from a third-party service at runtime. OpenAI structured-output extraction is optional.

Application source is MIT licensed. Font files retain their separate OFL licenses.
