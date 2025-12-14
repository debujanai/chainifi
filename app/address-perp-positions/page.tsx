import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { AddressPerpPositionsBoard } from "@/components/address-perp-positions-board";

export default function AddressPerpPositionsPage() {
  return (
    <div className="flex min-h-screen bg-[#141723]">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <AddressPerpPositionsBoard />
      </div>
      <PropertiesPanel />
    </div>
  );
}

