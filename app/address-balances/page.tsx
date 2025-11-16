import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { AddressBalancesBoard } from "@/components/address-balances-board";

export default function AddressBalancesPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#141723]">
      <Sidebar />
      <AddressBalancesBoard />
      <PropertiesPanel />
    </div>
  );
}