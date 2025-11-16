import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { TGMPerpPositionsBoard } from "@/components/tgm-perp-positions-board";

export default function TGMPerpPositionsPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#141723]">
      <Sidebar />
      <TGMPerpPositionsBoard />
      <PropertiesPanel />
    </div>
  );
}

