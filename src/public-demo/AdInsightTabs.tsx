import { useId, useRef, useState } from "react";
import { AdMedia } from "./AdMedia";
import { count, ctr, fundedCents, money, type PublicAd } from "./catalog";

const tabs = ["Video", "CTR", "Impressions", "Ad spend"] as const;
type Tab = (typeof tabs)[number];

export function AdInsightTabs({ ad }: { ad: PublicAd }) {
  const [active, setActive] = useState<Tab>("Video");
  const id = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  return (
    <section className="ad-insights" aria-label={`Explore ${ad.title}`}>
      <div className="insight-tabs" role="tablist" aria-label="Story insights">
        {tabs.map((tab, index) => (
          <button
            key={tab}
            ref={(node) => {
              buttons.current[index] = node;
            }}
            type="button"
            role="tab"
            id={`${id}-tab-${index}`}
            aria-controls={`${id}-panel-${index}`}
            aria-selected={active === tab}
            tabIndex={active === tab ? 0 : -1}
            onClick={() => setActive(tab)}
            onKeyDown={(event) => {
              const next =
                event.key === "ArrowRight"
                  ? (index + 1) % tabs.length
                  : event.key === "ArrowLeft"
                    ? (index + tabs.length - 1) % tabs.length
                    : event.key === "Home"
                      ? 0
                      : event.key === "End"
                        ? tabs.length - 1
                        : null;
              if (next !== null) {
                event.preventDefault();
                setActive(tabs[next]);
                buttons.current[next]?.focus();
              }
            }}
          >
            {tab}
          </button>
        ))}
      </div>
      {tabs.map((tab, index) => (
        <div
          key={tab}
          role="tabpanel"
          id={`${id}-panel-${index}`}
          aria-labelledby={`${id}-tab-${index}`}
          hidden={active !== tab}
          tabIndex={0}
        >
          {tab === "Video" ? (
            <AdMedia key={`${ad.id}-${active}`} ad={ad} full />
          ) : tab === "CTR" ? (
            <div className="insight-value">
              <strong>{ctr(ad)}</strong>
              <h4>Sample click-through rate</h4>
              <p>
                Destination clicks divided by impressions × 100. A missing or
                zero denominator shows N/A. No live reporting is connected.
              </p>
            </div>
          ) : tab === "Impressions" ? (
            <div className="insight-value">
              <strong>{count(ad.impressions)}</strong>
              <h4>Sample impressions</h4>
              <p>
                Displays in the bundled weekly demo scenario, including repeat
                displays. Unique reach is unavailable. These are not verified
                adoption outcomes.
              </p>
            </div>
          ) : (
            <div className="insight-value">
              <strong>{money(fundedCents(ad.id))}</strong>
              <h4>Simulated ad support saved here</h4>
              <p>
                This browser's saved contributions across viewer profiles;
                separate from sample financial activity. Actual ad spend: N/A.
                No ads have been purchased by this demo.
              </p>
              <button className="button secondary" type="button" disabled>
                Live ad spending unavailable
              </button>
            </div>
          )}
        </div>
      ))}
    </section>
  );
}
