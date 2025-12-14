import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { AddressTransactionsBoard } from "@/components/address-transactions-board";

export default function AddressTransactionsPage() {
  return (
    <div className="flex min-h-screen bg-[#141723]">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <AddressTransactionsBoard />
      </div>
      <PropertiesPanel />
    </div>
  );
}

