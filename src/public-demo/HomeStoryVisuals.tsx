import { Heart, PenTool, Users } from "lucide-react";
import { demoAsset } from "../runtime";

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

const stepPhotos = {
  discover: {
    file: "how-discover.jpg",
    alt: "Volunteers working together to clean their neighborhood.",
  },
  connect: {
    file: "how-connect.jpg",
    alt: "An independent filmmaker setting up a camera to tell a story.",
  },
  amplify: {
    file: "how-amplify.jpg",
    alt: "Community volunteers preparing food and supplies for people in need.",
  },
};

export function StepVisual({ step }: { step: keyof typeof stepPhotos }) {
  const photo = stepPhotos[step];
  return (
    <div className={`how-step-visual ${step}`}>
      <img
        src={demoAsset(`images/${photo.file}`)}
        alt={photo.alt}
        width={1200}
        height={800}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}
