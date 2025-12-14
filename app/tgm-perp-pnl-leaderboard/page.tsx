import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { TGMPerpPnlLeaderboardBoard } from "@/components/tgm-perp-pnl-leaderboard-board";

export default function TGMPerpPnlLeaderboardPage() {
  return (
    <div className="flex min-h-screen bg-[#141723]">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <TGMPerpPnlLeaderboardBoard />
      </div>
      <PropertiesPanel />
    </div>
  );
}

