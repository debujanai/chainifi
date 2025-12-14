import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { PerpScreenerBoard } from "@/components/perp-screener-board";

export default function PerpScreenerPage() {
  return (
    <div className="flex min-h-screen bg-[#141723]">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <PerpScreenerBoard />
      </div>
      <PropertiesPanel />
    </div>
  );
}

