# Every Hand submission record

Submitted to **Build With AI: Basics** on **27 October 2026 (IST)**, following explicit user agreement. Devpost displayed “Project submitted!” and “SUBMITTED TO Build With AI: Basics”.

- [Public Devpost entry](https://devpost.com/software/every-hand)
- [Source repository](https://github.com/yadneshSalvi/EveryHand)
- [Live app](https://every-hand.vercel.app)
- [Public submission video](https://www.youtube.com/watch?v=HpzBnIrJPFw)
- [MIT license](https://github.com/yadneshSalvi/EveryHand/blob/main/LICENSE)

This records the submitted project material. Human product review and the human learning reflection remain unestablished.

## Project name

Every Hand

## Elevator pitch

Make room for every learner’s hands-on turn. Compare extra time with extra equipment, recover when a station fails, and leave with a schedule you can actually use.

## Main technology requirement

The Devpost Learn Skill Pack put planning first. Scope, PRD and spec were committed before code. I chose the direction and delegated detailed decisions to agents. The plan defines full turns, fixed constraints and what must survive a failure.

## Submitted project story

## Inspiration

A group can reach a microscope without every person getting a turn. Dividing a class into groups can hide that difference, especially when equipment is scarce and the lesson has a fixed finish time.

Every Hand starts with a smaller, concrete question: is there enough time for each learner to complete the hands-on activity? The aim is to make that opportunity visible before a workshop begins, then help a facilitator decide what to change.

## What it does

The opening example is fictional: 28 learners, three microscopes, 30 minutes and four minutes per full turn. That fits only 21 complete turns. Seven learners still need one.

Every Hand compares two working schedules: keep the three microscopes and add ten minutes, or keep the finish time and add one microscope. Neither option shortens anyone's turn. You can lock the constraint you cannot change and inspect a named learner's actual time and place before applying a choice. Zara, for example, goes from missing a turn to 24-28 minutes at the fourth microscope.

The plan also has to survive a problem. After applying the fourth microscope, lose one at minute eight: the schedule falls to 23 complete opportunities. Eight completed turns stay exactly where they were. Six extra minutes restore all 28 with the three remaining microscopes. A facilitator can then print the chronological run sheet and individual cards, or download the same schedule as CSV or JSON.

## How it was built

I selected the direction and priorities, then delegated implementation to coding agents. The Devpost Learn Build With AI: Basics skill pack structured the [scope](https://github.com/yadneshSalvi/EveryHand/blob/main/devpost/scope.md), [requirements](https://github.com/yadneshSalvi/EveryHand/blob/main/devpost/prd.md), [technical plan](https://github.com/yadneshSalvi/EveryHand/blob/main/devpost/spec.md) and build checklist. Those public planning documents were committed before application code, and the later comparison feature was planned before it was implemented.

The app uses React, TypeScript, Vite and custom CSS and SVG. The same scheduling code powers the room, learner details, comparisons and exports. Optional OpenAI lesson import turns pasted notes into an editable draft. It does not decide whether the schedule works. The core planner runs without an API key; the public version is hosted on Vercel.

## Challenges

One early AI import turned a single observation activity into repeated rounds. The extraction instructions and validation were tightened so equipment counts could not silently become extra activities. Imported plans still require review before application.

Recovery needed more care than simply running the scheduler again. Completed work had to remain fixed, unaffected active turns had to finish, and interrupted work needed a full restart. Another challenge was keeping a preview from overwriting a plan that had changed. Applying a choice now checks the current plan and protected history again.

## Accomplishments

The strongest result is a complete, inspectable journey from a shortage to a usable plan. Agent interface review led to placing Zara's before-and-after turn beside the choices, making the consequence visible alongside the numbers. The build includes 23 automated tests, separate scheduling and export audits, and browser checks on desktop and mobile. Downloaded recovery files were independently checked for full durations, no overlaps and all eight completed turns preserved.

## What the build taught

A plausible total is not enough. Three microscopes offer 90 minutes against 112 needed, but whole turns reveal the sharper limit of 21 people. The build also reinforced the value of keeping AI suggestions reviewable and proving schedule changes with actual slots. Exact single-activity bounds are distinguished from multi-activity schedules that may have better alternatives.

## What's next

The next step is facilitator testing with real timing assumptions, including movement and reset time. Shared equipment across activities and learner availability would broaden the model. For now, Every Hand plans opportunities. It does not measure attendance or claim learning outcomes.
