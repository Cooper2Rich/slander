import {
  Heart,
  Megaphone,
  PenTool,
  Play,
  Search,
  UserRound,
  Users,
} from "lucide-react";

export function MissionVisual() {
  return (
    <figure className="mission-visual">
      <svg
        viewBox="0 0 420 280"
        role="img"
        aria-labelledby="mission-visual-title mission-visual-desc"
      >
        <title id="mission-visual-title">
          One story creates a ripple of support
        </title>
        <desc id="mission-visual-desc">
          Creators tell stories for causes. Community support helps those
          stories reach more people.
        </desc>
        <defs>
          <radialGradient id="mission-glow">
            <stop
              stopColor="var(--illustration-accent, #286a9b)"
              stopOpacity=".6"
            />
            <stop
              offset="1"
              stopColor="var(--illustration-accent, #102036)"
              stopOpacity="0"
            />
          </radialGradient>
        </defs>
        <rect
          width="420"
          height="280"
          rx="20"
          fill="var(--illustration-canvas, #0f1c2c)"
        />
        <circle cx="210" cy="142" r="138" fill="url(#mission-glow)" />
        {[55, 92, 130].map((radius) => (
          <circle
            key={radius}
            cx="210"
            cy="142"
            r={radius}
            fill="none"
            stroke="var(--illustration-line, #345f82)"
            strokeWidth="1"
            opacity=".65"
          />
        ))}
        <path
          d="M128 143H156M264 143H292"
          stroke="var(--illustration-accent, #84ceff)"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
        <path
          d="m149 138 6 5-6 5m136-10 6 5-6 5"
          fill="none"
          stroke="var(--illustration-accent, #84ceff)"
          strokeWidth="2"
        />
        <g
          fill="var(--illustration-shape, #162d43)"
          stroke="var(--illustration-line, #426d8d)"
        >
          <rect x="20" y="102" width="108" height="88" rx="15" />
          <rect x="156" y="102" width="108" height="88" rx="15" />
          <rect x="292" y="102" width="108" height="88" rx="15" />
        </g>
        <PenTool
          x={61}
          y={118}
          width={26}
          height={26}
          color="var(--illustration-ink, #9ad8ff)"
          strokeWidth={1.6}
        />
        <Heart
          x={197}
          y={118}
          width={26}
          height={26}
          color="var(--illustration-ink, #a7e8d4)"
          strokeWidth={1.6}
        />
        <Users
          x={333}
          y={118}
          width={26}
          height={26}
          color="var(--illustration-ink, #d4c6ff)"
          strokeWidth={1.6}
        />
        <g
          fill="var(--illustration-ink, #e0f1ff)"
          fontFamily="inherit"
          fontSize="12"
          textAnchor="middle"
        >
          <text x="74" y="169">
            Creators
          </text>
          <text x="210" y="169">
            Causes
          </text>
          <text x="346" y="169">
            Community
          </text>
        </g>
        <circle
          cx="210"
          cy="49"
          r="4"
          fill="var(--illustration-ink, #a7e8d4)"
        />
        <circle
          cx="102"
          cy="213"
          r="3"
          fill="var(--illustration-ink, #91d0ff)"
        />
        <circle
          cx="316"
          cy="215"
          r="3"
          fill="var(--illustration-ink, #c1b0ee)"
        />
        <text
          x="210"
          y="246"
          textAnchor="middle"
          fill="var(--illustration-ink, #a2c8e5)"
          fontFamily="inherit"
          fontSize="10"
          letterSpacing="1.6"
        >
          ONE STORY. MANY RIPPLES.
        </text>
      </svg>
      <figcaption>
        Creativity connects us. Support carries it further.
      </figcaption>
    </figure>
  );
}

