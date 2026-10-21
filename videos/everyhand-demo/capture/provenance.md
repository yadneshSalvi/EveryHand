# Browser capture provenance

These assets derive from actual interactions with the local applications. No interface, result, source rectangle, learner slot, or model finding was synthesized.

Run `python3 scripts/process-capture.py` to process completed numbered takes incrementally. The script excludes the probe directory and reads only JPEG filenames explicitly listed in each recording.json. Stray images from failed takes are ignored. Source hashes and first/last timestamps are recorded in manifest.json.

For moving clips, successive CDP timestamps define each JPEG's duration. A microsecond concat input time base preserves these intervals before 30fps resampling. The last listed frame receives a documented 0.4-second end hold. No motion interpolation or playback-rate change is applied here. MP4 output is 1600×1000 H.264, CRF16, yuv420p. Actual duration may differ by one 30fps frame. The wall duration field is retained as capture metadata; it is not confused with final film timing.

Final WebP stills are encoded at quality95 directly from the actual 3200×2000 final@2x.png. The 1600×1000 final.png and every listed JPEG are dimension-checked. The known initial Mosaic overview replacement is therefore represented by its current correct final@2x.png. No generated output-image evidence is substituted; separately verified Mosaic PNG exports stay separate.

Later slow-motion, trims, crop motion, holds, and processing-wait cuts must be recorded by the final film composition. A slowed interaction is still real footage; it must not imply real-time performance. The contact sheet is labeled for review and must not be used as film imagery.

Generated: 2026-10-21T06:02:19.623347+00:00

| Step | Listed frames | CDP span | Clip duration | Still |
| --- | ---: | ---: | ---: | --- |
| 01-missing-zara | 13 | 0.297735s | 0.700s | assets/capture/01-missing-zara.webp |
| 02-workshop-overview | 138 | 3.349769s | 3.733s | assets/capture/02-workshop-overview.webp |
| 03-whole-turns | 130 | 3.118258s | 3.533s | assets/capture/03-whole-turns.webp |
| 04-compare-options | 14 | 0.285150s | 0.700s | assets/capture/04-compare-options.webp |
| 05-lock-equipment | 15 | 0.281668s | 0.667s | assets/capture/05-lock-equipment.webp |
| 06-preview-extra-place | 29 | 0.633593s | 1.033s | assets/capture/06-preview-extra-place.webp |
| 07-apply-extra-place | 15 | 0.345816s | 0.733s | assets/capture/07-apply-extra-place.webp |
| 08-zara-scheduled | 12 | 0.213831s | 0.600s | assets/capture/08-zara-scheduled.webp |
| 09-find-zara-in-room | 16 | 0.262191s | 0.666s | assets/capture/09-find-zara-in-room.webp |
| 10-before-disruption | 1 | 0.000000s | 0.400s | assets/capture/10-before-disruption.webp |
| 11-lose-microscope | 11 | 0.268117s | 0.667s | assets/capture/11-lose-microscope.webp |
| 12-six-minute-recovery | 17 | 0.338350s | 0.733s | assets/capture/12-six-minute-recovery.webp |
| 13-apply-recovery | 14 | 0.316369s | 0.700s | assets/capture/13-apply-recovery.webp |
| 14-zara-recovered | 14 | 0.317194s | 0.733s | assets/capture/14-zara-recovered.webp |
| 15-history-preserved | 13 | 0.250008s | 0.666s | assets/capture/15-history-preserved.webp |
| 16-facilitator-kit | 15 | 0.316339s | 0.700s | assets/capture/16-facilitator-kit.webp |
| 17-loss-overview | 136 | 3.116837s | 3.533s | assets/capture/17-loss-overview.webp |
| 18-finish-preview | 191 | 5.338610s | 5.733s | assets/capture/18-finish-preview.webp |
