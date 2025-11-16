import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { TGMDexTradesBoard } from "@/components/tgm-dex-trades-board";

export default function TGMDexTradesPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#141723]">
      <Sidebar />
      <TGMDexTradesBoard />
      <PropertiesPanel />
    </div>
  );
}

