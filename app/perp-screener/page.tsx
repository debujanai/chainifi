import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { PerpScreenerBoard } from "@/components/perp-screener-board";

export default function PerpScreenerPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#141723]">
      <Sidebar />
      <PerpScreenerBoard />
      <PropertiesPanel />
    </div>
  );
}

