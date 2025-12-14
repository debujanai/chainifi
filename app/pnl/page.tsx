import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { PnlBoard } from "@/components/pnl-board";

export default function PnlPage() {
  return (
    <div className="flex min-h-screen bg-[#141723]">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <PnlBoard />
      </div>
      <PropertiesPanel />
    </div>
  );
}

