import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { TGMPerpPositionsBoard } from "@/components/tgm-perp-positions-board";

export default function TGMPerpPositionsPage() {
  return (
    <div className="flex min-h-screen bg-[#141723]">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <TGMPerpPositionsBoard />
      </div>
      <PropertiesPanel />
    </div>
  );
}

