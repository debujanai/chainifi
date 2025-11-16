import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { AddressPerpPositionsBoard } from "@/components/address-perp-positions-board";

export default function AddressPerpPositionsPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#141723]">
      <Sidebar />
      <AddressPerpPositionsBoard />
      <PropertiesPanel />
    </div>
  );
}

