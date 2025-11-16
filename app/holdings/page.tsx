import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { HoldingsBoard } from "@/components/holdings-board";

export default function HoldingsPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#141723]">
      <Sidebar />
      <HoldingsBoard />
      <PropertiesPanel />
    </div>
  );
}