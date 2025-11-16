import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { AddressPerpTradesBoard } from "@/components/address-perp-trades-board";

export default function AddressPerpTradesPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#141723]">
      <Sidebar />
      <AddressPerpTradesBoard />
      <PropertiesPanel />
    </div>
  );
}

