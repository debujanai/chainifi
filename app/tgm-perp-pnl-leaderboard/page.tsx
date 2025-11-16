import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { TGMPerpPnlLeaderboardBoard } from "@/components/tgm-perp-pnl-leaderboard-board";

export default function TGMPerpPnlLeaderboardPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#141723]">
      <Sidebar />
      <TGMPerpPnlLeaderboardBoard />
      <PropertiesPanel />
    </div>
  );
}

