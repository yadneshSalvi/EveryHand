import { Check, Pause, Play, RotateCcw } from "lucide-react";
import {
  learnerState,
  type Plan,
  type Schedule,
  type Disruption,
} from "./solver";
export function Microscope({
  x = 0,
  y = 0,
  scale = 1,
}: {
  x?: number;
  y?: number;
  scale?: number;
}) {
  return (
    <g
      transform={`translate(${x} ${y}) scale(${scale})`}
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      <path d="M-19 25h39M-10 24c-8-10-4-23 5-29M7-13c17 7 19 31 3 36M-12 6h24M-1-23l10 5-9 18-10-5z" />
      <path d="m3-26 8 4M-18 26v4h41v-4" />
      <circle cx="7" cy="8" r="3" fill="currentColor" />
    </g>
  );
}
export default function Room({
  plan,
  result,
  minute,
  setMinute,
  playing,
  setPlaying,
  onSelect,
  selected,
  disruption,
}: {
  plan: Plan;
  result: Schedule;
  minute: number;
  setMinute: (n: number) => void;
  playing: boolean;
  setPlaying: (b: boolean) => void;
  onSelect: (i: number) => void;
  selected: number | null;
  disruption: Disruption | null;
}) {
  const first = plan.tasks[0];
  const historical =
    !!disruption && disruption.task === first.id && minute < disruption.minute;
  const visibleCapacity = first.capacity + (historical ? 1 : 0);
  const shown = Math.min(visibleCapacity, 6);
  const isMicroscope = /microsc|specimen/i.test(first.name);
  const stations = Array.from({ length: shown }, (_, i) => ({
    x: 590 + (i % 2) * 155,
    y: 115 + Math.floor(i / 2) * 105,
  }));
  const active = result.slots.filter(
    (s) => s.start <= minute && s.end > minute && s.task === first.id,
  );
  const complete = plan.learners.filter(
    (_, i) => learnerState(i, plan, result, minute) === "complete",
  ).length;
  return (
    <section
      className="workshop-panel"
      aria-label="Interactive workshop preview"
    >
      <div className="panel-top">
        <div>
          <span className="eyebrow">THE WORKSHOP</span>
          <span className="view-label">A place for every learner</span>
        </div>
        <span className="preview-badge">
          <i />
          Preview <b>{String(minute).padStart(2, "0")}:00</b>
        </span>
      </div>
      <div className="mobile-room-hint">
        One dot, one learner. <span>Swipe to explore the room →</span>
      </div>
      <div
        className="room-wrap"
        tabIndex={0}
        role="region"
        aria-label="Workshop floor plan; scroll horizontally on small screens"
      >
        <svg
          className="room-svg"
          viewBox="0 0 900 390"
          aria-label={`${plan.learners.length} learners, ${visibleCapacity} first-activity places, ${active.length} first-activity turns active at minute ${minute}`}
        >
          <defs>
            <pattern
              id="grid"
              width="24"
              height="24"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="1" cy="1" r=".7" fill="#b9c2b0" opacity=".32" />
            </pattern>
            <filter
              id="bench-shadow"
              x="-30%"
              y="-30%"
              width="160%"
              height="180%"
            >
              <feDropShadow
                dx="0"
                dy="5"
                stdDeviation="0"
                floodColor="#263e31"
                floodOpacity=".08"
              />
            </filter>
          </defs>
          <rect x="22" y="22" width="856" height="346" rx="18" fill="#eeefe5" />
          <rect
            x="22"
            y="22"
            width="856"
            height="346"
            rx="18"
            fill="url(#grid)"
          />
          <path d="M456 43v304" stroke="#c5ccbc" strokeDasharray="4 7" />
          <text x="55" y="62" className="svg-eyebrow">
            THE LEARNERS
          </text>
          <text x="510" y="62" className="svg-eyebrow">
            {first.name.toUpperCase().slice(0, 30)}
          </text>
          <path
            d="M866 282v50c0 13-10 24-24 24h-44"
            fill="none"
            stroke="#a8b79e"
            strokeWidth="3"
          />
          <path
            d="m813 352-15 4 15 4"
            fill="none"
            stroke="#a8b79e"
            strokeWidth="2"
          />
          {stations.map((s, i) => {
            const occupant = active.find((a) => a.resource === i);
            return (
              <g key={i} className={occupant ? "bench occupied" : "bench"}>
                {occupant && (
                  <path
                    className="movement-path"
                    d={`M410 ${140 + (i % 3) * 55}C470 ${140 + (i % 3) * 55},470 ${s.y},${s.x - 57} ${s.y}`}
                    stroke="#da8e62"
                    fill="none"
                    strokeWidth="1.7"
                    strokeDasharray="4 7"
                  />
                )}
                <rect
                  x={s.x - 34}
                  y={s.y - 30}
                  width="100"
                  height="72"
                  rx="12"
                  fill={occupant ? "#dfd9b9" : "#dde4d3"}
                  stroke="#b8c5ab"
                  filter="url(#bench-shadow)"
                />
                <rect
                  x={s.x - 25}
                  y={s.y - 20}
                  width="82"
                  height="52"
                  rx="7"
                  fill={occupant ? "#f4edcf" : "#edf0e4"}
                  stroke="#c0c9b6"
                />
                <g color="#3c5846">
                  {isMicroscope ? (
                    <Microscope x={s.x + 17} y={s.y + 1} scale={0.72} />
                  ) : (
                    <g
                      transform={`translate(${s.x + 17} ${s.y})`}
                      stroke="#657e53"
                      fill="#f6f3df"
                      strokeWidth="2"
                    >
                      <rect x="-15" y="-18" width="30" height="37" rx="3" />
                      <path d="M-8-8H8M-8 0H8M-8 8H3" />
                    </g>
                  )}
                </g>
                <text
                  x={s.x + 15}
                  y={s.y + 61}
                  textAnchor="middle"
                  className="station-label"
                >
                  PLACE {String(i + 1).padStart(2, "0")}
                </text>
                {occupant && (
                  <g>
                    <circle
                      cx={s.x - 55}
                      cy={s.y + 3}
                      r="20"
                      fill="#e58251"
                      stroke="#f7f5ee"
                      strokeWidth="4"
                    />
                    <text
                      x={s.x - 55}
                      y={s.y + 8}
                      textAnchor="middle"
                      className="token-number active-text"
                    >
                      {String(occupant.learner + 1).padStart(2, "0")}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
          {visibleCapacity > 6 && (
            <text x="670" y="365" textAnchor="middle" className="station-label">
              + {visibleCapacity - 6} additional places in schedule
            </text>
          )}
          {visibleCapacity === 0 && (
            <g>
              <text x="665" y="175" textAnchor="middle" className="svg-empty">
                The bench is paused.
              </text>
              <text
                x="665"
                y="201"
                textAnchor="middle"
                className="station-label"
              >
                No working places remain.
              </text>
            </g>
          )}
          {plan.learners.map((name, i) => {
            const state = learnerState(i, plan, result, minute);
            const firstActive = active.find((a) => a.learner === i);
            const x = 69 + (i % 7) * 51,
              y = 112 + Math.floor(i / 7) * 48;
            const compressed = plan.learners.length > 35;
            const yy = compressed ? 95 + Math.floor(i / 7) * 29 : y;
            const radius = compressed ? 12 : 17;
            return (
              <g
                key={i}
                role="button"
                tabIndex={0}
                aria-label={`Learner ${i + 1}, ${name}, ${state}. View turns`}
                onClick={() => onSelect(i)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(i);
                  }
                }}
                className={`learner-token ${state} ${selected === i ? "selected" : ""}`}
                opacity={
                  firstActive?.resource !== undefined &&
                  firstActive.resource < 6
                    ? 0.2
                    : 1
                }
              >
                {selected === i && (
                  <circle
                    cx={x}
                    cy={yy}
                    r={radius + 5}
                    fill="none"
                    stroke="#243d32"
                    strokeWidth="1.5"
                  />
                )}
                <circle cx={x} cy={yy} r={radius} className="token-circle" />
                <text
                  x={x}
                  y={yy + 4}
                  textAnchor="middle"
                  className={`token-number ${compressed ? "small" : ""}`}
                >
                  {String(i + 1).padStart(2, "0")}
                </text>
              </g>
            );
          })}
          <g transform="translate(58 335)">
            <rect width="15" height="15" rx="4" fill="#d5e1cb" />
            <path
              d="m4 8 3 3 5-6"
              fill="none"
              stroke="#536f45"
              strokeWidth="1.5"
            />
            <text x="24" y="12" className="room-caption">
              {complete} complete at this moment
            </text>
          </g>
          <text x="847" y="342" textAnchor="end" className="room-note">
            {plan.origin === "example" ? "FICTIONAL CLASS" : "YOUR PLAN"} ·
            SCHEDULE PREVIEW
          </text>
        </svg>
      </div>
      <div className="room-legend">
        <span>
          <i className="legend-dot done" />
          Complete
        </span>
        <span>
          <i className="legend-dot active" />
          Taking a turn
        </span>
        <span>
          <i className="legend-dot waiting" />
          Scheduled
        </span>
        <span>
          <i className="legend-dot missing" />
          No full turn
        </span>
      </div>
      <div className="timeline">
        <button
          className="play-button"
          aria-label={playing ? "Pause preview" : "Play preview"}
          onClick={() => {
            if (minute >= plan.minutes) setMinute(0);
            setPlaying(!playing);
          }}
        >
          {playing ? (
            <Pause size={16} fill="currentColor" />
          ) : (
            <Play size={16} fill="currentColor" />
          )}
        </button>
        <button
          className="icon-button restart"
          aria-label="Restart preview"
          onClick={() => {
            setMinute(0);
            setPlaying(false);
          }}
        >
          <RotateCcw size={15} />
        </button>
        <div className="scrub-area">
          <div className="scrub-labels">
            <span>
              {String(minute).padStart(2, "0")}:00 <small>preview</small>
            </span>
            <span>{plan.minutes}:00</span>
          </div>
          <input
            type="range"
            min="0"
            max={plan.minutes}
            step="1"
            value={minute}
            aria-label="Preview minute"
            onChange={(e) => {
              setMinute(+e.target.value);
              setPlaying(false);
            }}
            style={
              {
                "--progress": `${(minute / plan.minutes) * 100}%`,
              } as React.CSSProperties
            }
          />
          <div className="timeline-ticks">
            <span>Start</span>
            {disruption && (
              <span className="loss-tick">
                Resource lost at {disruption.minute}:00
              </span>
            )}
            <span>Session ends</span>
          </div>
        </div>
      </div>
      <div className="room-foot">
        <Check size={13} />
        <span>Every dot is one learner. Every turn is theirs.</span>
        <span>Not live attendance</span>
      </div>
    </section>
  );
}
