import { Fragment, useEffect, useState } from "react";
import { Heart, PenTool, Users } from "lucide-react";
import { demoAsset } from "../runtime";

const missionNodes = [
  {
    key: "creators",
    label: "Creators",
    Icon: PenTool,
    file: "why-creators.jpg",
    alt: "An artist at work in a sunlit painting studio.",
  },
  {
    key: "causes",
    label: "Causes",
    Icon: Heart,
    file: "why-causes.jpg",
    alt: "A volunteer carrying a box of donations.",
  },
  {
    key: "community",
    label: "Community",
    Icon: Users,
    file: "why-community.jpg",
    alt: "Friends walking together through a park.",
  },
] as const;

const missionStepMs = 2600;

export function MissionVisual() {
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setAnimate(!motion.matches);
    update();
    motion.addEventListener("change", update);
    return () => motion.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!animate || hovered !== null) return;
    const timer = window.setInterval(
      () => setActive((current) => (current + 1) % missionNodes.length),
      missionStepMs,
    );
    return () => window.clearInterval(timer);
  }, [animate, hovered]);

  const current = hovered ?? active;
  return (
    <figure
      className={`mission-visual${animate ? " is-playing" : ""}`}
      data-active={animate ? missionNodes[current].key : undefined}
    >
      <div
        className="mission-scene"
        role="group"
        aria-label="One story creates a ripple of support: creators tell stories for causes, and community support helps them reach more people."
      >
        <img
          className="mission-backdrop"
          src={demoAsset("images/why-landscape.jpg")}
          alt=""
          width={1200}
          height={800}
          loading="lazy"
          decoding="async"
        />
        <span className="mission-rings" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <div className="mission-flow">
          {missionNodes.map(({ key, label, Icon, file, alt }, index) => (
            <Fragment key={key}>
              {index > 0 && (
                <span
                  className={`mission-arrow${
                    animate && hovered === null && current === index - 1
                      ? " is-flowing"
                      : ""
                  }`}
                  aria-hidden="true"
                >
                  <i />
                </span>
              )}
              <div
                className={`mission-node ${key}${
                  animate && current === index ? " is-active" : ""
                }`}
                onMouseEnter={() => setHovered(index)}
                onMouseLeave={() => {
                  setHovered(null);
                  setActive(index);
                }}
              >
                <div className="mission-node-photo">
                  <img
                    src={demoAsset(`images/${file}`)}
                    alt={alt}
                    width={1200}
                    height={800}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <span className="mission-node-label">
                  <Icon size={13} strokeWidth={1.8} aria-hidden="true" />
                  {label}
                </span>
              </div>
            </Fragment>
          ))}
        </div>
        <p className="mission-tagline">ONE STORY. MANY RIPPLES.</p>
      </div>
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
