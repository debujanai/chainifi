import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { TGMPnlLeaderboardBoard } from "@/components/tgm-pnl-leaderboard-board";

export default function TGMPnlLeaderboardPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#141723]">
      <Sidebar />
      <TGMPnlLeaderboardBoard />
      <PropertiesPanel />
    </div>
  );
}