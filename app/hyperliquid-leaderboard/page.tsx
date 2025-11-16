import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { HyperliquidLeaderboardBoard } from "@/components/hyperliquid-leaderboard-board";

export default function HyperliquidLeaderboardPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#141723]">
      <Sidebar />
      <HyperliquidLeaderboardBoard />
      <PropertiesPanel />
    </div>
  );
}

