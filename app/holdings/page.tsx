import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { HoldingsBoard } from "@/components/holdings-board";

export default function HoldingsPage() {
  return (
    <div className="flex min-h-screen bg-[#141723]">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <HoldingsBoard />
      </div>
      <PropertiesPanel />
    </div>
  );
}