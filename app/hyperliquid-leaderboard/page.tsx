import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { HyperliquidLeaderboardBoard } from "@/components/hyperliquid-leaderboard-board";

export default function HyperliquidLeaderboardPage() {
  return (
    <div className="flex min-h-screen bg-[#141723]">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <HyperliquidLeaderboardBoard />
      </div>
      <PropertiesPanel />
    </div>
  );
}

