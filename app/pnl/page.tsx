import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { PnlBoard } from "@/components/pnl-board";

export default function PnlPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#141723]">
      <Sidebar />
      <PnlBoard />
      <PropertiesPanel />
    </div>
  );
}

