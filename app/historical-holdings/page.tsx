import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { HistoricalHoldingsBoard } from "@/components/historical-holdings-board";

export default function HistoricalHoldingsPage() {
  return (
    <div className="flex min-h-screen bg-[#141723]">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <HistoricalHoldingsBoard />
      </div>
      <PropertiesPanel />
    </div>
  );
}