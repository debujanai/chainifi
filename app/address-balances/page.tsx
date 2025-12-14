import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { AddressBalancesBoard } from "@/components/address-balances-board";

export default function AddressBalancesPage() {
  return (
    <div className="flex min-h-screen bg-[#141723]">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <AddressBalancesBoard />
      </div>
      <PropertiesPanel />
    </div>
  );
}