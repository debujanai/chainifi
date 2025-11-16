import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { PerpTradesBoard } from "@/components/perp-trades-board";

export default function Page() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#141723]">
      <Sidebar />
      <PerpTradesBoard />
      <PropertiesPanel />
    </div>
  );
}