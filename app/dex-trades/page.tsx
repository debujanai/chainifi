import { Sidebar } from "@/components/sidebar";
import { DexTradesView } from "@/components/dex-trades-view";
import { PropertiesPanel } from "@/components/properties-panel";

export default function DexTradesPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#141723]">
      <Sidebar />
      <DexTradesView />
      <PropertiesPanel />
    </div>
  );
}
