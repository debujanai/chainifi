import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { AddressLabelsBoard } from "@/components/address-labels-board";

export default function AddressLabelsPage() {
  return (
    <div className="flex min-h-screen bg-[#141723]">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <AddressLabelsBoard />
      </div>
      <PropertiesPanel />
    </div>
  );
}

