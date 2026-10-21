# Word-timed shot plan

All 38 narration-linked source changes, camera cues, and text reveals in film.json name actual Deepgram phrases and word IDs; there are zero timing estimates. Five act openings use their actual audio act boundaries. Camera arrivals are 0–0.05s before the recorded phrase. Times are scene-local, with actual act starts in audio_meta.json. Total: 165.75s. Source stills remain native 1600×1000 geometry despite 2× capture. The PDF pages use their actual 1697×2400 geometry.

Interaction clips contain real browser actions. Their uniform playback-rate changes are recorded per shot, followed by the true high-resolution final state. No source motion is interpolated. Arjun's preserved interval is 0:00–4:00 at Place 4; Zara's final interval is 32:00–36:00 at Place 2. The video of minute 32→36 is explicitly a fictional schedule preview.

Source captures and generated PDF are preserved separately. No UI, result count, learner time, or output row is recreated. Text bridges state verified assumptions and do not impersonate app controls. No burned-in narration; transcript.srt is delivered separately.

## Final composition verification

The frozen composition is 1920×1080 at 60 fps and 165.75 seconds. Native check `86a7bab2-ef34-4b5d-98a2-0b0dac2177c0` passed: zero lint errors, runtime warnings/errors, layout issues, or motion warnings/errors; all 25 contrast checks passed. The copied report is `native-check.json`.

The 15 lint advisories are intentional: eleven nested-media timing advisories describe composition-local action starts, and four density advisories describe the coherent act tracks. Every action timestamp is local to its owning act; no root-global media start is used. Clips and final-state stills are siblings in one untimed camera world. The five-act structure keeps each narrated operation together. Intentional camera overflow is declared on the clipped worlds.

All 38 narration-linked cues resolve actual Deepgram words. There are zero estimated cue times. Names, four-minute math, 21/28 and 23/28, eight completed turns, six extra minutes, Zara's final slot and the output row are visibly supported by actual capture or exported output. The run-sheet detail retains every column of Zara's row, including Place 2. The learner-card detail shows the whole original printed card. Crops remove adjacent paper content; source pixels are not rewritten.

`final-proof/` contains 22 inspected frames and three contact sheets. Its two PDF frames were refreshed from `pdf-proof/` after the final crop correction. `frozen-composition-sha256.json` records the index and five act files at handoff. Render/decode/loudness verification is performed separately by the final delivery workflow.

Run `npm run build:video` to regenerate all five acts and automatically reapply the native voiceover carve. `npm run carve:audio` can reapply the same analysis independently. FLAC stems are read from `audio_meta.json`; the generated index keeps narration, music and effects as separate native audio elements. `transcript.srt` remains a separate optional subtitle file.
