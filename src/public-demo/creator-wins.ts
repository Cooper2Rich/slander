import { completedWindow, type PastResult } from "./leaderboard-history.ts";

// Use saved winner attribution, including ads that are no longer discoverable.
export function creatorLeaderboardWins(
  creatorId: string,
  history: PastResult[],
  now = new Date(),
) {
  return history
    .filter((result) => completedWindow(result.period, result.date, now))
    .flatMap((result) =>
      result.winners
        .filter((ad) => ad.creatorId === creatorId && ad.rank === 1)
        .map((ad) => ({
          id: `${result.campaignId}:${result.period}:${result.date}:${ad.id}`,
          campaignId: result.campaignId,
          campaignName: result.campaignName,
          period: result.period,
          date: result.date,
          joint: result.winners.length > 1,
          ad,
        })),
    )
    .sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
}

export type CreatorWin = ReturnType<typeof creatorLeaderboardWins>[number];
