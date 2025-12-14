import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { TGMDexTradesBoard } from "@/components/tgm-dex-trades-board";

export default function TGMDexTradesPage() {
  return (
    <div className="flex min-h-screen bg-[#141723]">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <TGMDexTradesBoard />
      </div>
      <PropertiesPanel />
    </div>
  );
}

