import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { AddressPerpTradesBoard } from "@/components/address-perp-trades-board";

export default function AddressPerpTradesPage() {
  return (
    <div className="flex min-h-screen bg-[#141723]">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <AddressPerpTradesBoard />
      </div>
      <PropertiesPanel />
    </div>
  );
}

