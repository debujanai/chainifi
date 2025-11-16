import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { HistoricalHoldingsBoard } from "@/components/historical-holdings-board";

export default function HistoricalHoldingsPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#141723]">
      <Sidebar />
      <HistoricalHoldingsBoard />
      <PropertiesPanel />
    </div>
  );
}