import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { AddressLabelsBoard } from "@/components/address-labels-board";

export default function AddressLabelsPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#141723]">
      <Sidebar />
      <AddressLabelsBoard />
      <PropertiesPanel />
    </div>
  );
}

