import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { DexTradesBoard } from "@/components/dex-trades-board";

export default function DexTradesPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#141723]">
      <Sidebar />
      <DexTradesBoard />
      <PropertiesPanel />
    </div>
  );
}