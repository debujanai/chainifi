import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { TGMPnlLeaderboardBoard } from "@/components/tgm-pnl-leaderboard-board";

export default function TGMPnlLeaderboardPage() {
  return (
    <div className="flex min-h-screen bg-[#141723]">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <TGMPnlLeaderboardBoard />
      </div>
      <PropertiesPanel />
    </div>
  );
}