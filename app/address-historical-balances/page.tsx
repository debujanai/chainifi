import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { AddressHistoricalBalancesBoard } from "@/components/address-historical-balances-board";

export default function AddressHistoricalBalancesPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#141723]">
      <Sidebar />
      <AddressHistoricalBalancesBoard />
      <PropertiesPanel />
    </div>
  );
}


