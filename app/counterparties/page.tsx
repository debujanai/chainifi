import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { CounterpartiesBoard } from "@/components/counterparties-board";

export default function CounterpartiesPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#141723]">
      <Sidebar />
      <CounterpartiesBoard />
      <PropertiesPanel />
    </div>
  );
}

