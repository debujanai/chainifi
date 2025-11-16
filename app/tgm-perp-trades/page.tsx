import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { TGMPerpTradesBoard } from "@/components/tgm-perp-trades-board";

export default function TGMPerpTradesPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#141723]">
      <Sidebar />
      <TGMPerpTradesBoard />
      <PropertiesPanel />
    </div>
  );
}

