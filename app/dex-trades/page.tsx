import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { DexTradesBoard } from "@/components/dex-trades-board";

export default function DexTradesPage() {
  return (
    <div className="flex min-h-screen bg-[#141723]">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <DexTradesBoard />
      </div>
      <PropertiesPanel />
    </div>
  );
}