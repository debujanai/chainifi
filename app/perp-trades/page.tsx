import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { PerpTradesBoard } from "@/components/perp-trades-board";

export default function Page() {
  return (
    <div className="flex min-h-screen bg-[#141723]">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <PerpTradesBoard />
      </div>
      <PropertiesPanel />
    </div>
  );
}