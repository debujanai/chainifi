import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { AddressTransactionsBoard } from "@/components/address-transactions-board";

export default function AddressTransactionsPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#141723]">
      <Sidebar />
      <AddressTransactionsBoard />
      <PropertiesPanel />
    </div>
  );
}

