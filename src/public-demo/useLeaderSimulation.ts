import { useEffect, useMemo, useState } from "react";
import type { PublicAd } from "./catalog";
import {
  periodAd,
  leaderboardWindow,
  type LeaderboardPeriod,
} from "./leaderboard-periods";
import { simulateLeaders } from "./leaderboard-simulation";

export const DEMO_UPDATE_INTERVAL = 6000;
const REFRESH_INTERVAL = 600000;
export function useLeaderSimulation(
  ads: PublicAd[] | null,
  period: LeaderboardPeriod,
  enabled: boolean,
) {
  const [updates, setUpdates] = useState({ period, tick: 0 });
  const [paused, setPaused] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [interacting, setInteracting] = useState(false);
  const [refresh, setRefresh] = useState(() => ({
    at: Date.now(),
    remaining: 600,
  }));
  useEffect(() => {
    if (!enabled) return;
    const timer = window.setInterval(() => {
      const now = Date.now();
      setRefresh((old) =>
        now - old.at >= REFRESH_INTERVAL
          ? { at: now, remaining: 600 }
          : {
              ...old,
              remaining: Math.ceil((REFRESH_INTERVAL - (now - old.at)) / 1000),
            },
      );
    }, 1000);
    return () => clearInterval(timer);
  }, [enabled]);
  const tick = updates.period === period ? updates.tick : 0;
  useEffect(() => {
    if (!enabled || !ads || paused || interacting) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "hidden") return;
      setUpdates((old) => ({
        period,
        tick: old.period === period ? old.tick + 1 : 1,
      }));
    }, DEMO_UPDATE_INTERVAL);
    return () => clearInterval(timer);
  }, [enabled, ads, period, paused, interacting]);
  const measurement = leaderboardWindow(period);
  const base = useMemo(
    () => (ads || []).map((ad) => periodAd(ad, measurement)),
    [ads, measurement.startsOn, measurement.through, period, refresh.at],
  );
  return {
    ads: simulateLeaders(base, tick),
    previous: simulateLeaders(base, Math.max(0, tick - 1)),
    tick,
    paused,
    interacting,
    setPaused,
    setInteracting,
    countdown: `${String(Math.floor(refresh.remaining / 60)).padStart(2, "0")}:${String(refresh.remaining % 60).padStart(2, "0")}`,
  };
}
