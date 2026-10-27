import { Link } from "react-router-dom";
import { Wallet } from "lucide-react";
import { useWorkspace } from "../context";
import { AdPlatformsPage } from "./AdPlatforms";
import { CompletedAdSpend } from "./CompletedAdSpend";

export function CampaignSpendOverview() {
  const { campaignScope } = useWorkspace();
  return (
    <section className="campaign-spend-overview" aria-label="Campaign ad spend">
      <div className="campaign-spend-heading">
        <div>
          <Wallet size={20} />
          <h2>Campaign ad spend</h2>
        </div>
        <Link
          className="text-button"
          to={`/campaigns/${campaignScope!.id}/ad-platforms`}
        >
          Platform connections ↗
        </Link>
      </div>
      <details className="campaign-allocation-setup">
        <summary>
          Set ad spend allocation{" "}
          <span>Daily limit, campaign cap and Meta / TikTok split</span>
        </summary>
        <AdPlatformsPage embedded />
      </details>
      <CompletedAdSpend />
    </section>
  );
}