export function StepVisual({
  step,
}: {
  step: "discover" | "connect" | "amplify";
}) {
  return (
    <div className={`how-step-visual ${step}`} aria-hidden="true">
      <svg viewBox="0 0 320 180" focusable="false">
        <rect
          width="320"
          height="180"
          rx="14"
          fill="var(--illustration-canvas, #101f31)"
        />
        {step === "discover" && (
          <>
            <path
              d="M10 137C65 110 50 45 128 53s82 108 180 69"
              stroke="var(--illustration-line, #396c94)"
              strokeDasharray="5 6"
              strokeWidth="2"
              fill="none"
            />
            <rect
              x="57"
              y="24"
              width="94"
              height="126"
              rx="12"
              fill="var(--illustration-shape, #203c4d)"
              stroke="var(--illustration-line, #4c778c)"
              transform="rotate(-8 104 87)"
            />
            <Heart
              x={88}
              y={49}
              width={31}
              height={31}
              color="var(--illustration-ink, #a5e5ce)"
              strokeWidth={1.5}
            />
            <path
              d="M78 104h49m-47 12h31"
              stroke="var(--illustration-line, #6b9b9d)"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <rect
              x="166"
              y="46"
              width="94"
              height="116"
              rx="12"
              fill="var(--illustration-shape, #173c5c)"
              stroke="var(--illustration-line, #4d8bb7)"
              transform="rotate(7 213 104)"
            />
            <path
              d="m179 108 19-22 15 15 14-11 24 28"
              stroke="var(--illustration-accent, #70b6de)"
              strokeWidth="2"
              fill="none"
            />
            <circle
              cx="226"
              cy="75"
              r="7"
              fill="var(--illustration-ink, #8ccbe7)"
            />
            <circle
              cx="249"
              cy="39"
              r="24"
              fill="var(--illustration-shape, #214b6c)"
              stroke="var(--illustration-accent, #75bde9)"
            />
            <Search
              x={238}
              y={28}
              width={22}
              height={22}
              color="var(--illustration-ink, #d6eeff)"
            />
          </>
        )}
        {step === "connect" && (
          <>
            <circle
              cx="160"
              cy="91"
              r="73"
              fill="var(--illustration-shape, #152d46)"
            />
            <rect
              x="83"
              y="17"
              width="154"
              height="147"
              rx="13"
              fill="var(--illustration-shape, #1b334a)"
              stroke="var(--illustration-line, #4c789d)"
            />
            <circle
              cx="109"
              cy="42"
              r="13"
              fill="var(--illustration-accent, #34577b)"
            />
            <UserRound
              x={101}
              y={34}
              width={16}
              height={16}
              color="var(--illustration-ink, #bddeff)"
            />
            <path
              d="M133 38h77m-77 10h50"
              stroke="var(--illustration-line, #577fa0)"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <rect
              x="98"
              y="70"
              width="124"
              height="67"
              rx="8"
              fill="var(--illustration-shape, #284d62)"
            />
            <path
              d="m99 128 33-31 26 23 27-15 36 24"
              fill="var(--illustration-accent, #365f72)"
            />
            <circle
              cx="193"
              cy="86"
              r="6"
              fill="var(--illustration-accent, #78acb8)"
            />
            <circle
              cx="160"
              cy="103"
              r="18"
              fill="var(--illustration-shape, #152d43)"
              stroke="var(--illustration-accent, #a4d9ff)"
            />
            <Play
              x={152}
              y={95}
              width={16}
              height={16}
              color="var(--illustration-ink, #d9efff)"
              fill="var(--illustration-ink, #d9efff)"
            />
            <path
              d="M235 77h25a13 13 0 0 1 13 13v8a13 13 0 0 1-13 13h-13l-13 9v-13a13 13 0 0 1-9-12v-5a13 13 0 0 1 10-13"
              fill="var(--illustration-shape, #245458)"
              stroke="var(--illustration-accent, #81bfb8)"
            />
            <Heart
              x={240}
              y={86}
              width={19}
              height={19}
              color="var(--illustration-ink, #c7f0dd)"
            />
          </>
        )}
        {step === "amplify" && (
          <>
            {[45, 66, 85].map((radius) => (
              <circle
                key={radius}
                cx="151"
                cy="88"
                r={radius}
                fill="none"
                stroke="var(--illustration-line, #315b7c)"
                opacity=".7"
              />
            ))}
            <circle
              cx="151"
              cy="88"
              r="43"
              fill="var(--illustration-shape, #1b4867)"
            />
            <Megaphone
              x={127}
              y={64}
              width={48}
              height={48}
              color="var(--illustration-ink, #bce5ff)"
              strokeWidth={1.5}
            />
            <path
              d="M211 63q25 25 0 50m17-64q39 39 0 78"
              fill="none"
              stroke="var(--illustration-accent, #8dd5e6)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle
              cx="251"
              cy="139"
              r="19"
              fill="var(--illustration-shape, #22514d)"
              stroke="var(--illustration-accent, #89cdb5)"
            />
            <Heart
              x={242}
              y={130}
              width={18}
              height={18}
              color="var(--illustration-ink, #bdeed8)"
            />
            <circle
              cx="63"
              cy="43"
              r="16"
              fill="var(--illustration-shape, #344567)"
            />
            <Users
              x={54}
              y={34}
              width={18}
              height={18}
              color="var(--illustration-ink, #d2d8ff)"
            />
            <circle
              cx="82"
              cy="142"
              r="13"
              fill="var(--illustration-shape, #20425b)"
            />
            <UserRound
              x={74}
              y={134}
              width={16}
              height={16}
              color="var(--illustration-ink, #afd8f1)"
            />
          </>
        )}
      </svg>
    </div>
  );
}
